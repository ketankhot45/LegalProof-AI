import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

const isProduction = process.env.NODE_ENV === 'production';

// Supabase Storage Configuration (Primary Persistent Backend)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || (isProduction ? '' : 'evidence-vault');

// Local Fallback Configuration (Offline Local Dev Only)
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// SEC-MED-01 Remediation:
// In production (NODE_ENV=production), Supabase Storage configuration MUST be present.
// Fail closed immediately rather than silently falling back to ephemeral local disk storage.
if (isProduction) {
  const missingConfigs: string[] = [];
  if (!SUPABASE_URL) missingConfigs.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_ROLE_KEY) missingConfigs.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.SUPABASE_STORAGE_BUCKET) missingConfigs.push('SUPABASE_STORAGE_BUCKET');

  if (missingConfigs.length > 0) {
    throw new Error(
      `[SECURITY ERROR] Production storage configuration missing: ${missingConfigs.join(
        ', '
      )}. In production (NODE_ENV=production), Supabase Storage is mandatory. Silent fallback to local disk storage is prohibited to prevent data loss or silent misconfiguration.`
    );
  }
}

// Initialize Supabase Storage Client (Server-side service-role only)
let supabaseClient: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Ensures the local uploads directory exists when using local fallback storage.
 */
function ensureLocalUploadsDir() {
  if (isProduction) {
    throw new Error('Local uploads directory cannot be created or accessed in production.');
  }
  if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
    fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Identifies the active storage backend.
 */
export function getStorageBackendName(): 'supabase' | 'local' {
  if (supabaseClient) return 'supabase';
  if (isProduction) {
    throw new Error('Storage backend error: Supabase Storage is required in production.');
  }
  return 'local';
}

/**
 * Checks if a persistent cloud storage backend is active.
 */
export function isCloudStorageEnabled(): boolean {
  return Boolean(supabaseClient);
}

/**
 * Saves evidence file binary data to the active storage backend.
 * Never stores evidence binaries in the PostgreSQL database.
 */
export async function saveEvidence(
  storageKey: string,
  buffer: Buffer,
  mimeType: string
): Promise<void> {
  const backend = getStorageBackendName();

  if (backend === 'supabase' && supabaseClient) {
    const { error } = await supabaseClient.storage
      .from(SUPABASE_BUCKET)
      .upload(storageKey, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to save evidence to Supabase Storage: ${error.message}`);
    }
  } else {
    if (isProduction) {
      throw new Error('Local disk fallback is prohibited in production.');
    }
    ensureLocalUploadsDir();
    const filePath = path.join(LOCAL_UPLOADS_DIR, storageKey);
    fs.writeFileSync(filePath, buffer);
  }
}

/**
 * Retrieves the full evidence file as a Buffer from storage.
 * Used for server-side AI OCR and investigative analysis.
 * Returns null if the file does not exist in storage.
 */
export async function getEvidenceBuffer(storageKey: string): Promise<Buffer | null> {
  const backend = getStorageBackendName();

  if (backend === 'supabase' && supabaseClient) {
    try {
      const { data, error } = await supabaseClient.storage
        .from(SUPABASE_BUCKET)
        .download(storageKey);

      if (error || !data) return null;
      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error(`Supabase getEvidenceBuffer error for key ${storageKey}:`, error);
      return null;
    }
  } else {
    if (isProduction) {
      throw new Error('Local disk fallback is prohibited in production.');
    }
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
  const backend = getStorageBackendName();

  if (backend === 'supabase' && supabaseClient) {
    try {
      // Normalize folder and filename for Supabase object search
      const normalizedKey = storageKey.replace(/\\/g, '/');
      const folder = path.posix.dirname(normalizedKey) === '.' ? '' : path.posix.dirname(normalizedKey);
      const filename = path.posix.basename(normalizedKey);

      const { data, error } = await supabaseClient.storage
        .from(SUPABASE_BUCKET)
        .list(folder, {
          search: filename,
          limit: 10,
        });

      if (error || !data) return false;
      return data.some((item) => item.name === filename);
    } catch (error) {
      console.error(`Supabase evidenceExists error for key ${storageKey}:`, error);
      return false;
    }
  } else {
    if (isProduction) {
      throw new Error('Local disk fallback is prohibited in production.');
    }
    ensureLocalUploadsDir();
    const filePath = path.join(LOCAL_UPLOADS_DIR, storageKey);
    return fs.existsSync(filePath);
  }
}

/**
 * Deletes an evidence file from storage (used only when upload integrity verification fails).
 */
export async function deleteEvidence(storageKey: string): Promise<void> {
  const backend = getStorageBackendName();

  if (backend === 'supabase' && supabaseClient) {
    try {
      const { error } = await supabaseClient.storage
        .from(SUPABASE_BUCKET)
        .remove([storageKey]);

      if (error) {
        console.error(`Supabase deleteEvidence error for key ${storageKey}:`, error.message);
      }
    } catch (error) {
      console.error(`Supabase deleteEvidence error for key ${storageKey}:`, error);
    }
  } else {
    if (isProduction) {
      throw new Error('Local disk fallback is prohibited in production.');
    }
    ensureLocalUploadsDir();
    const filePath = path.join(LOCAL_UPLOADS_DIR, storageKey);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

/**
 * Retrieves a readable stream for evidence downloading/previewing.
 * Authenticated endpoints pipe this stream directly to authorized users.
 */
export async function getEvidenceStream(storageKey: string): Promise<{
  stream: Readable;
  contentLength?: number;
} | null> {
  const backend = getStorageBackendName();

  if (backend === 'supabase' && supabaseClient) {
    try {
      const { data, error } = await supabaseClient.storage
        .from(SUPABASE_BUCKET)
        .download(storageKey);

      if (error || !data) return null;
      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const stream = Readable.from(buffer);

      return {
        stream,
        contentLength: buffer.length,
      };
    } catch (error) {
      console.error(`Supabase getEvidenceStream error for key ${storageKey}:`, error);
      return null;
    }
  } else {
    if (isProduction) {
      throw new Error('Local disk fallback is prohibited in production.');
    }
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

