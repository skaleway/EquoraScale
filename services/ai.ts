
/// <reference types="vite/client" />

/**
 * AI Service for Eqorascale
 * Reverted to OpenRouter API implementation via standard fetch.
 */

import { classifyDocument } from './classifier';

const AI_TIMEOUT_MS = 10_000;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

type GroqMessage = { role: 'system' | 'user' | 'assistant'; content: string };

const streamGroqCompletion = async (
  messages: GroqMessage[],
  onDelta: (chunk: string) => void,
  signal?: AbortSignal,
) => {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages,
      temperature: 0.5,
      top_p: 1,
      max_completion_tokens: 1024,
      stream: true,
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Groq API Error: ${response.status} ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let done = false;

  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    if (!value) continue;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter((line) => line.trim().length > 0);
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const data = line.replace(/^data:\s*/, '');
      if (data === '[DONE]') return;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) onDelta(delta);
      } catch {
        // ignore partial JSON parse errors
      }
    }
  }
};

export const analyzeDocument = async (fileName: string, content: string) => {
  const fallback = classifyDocument(fileName, content);
  try {
    const trimmed = (content || '').trim();
    const payloadText =
      trimmed.length > 0
        ? trimmed.substring(0, 6000)
        : `No extracted text available. Infer from file name: ${fileName}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
    let raw = '';
    try {
      await streamGroqCompletion(
        [
          {
            role: 'system',
            content:
              'You are a specialized industrial document analyzer. If text is missing, infer from file name. Return ONLY valid JSON with keys: summary (string) and suggestedTags (array of 3 short tags).',
          },
          {
            role: 'user',
            content: `File Name: ${fileName}\nText content: ${payloadText}`,
          },
        ],
        (delta) => {
          raw += delta;
        },
        controller.signal,
      );
    } finally {
      clearTimeout(timeout);
    }

    const parsed = JSON.parse(raw);
    const suggestedTags = Array.isArray(parsed.suggestedTags)
      ? parsed.suggestedTags
      : fallback.suggestedTags;

    return {
      documentType: fallback.documentType,
      summary: parsed.summary || fallback.summary,
      suggestedTags,
      confidence: fallback.confidence,
      signals: fallback.signals,
    };
  } catch (error) {
    console.error('Groq Summary Error:', error);
    return {
      documentType: fallback.documentType,
      summary: fallback.summary,
      suggestedTags: fallback.suggestedTags,
      confidence: fallback.confidence,
      signals: fallback.signals,
    };
  }
};

export const askDocumentQuestionStream = async (
  fileName: string,
  content: string,
  question: string,
  onDelta: (chunk: string) => void,
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    await streamGroqCompletion(
      [
        {
          role: 'system',
          content:
            'You are an expert supply chain analyst. Provide accurate, professional answers based on the provided document context. Use markdown for clarity.',
        },
        {
          role: 'user',
          content: `Document: ${fileName}\nContext: ${content.substring(0, 15000)}\n\nUser Question: ${question}`,
        },
      ],
      onDelta,
      controller.signal,
    );
  } finally {
    clearTimeout(timeout);
  }
};
