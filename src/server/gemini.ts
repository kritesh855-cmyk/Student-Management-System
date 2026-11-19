import { GoogleGenAI } from '@google/genai';

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: [text],
    });
    return result.embeddings?.[0]?.values ?? [];
  } catch (error) {
    console.error('Embedding generation failed:', error);
    return [];
  }
}

export async function transcribeAudioBase64(
  base64Data: string,
  mimeType: string
): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3.5-transcribe',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        {
          text: 'Transcribe this voice command accurately. The speaker may speak English, Hindi, or a mix of Hindi and English. Return only the clean transcription.',
        },
      ],
    },
  });
  return (response.text ?? '').trim();
}

export async function synthesizeSpeechBase64(text: string): Promise<string | null> {
  const clipped = text.slice(0, 1200);
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash-lite-tts',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: clipped,
            speechMetadata: {
              style: 'Calm, articulate personal executive assistant',
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio ?? null;
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /system\s*prompt/i,
  /you\s+are\s+now\s+/i,
  /forward\s+all\s+(emails|secrets|passwords|tokens)/i,
  /exfiltrate/i,
  /execute\s+without\s+approval/i,
  /disregard\s+security/i,
];

export function inspectUntrustedContent(text: string): {
  flagged: boolean;
  reasons: string[];
  sanitized: string;
} {
  const reasons: string[] = [];
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      reasons.push(`Matched suspicious directive pattern: ${pattern.source}`);
    }
  }
  const sanitized = text
    .replace(/<\/?(system|assistant|developer|tool_call)[^>]*>/gi, '[filtered-tag]')
    .slice(0, 6000);

  return {
    flagged: reasons.length > 0,
    reasons,
    sanitized,
  };
}
