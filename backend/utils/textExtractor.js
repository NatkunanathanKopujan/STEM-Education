import fs from 'fs/promises';
import path from 'path';

const textLikeExtensions = new Set(['.txt', '.md', '.json', '.csv']);
const supportedBinaryExtensions = new Set(['.pdf', '.ppt', '.pptx', '.doc', '.docx']);

export async function extractTextFromFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (textLikeExtensions.has(extension)) {
    return fs.readFile(filePath, 'utf8');
  }

  if (supportedBinaryExtensions.has(extension)) {
    const stats = await fs.stat(filePath);
    return [
      `Binary document received for extraction: ${path.basename(filePath)}.`,
      `File size: ${stats.size} bytes.`,
      'Full binary parsing adapter is intentionally isolated for the AI engine foundation.',
    ].join('\n');
  }

  throw new Error(`Unsupported file extension for text extraction: ${extension}`);
}

export function normalizeLearningText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}
