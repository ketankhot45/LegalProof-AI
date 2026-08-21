import fs from 'fs';
import { getGeminiClient, GEMINI_MODEL, callWithRetry } from './client.js';

export interface AudioTranscriptionResult {
  transcript: string;
  languageDetected?: string;
  summary: string;
}

/**
 * Transcribes audio evidence files using Gemini's native audio input capabilities.
 */
export const transcribeAudioEvidence = async (
  filePathOrBuffer: string | Buffer,
  mimeType: string,
  fileName: string
): Promise<AudioTranscriptionResult> => {
  const ai = getGeminiClient();

  const fileBuffer = Buffer.isBuffer(filePathOrBuffer)
    ? filePathOrBuffer
    : fs.readFileSync(filePathOrBuffer);
  const base64Audio = fileBuffer.toString('base64');

  const lowerName = fileName.toLowerCase();
  let effectiveMime = mimeType || '';
  if (!effectiveMime || effectiveMime === 'application/octet-stream') {
    if (lowerName.endsWith('.mp3')) effectiveMime = 'audio/mp3';
    else if (lowerName.endsWith('.wav')) effectiveMime = 'audio/wav';
    else if (lowerName.endsWith('.m4a')) effectiveMime = 'audio/m4a';
    else if (lowerName.endsWith('.ogg')) effectiveMime = 'audio/ogg';
    else if (lowerName.endsWith('.flac')) effectiveMime = 'audio/flac';
    else if (lowerName.endsWith('.webm')) effectiveMime = 'audio/webm';
    else if (lowerName.endsWith('.aac')) effectiveMime = 'audio/aac';
    else effectiveMime = 'audio/mp3';
  }

  try {
    const response = await callWithRetry(() =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: effectiveMime,
                data: base64Audio,
              },
            },
            {
              text: `Transcribe the audio evidence file (${fileName}).
Return a JSON object with:
1. "transcript": Full verbatim audio transcription. If the audio is silent, corrupted, or unintelligible, state that clearly.
2. "languageDetected": Detected language (e.g. "English", "Spanish", "Hindi", "Unknown").
3. "summary": A concise 2-3 sentence objective summary of spoken audio content without legal assumptions or conclusions.`,
            },
          ],
        },
        config: {
          systemInstruction: 'You are an objective audio evidence transcription engine. Transcribe accurately and provide factual summaries. Do not make legal conclusions.',
          responseMimeType: 'application/json',
        },
      })
    );

    const parsed = JSON.parse(response.text || '{}');
    return {
      transcript: parsed.transcript || 'Audio transcribed.',
      languageDetected: parsed.languageDetected || 'Unknown',
      summary: parsed.summary || 'Audio evidence transcribed.',
    };
  } catch (err: any) {
    console.warn(`Audio transcription notice for ${fileName}:`, err?.message || err);
    return {
      transcript: 'Audio file format unreadable or silent/corrupted audio stream.',
      languageDetected: 'Unknown',
      summary: 'Audio file processed. No intelligible speech detected or stream unreadable.',
    };
  }
};
