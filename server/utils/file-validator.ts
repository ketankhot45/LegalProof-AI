import path from 'path';

export interface FileValidationResult {
  isValid: boolean;
  detectedType: string;
  verifiedMimeType: string;
  error?: string;
}

/**
 * Checks if buffer starts with given sequence of bytes
 */
function matchBytes(buffer: Buffer, bytes: number[], offset = 0): boolean {
  if (buffer.length < offset + bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) {
    if (buffer[offset + i] !== bytes[i]) return false;
  }
  return true;
}

/**
 * Checks if buffer matches ASCII string at offset
 */
function matchAscii(buffer: Buffer, str: string, offset = 0): boolean {
  if (buffer.length < offset + str.length) return false;
  return buffer.toString('ascii', offset, offset + str.length) === str;
}

/**
 * Check for dangerous executable and script signatures
 */
function detectDangerousSignatures(buffer: Buffer): string | null {
  // Windows PE (EXE, DLL, SYS, COM) -> 'MZ' header
  if (matchBytes(buffer, [0x4d, 0x5a])) {
    return 'Dangerous executable binary signature (Windows PE / Executable)';
  }

  // Linux / Unix ELF binary -> '\x7fELF'
  if (matchBytes(buffer, [0x7f, 0x45, 0x4c, 0x46])) {
    return 'Dangerous executable binary signature (Linux ELF Binary)';
  }

  // macOS Mach-O binaries
  if (
    matchBytes(buffer, [0xfe, 0xed, 0xfa, 0xce]) || // Mach-O 32-bit
    matchBytes(buffer, [0xfe, 0xed, 0xfa, 0xcf]) || // Mach-O 64-bit
    matchBytes(buffer, [0xce, 0xfa, 0xed, 0xfe]) || // Mach-O reverse 32-bit
    matchBytes(buffer, [0xcf, 0xfa, 0xed, 0xfe])    // Mach-O reverse 64-bit
  ) {
    return 'Dangerous executable binary signature (macOS Mach-O Binary)';
  }

  // Java bytecode class file (0xCAFEBABE) or Mach-O Universal Binary
  if (matchBytes(buffer, [0xca, 0xfe, 0xba, 0xbe])) {
    return 'Dangerous binary signature (Java Class / Mach-O Fat Binary)';
  }

  // WebAssembly binary (\0asm)
  if (matchBytes(buffer, [0x00, 0x61, 0x73, 0x6d])) {
    return 'Dangerous binary signature (WebAssembly Binary)';
  }

  // Shebang script (#!)
  if (matchBytes(buffer, [0x23, 0x21])) {
    return 'Dangerous script signature (Shebang / Executable Shell Script)';
  }

  // Check first 2KB for text-based script injections (PHP, dangerous active HTML scripts)
  const headerSample = buffer.subarray(0, Math.min(buffer.length, 2048)).toString('utf8').toLowerCase();

  // PHP tags
  if (
    headerSample.includes('<?php') ||
    headerSample.includes('<?=') ||
    /<script[\s\S]*?>/i.test(headerSample) ||
    /<iframe[\s\S]*?>/i.test(headerSample) ||
    /<object[\s\S]*?>/i.test(headerSample) ||
    /<embed[\s\S]*?>/i.test(headerSample)
  ) {
    return 'Dangerous script signature detected (PHP / Active Executable Script)';
  }

  return null;
}

/**
 * Validates text-based forensic files (CSV, TXT, JSON, LOG)
 */
function validateTextFile(buffer: Buffer, ext: string): FileValidationResult {
  // Check if buffer is valid text (no binary null bytes or excessive non-printable control chars)
  const sampleSize = Math.min(buffer.length, 8192);
  let nullBytes = 0;
  for (let i = 0; i < sampleSize; i++) {
    const byte = buffer[i];
    if (byte === 0x00) {
      nullBytes++;
    }
  }

  if (nullBytes > 0) {
    return {
      isValid: false,
      detectedType: 'Unknown Binary',
      verifiedMimeType: 'application/octet-stream',
      error: `File has '${ext}' extension but contains raw binary data. Text or data files must not contain binary null bytes.`,
    };
  }

  // Check content matches expected format
  const content = buffer.toString('utf8');

  if (ext === '.json') {
    try {
      JSON.parse(content);
      return {
        isValid: true,
        detectedType: 'JSON Data',
        verifiedMimeType: 'application/json',
      };
    } catch {
      return {
        isValid: false,
        detectedType: 'Malformed JSON',
        verifiedMimeType: 'application/json',
        error: 'Invalid JSON file: file content is not valid JSON.',
      };
    }
  }

  if (ext === '.csv') {
    return {
      isValid: true,
      detectedType: 'CSV Document',
      verifiedMimeType: 'text/csv',
    };
  }

  return {
    isValid: true,
    detectedType: 'Plain Text Document',
    verifiedMimeType: 'text/plain',
  };
}

/**
 * Validates evidence or supporting proof file content against magic bytes
 */
export function validateEvidenceFile(
  buffer: Buffer,
  originalFilename: string,
  claimedMimeType?: string
): FileValidationResult {
  if (!buffer || buffer.length === 0) {
    return {
      isValid: false,
      detectedType: 'Empty File',
      verifiedMimeType: 'application/octet-stream',
      error: 'File buffer is empty (0 bytes).',
    };
  }

  // 1. First line of defense: Check for known dangerous executable/script signatures
  const dangerousReason = detectDangerousSignatures(buffer);
  if (dangerousReason) {
    return {
      isValid: false,
      detectedType: 'Dangerous Executable / Script',
      verifiedMimeType: 'application/octet-stream',
      error: `Security Validation Failed: ${dangerousReason}`,
    };
  }

  const ext = path.extname(originalFilename).toLowerCase();

  // 2. PDF Document (%PDF-)
  if (matchBytes(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    if (ext !== '.pdf') {
      return {
        isValid: false,
        detectedType: 'PDF Document',
        verifiedMimeType: 'application/pdf',
        error: `Mismatched file format: content is a PDF document but filename extension is '${ext}'. Expected '.pdf'.`,
      };
    }
    return {
      isValid: true,
      detectedType: 'PDF Document',
      verifiedMimeType: 'application/pdf',
    };
  }

  // 3. PNG Image (\x89PNG\r\n\x1a\n)
  if (matchBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    if (ext !== '.png') {
      return {
        isValid: false,
        detectedType: 'PNG Image',
        verifiedMimeType: 'image/png',
        error: `Mismatched file format: content is a PNG image but filename extension is '${ext}'. Expected '.png'.`,
      };
    }
    return {
      isValid: true,
      detectedType: 'PNG Image',
      verifiedMimeType: 'image/png',
    };
  }

  // 4. JPEG / JPG Image (\xFF\xD8\xFF)
  if (matchBytes(buffer, [0xff, 0xd8, 0xff])) {
    if (ext !== '.jpg' && ext !== '.jpeg') {
      return {
        isValid: false,
        detectedType: 'JPEG Image',
        verifiedMimeType: 'image/jpeg',
        error: `Mismatched file format: content is a JPEG image but filename extension is '${ext}'. Expected '.jpg' or '.jpeg'.`,
      };
    }
    return {
      isValid: true,
      detectedType: 'JPEG Image',
      verifiedMimeType: 'image/jpeg',
    };
  }

  // 5. GIF Image (GIF87a or GIF89a)
  if (matchAscii(buffer, 'GIF87a') || matchAscii(buffer, 'GIF89a')) {
    if (ext !== '.gif') {
      return {
        isValid: false,
        detectedType: 'GIF Image',
        verifiedMimeType: 'image/gif',
        error: `Mismatched file format: content is a GIF image but filename extension is '${ext}'. Expected '.gif'.`,
      };
    }
    return {
      isValid: true,
      detectedType: 'GIF Image',
      verifiedMimeType: 'image/gif',
    };
  }

  // 6. WEBP Image (RIFF....WEBP)
  if (matchAscii(buffer, 'RIFF', 0) && matchAscii(buffer, 'WEBP', 8)) {
    if (ext !== '.webp') {
      return {
        isValid: false,
        detectedType: 'WEBP Image',
        verifiedMimeType: 'image/webp',
        error: `Mismatched file format: content is a WEBP image but filename extension is '${ext}'. Expected '.webp'.`,
      };
    }
    return {
      isValid: true,
      detectedType: 'WEBP Image',
      verifiedMimeType: 'image/webp',
    };
  }

  // 7. TIFF Image (II*\0 or MM\0*)
  if (
    matchBytes(buffer, [0x49, 0x49, 0x2a, 0x00]) ||
    matchBytes(buffer, [0x4d, 0x4d, 0x00, 0x2a])
  ) {
    if (ext !== '.tif' && ext !== '.tiff') {
      return {
        isValid: false,
        detectedType: 'TIFF Image',
        verifiedMimeType: 'image/tiff',
        error: `Mismatched file format: content is a TIFF image but filename extension is '${ext}'. Expected '.tif' or '.tiff'.`,
      };
    }
    return {
      isValid: true,
      detectedType: 'TIFF Image',
      verifiedMimeType: 'image/tiff',
    };
  }

  // 8. BMP Image (BM)
  if (matchBytes(buffer, [0x42, 0x4d])) {
    if (ext !== '.bmp') {
      return {
        isValid: false,
        detectedType: 'BMP Image',
        verifiedMimeType: 'image/bmp',
        error: `Mismatched file format: content is a BMP image but filename extension is '${ext}'. Expected '.bmp'.`,
      };
    }
    return {
      isValid: true,
      detectedType: 'BMP Image',
      verifiedMimeType: 'image/bmp',
    };
  }

  // 9. ZIP-based Archives & OpenXML Office Documents (PK\x03\x04 or PK\x05\x06)
  if (
    matchBytes(buffer, [0x50, 0x4b, 0x03, 0x04]) ||
    matchBytes(buffer, [0x50, 0x4b, 0x05, 0x06])
  ) {
    const validZipExts: Record<string, string> = {
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.odt': 'application/vnd.oasis.opendocument.text',
      '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
      '.odp': 'application/vnd.oasis.opendocument.presentation',
      '.zip': 'application/zip',
    };

    if (!validZipExts[ext]) {
      return {
        isValid: false,
        detectedType: 'ZIP Archive / OpenXML Document',
        verifiedMimeType: 'application/zip',
        error: `Mismatched file format: content is a ZIP archive or OpenXML document but filename extension is '${ext}'. Expected supported archive or document extension (.docx, .xlsx, .pptx, .zip, .odt, .ods).`,
      };
    }

    return {
      isValid: true,
      detectedType: ext === '.zip' ? 'ZIP Archive' : 'Office OpenXML Document',
      verifiedMimeType: validZipExts[ext],
    };
  }

  // 10. Legacy MS Office Compound File Binary Format (0xD0CF11E0A1B11AE1)
  if (matchBytes(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    const validLegacyExts: Record<string, string> = {
      '.doc': 'application/msword',
      '.xls': 'application/vnd.ms-excel',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.msg': 'application/vnd.ms-outlook',
    };

    if (!validLegacyExts[ext]) {
      return {
        isValid: false,
        detectedType: 'Microsoft Compound File',
        verifiedMimeType: 'application/msword',
        error: `Mismatched file format: content is a Microsoft Compound Document but filename extension is '${ext}'. Expected .doc, .xls, or .ppt.`,
      };
    }

    return {
      isValid: true,
      detectedType: 'Microsoft Office Document',
      verifiedMimeType: validLegacyExts[ext],
    };
  }

  // 11. GZIP Compressed Archive (\x1F\x8B)
  if (matchBytes(buffer, [0x1f, 0x8b])) {
    if (ext !== '.gz' && ext !== '.tgz' && !originalFilename.endsWith('.tar.gz')) {
      return {
        isValid: false,
        detectedType: 'GZIP Archive',
        verifiedMimeType: 'application/gzip',
        error: `Mismatched file format: content is a GZIP archive but filename extension is '${ext}'. Expected '.gz' or '.tar.gz'.`,
      };
    }
    return {
      isValid: true,
      detectedType: 'GZIP Archive',
      verifiedMimeType: 'application/gzip',
    };
  }

  // 12. 7-Zip Archive (7z\xBC\xAF'\x1C)
  if (matchBytes(buffer, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) {
    if (ext !== '.7z') {
      return {
        isValid: false,
        detectedType: '7-Zip Archive',
        verifiedMimeType: 'application/x-7z-compressed',
        error: `Mismatched file format: content is a 7-Zip archive but filename extension is '${ext}'. Expected '.7z'.`,
      };
    }
    return {
      isValid: true,
      detectedType: '7-Zip Archive',
      verifiedMimeType: 'application/x-7z-compressed',
    };
  }

  // 13. MP4 / MOV Video Media (ftyp / moov / mdat at offset 4)
  if (
    matchAscii(buffer, 'ftyp', 4) ||
    matchAscii(buffer, 'moov', 4) ||
    matchAscii(buffer, 'mdat', 4)
  ) {
    const validVideoExts: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.m4v': 'video/mp4',
      '.mov': 'video/quicktime',
      '.m4a': 'audio/mp4',
    };

    if (!validVideoExts[ext]) {
      return {
        isValid: false,
        detectedType: 'MP4 / QuickTime Media',
        verifiedMimeType: 'video/mp4',
        error: `Mismatched file format: content is MP4 media but filename extension is '${ext}'. Expected .mp4, .mov, or .m4a.`,
      };
    }

    return {
      isValid: true,
      detectedType: 'MP4 Video/Audio Media',
      verifiedMimeType: validVideoExts[ext],
    };
  }

  // 14. MP3 Audio (ID3 or sync header)
  if (
    matchAscii(buffer, 'ID3') ||
    matchBytes(buffer, [0xff, 0xfb]) ||
    matchBytes(buffer, [0xff, 0xf3]) ||
    matchBytes(buffer, [0xff, 0xf2]) ||
    matchBytes(buffer, [0xff, 0xfa])
  ) {
    if (ext !== '.mp3') {
      return {
        isValid: false,
        detectedType: 'MP3 Audio',
        verifiedMimeType: 'audio/mpeg',
        error: `Mismatched file format: content is MP3 audio but filename extension is '${ext}'. Expected '.mp3'.`,
      };
    }
    return {
      isValid: true,
      detectedType: 'MP3 Audio',
      verifiedMimeType: 'audio/mpeg',
    };
  }

  // 15. WAV Audio (RIFF....WAVE)
  if (matchAscii(buffer, 'RIFF', 0) && matchAscii(buffer, 'WAVE', 8)) {
    if (ext !== '.wav') {
      return {
        isValid: false,
        detectedType: 'WAV Audio',
        verifiedMimeType: 'audio/wav',
        error: `Mismatched file format: content is WAV audio but filename extension is '${ext}'. Expected '.wav'.`,
      };
    }
    return {
      isValid: true,
      detectedType: 'WAV Audio',
      verifiedMimeType: 'audio/wav',
    };
  }

  // 16. WebM / Matroska Video (EBML header \x1A\x45\xDF\xA3)
  if (matchBytes(buffer, [0x1a, 0x45, 0xdf, 0xa3])) {
    if (ext !== '.webm' && ext !== '.mkv') {
      return {
        isValid: false,
        detectedType: 'WebM / MKV Video',
        verifiedMimeType: 'video/webm',
        error: `Mismatched file format: content is WebM/MKV video but filename extension is '${ext}'. Expected '.webm' or '.mkv'.`,
      };
    }
    return {
      isValid: true,
      detectedType: 'WebM / MKV Video',
      verifiedMimeType: ext === '.mkv' ? 'video/x-matroska' : 'video/webm',
    };
  }

  // 17. OGG Media (OggS)
  if (matchAscii(buffer, 'OggS')) {
    if (ext !== '.ogg' && ext !== '.oga' && ext !== '.ogv') {
      return {
        isValid: false,
        detectedType: 'OGG Media',
        verifiedMimeType: 'audio/ogg',
        error: `Mismatched file format: content is OGG media but filename extension is '${ext}'. Expected '.ogg'.`,
      };
    }
    return {
      isValid: true,
      detectedType: 'OGG Media',
      verifiedMimeType: 'audio/ogg',
    };
  }

  // 18. FLAC Audio (fLaC)
  if (matchAscii(buffer, 'fLaC')) {
    if (ext !== '.flac') {
      return {
        isValid: false,
        detectedType: 'FLAC Audio',
        verifiedMimeType: 'audio/flac',
        error: `Mismatched file format: content is FLAC audio but filename extension is '${ext}'. Expected '.flac'.`,
      };
    }
    return {
      isValid: true,
      detectedType: 'FLAC Audio',
      verifiedMimeType: 'audio/flac',
    };
  }

  // 19. Plain Text / Data Files (TXT, CSV, JSON, LOG)
  const allowedTextExts = ['.txt', '.csv', '.json', '.log'];
  if (allowedTextExts.includes(ext)) {
    return validateTextFile(buffer, ext);
  }

  // 20. Unknown or unsupported binary format
  return {
    isValid: false,
    detectedType: 'Unsupported Format',
    verifiedMimeType: 'application/octet-stream',
    error: `Upload rejected: The file format with extension '${ext}' does not match any allowed evidence format, or its binary header could not be verified.`,
  };
}
