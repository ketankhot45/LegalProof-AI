import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

const BUCKET_NAME = process.env.EVIDENCE_STORAGE_BUCKET || '';
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Initialize GCS storage client if bucket is configured
let gcsStorage: Storage | null = null;
if (BUCKET_NAME) {
  gcsStorage = new Storage();
}

/**
 * Ensures the local uploads directory exists when using local fallback storage.
 */
function ensureLocalUploadsDir() {
  if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
    fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Checks if Cloud Storage is active.
 */
export function isCloudStorageEnabled(): boolean {
  return Boolean(BUCKET_NAME && gcsStorage);
}

/**
 * Saves evidence file binary data to storage (GCS or local uploads directory).
 */
export async function saveEvidence(
  storageKey: string,
  buffer: Buffer,
  mimeType: string
): Promise<void> {
  if (isCloudStorageEnabled() && gcsStorage) {
    const bucket = gcsStorage.bucket(BUCKET_NAME);
    const file = bucket.file(storageKey);
    await file.save(buffer, {
      contentType: mimeType,
      resumable: false,
      metadata: {
        contentType: mimeType,
      },
    });
  } else {
    ensureLocalUploadsDir();
    const filePath = path.join(LOCAL_UPLOADS_DIR, storageKey);
    fs.writeFileSync(filePath, buffer);
  }
}

/**
 * Retrieves the full evidence file as a Buffer from storage.
 * Returns null if the file does not exist in storage.
 */
export async function getEvidenceBuffer(storageKey: string): Promise<Buffer | null> {
  if (isCloudStorageEnabled() && gcsStorage) {
    try {
      const bucket = gcsStorage.bucket(BUCKET_NAME);
      const file = bucket.file(storageKey);
      const [exists] = await file.exists();
      if (!exists) return null;

      const [contents] = await file.download();
      return contents;
    } catch (error) {
      console.error(`GCS getEvidenceBuffer error for key ${storageKey}:`, error);
      return null;
    }
  } else {
    ensureLocalUploadsDir();
    const filePath = path.join(LOCAL_UPLOADS_DIR, storageKey);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath);
  }
}

/**
 * Checks if an evidence file exists in persistent storage.
 */
export async function evidenceExists(storageKey: string): Promise<boolean> {
  if (isCloudStorageEnabled() && gcsStorage) {
    try {
      const bucket = gcsStorage.bucket(BUCKET_NAME);
      const file = bucket.file(storageKey);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      console.error(`GCS evidenceExists error for key ${storageKey}:`, error);
      return false;
    }
  } else {
    ensureLocalUploadsDir();
    const filePath = path.join(LOCAL_UPLOADS_DIR, storageKey);
    return fs.existsSync(filePath);
  }
}

/**
 * Deletes an evidence file from storage (used only when upload integrity verification fails).
 */
export async function deleteEvidence(storageKey: string): Promise<void> {
  if (isCloudStorageEnabled() && gcsStorage) {
    try {
      const bucket = gcsStorage.bucket(BUCKET_NAME);
      const file = bucket.file(storageKey);
      await file.delete({ ignoreNotFound: true });
    } catch (error) {
      console.error(`GCS deleteEvidence error for key ${storageKey}:`, error);
    }
  } else {
    ensureLocalUploadsDir();
    const filePath = path.join(LOCAL_UPLOADS_DIR, storageKey);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

/**
 * Retrieves a readable stream for evidence downloading/previewing.
 */
export async function getEvidenceStream(storageKey: string): Promise<{
  stream: Readable;
  contentLength?: number;
} | null> {
  if (isCloudStorageEnabled() && gcsStorage) {
    try {
      const bucket = gcsStorage.bucket(BUCKET_NAME);
      const file = bucket.file(storageKey);
      const [exists] = await file.exists();
      if (!exists) return null;

      const [metadata] = await file.getMetadata();
      const contentLength = metadata.size ? Number(metadata.size) : undefined;
      const readStream = file.createReadStream();

      return {
        stream: readStream,
        contentLength,
      };
    } catch (error) {
      console.error(`GCS getEvidenceStream error for key ${storageKey}:`, error);
      return null;
    }
  } else {
    ensureLocalUploadsDir();
    const filePath = path.join(LOCAL_UPLOADS_DIR, storageKey);
    if (!fs.existsSync(filePath)) return null;

    const stats = fs.statSync(filePath);
    const readStream = fs.createReadStream(filePath);

    return {
      stream: readStream,
      contentLength: stats.size,
    };
  }
}
