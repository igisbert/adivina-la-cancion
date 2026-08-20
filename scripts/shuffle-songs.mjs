import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const TSV_PATH = join(ROOT, 'src', 'data', 'songs-source.tsv');
const BACKUP_PATH = join(ROOT, 'src', 'data', 'songs-source.backup.tsv');

// Fisher-Yates shuffle
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Backup original if no backup exists
try {
  readFileSync(BACKUP_PATH);
} catch {
  copyFileSync(TSV_PATH, BACKUP_PATH);
  console.log('📁 Backup created: songs-source.backup.tsv');
}

const tsvContent = readFileSync(TSV_PATH, 'utf-8');
const lines = tsvContent.split('\n').filter(line => line.trim());
const shuffled = shuffle([...lines]);

writeFileSync(TSV_PATH, shuffled.join('\n') + '\n');
console.log(`🔀 Shuffled ${lines.length} songs`);
