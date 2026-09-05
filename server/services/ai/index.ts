import { extractTextFromEvidence, OcrResult } from './ocr.js';
import { extractEntitiesFromText, EntityExtractionResult } from './entities.js';
import { transcribeAudioEvidence, AudioTranscriptionResult } from './transcription.js';

export interface ComprehensiveAIAnalysisResult {
  evidenceId: string;
  processedAt: string;
  status: 'COMPLETED';
  isAiGenerated: true;
  mimeType: string;
  fileName: string;
  documentType?: string;
  extractedText?: string;
  audioTranscript?: string;
  objectiveSummary: string;
  entities?: EntityExtractionResult;
  disclaimer: string;
}

const DISCLAIMER_NOTICE = 'AI-Assisted Analysis — For information and text indexing purposes only. Requires human verification. Contains no automated legal decisions or conclusions. Not cryptographic proof of authenticity.';

/**
 * Main AI Analysis Orchestrator for Formal Evidence Files.
 */
export const runAIAnalysis = async (params: {
  evidenceId: string;
  filePathOrBuffer: string | Buffer;
  mimeType: string;
  fileName: string;
}): Promise<ComprehensiveAIAnalysisResult> => {
  const { evidenceId, filePathOrBuffer, mimeType, fileName } = params;

  if (!evidenceId || !filePathOrBuffer || !fileName) {
    throw new Error('Invalid parameters for AI analysis: evidenceId, filePathOrBuffer, and fileName are required.');
  }

  const lowerName = fileName.toLowerCase();
  const isAudio = (mimeType && mimeType.startsWith('audio/')) ||
    ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.webm'].some(ext => lowerName.endsWith(ext));

  let extractedText = '';
  let documentType = 'Evidence Document';
  let objectiveSummary = '';
  let audioTranscript: string | undefined = undefined;

  if (isAudio) {
    const audioResult: AudioTranscriptionResult = await transcribeAudioEvidence(filePathOrBuffer, mimeType, fileName);
    audioTranscript = audioResult.transcript;
    extractedText = audioResult.transcript;
    documentType = 'Audio Recording';
    objectiveSummary = audioResult.summary;
  } else {
    const ocrResult: OcrResult = await extractTextFromEvidence(filePathOrBuffer, mimeType, fileName);
    extractedText = ocrResult.extractedText;
    documentType = ocrResult.documentType;
    objectiveSummary = ocrResult.objectiveSummary;
  }

  // Perform entity extraction on the extracted text / transcript
  let entities: EntityExtractionResult = {
    persons: [],
    organizations: [],
    locations: [],
    dates: [],
    identifiers: [],
  };

  if (extractedText && extractedText.trim().length > 10) {
    try {
      entities = await extractEntitiesFromText(extractedText);
    } catch {
      // Graceful fallback if entity extraction encounters transient error
    }
  }

  return {
    evidenceId,
    processedAt: new Date().toISOString(),
    status: 'COMPLETED',
    isAiGenerated: true,
    mimeType: mimeType || 'application/octet-stream',
    fileName,
    documentType,
    extractedText,
    audioTranscript,
    objectiveSummary: objectiveSummary || 'Evidence processed and indexed.',
    entities,
    disclaimer: DISCLAIMER_NOTICE,
  };
};

export { extractTextFromEvidence, extractEntitiesFromText, transcribeAudioEvidence };

