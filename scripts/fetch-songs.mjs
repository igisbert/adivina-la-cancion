import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const TSV_PATH = join(process.cwd(), 'src', 'data', 'songs-source.tsv');
const JSON_PATH = join(process.cwd(), 'src', 'data', 'songs.json');
const ART_DIR = join(process.cwd(), 'public', 'art');
const ART_PIXELATED_DIR = join(process.cwd(), 'public', 'art', 'pixelated');

async function fetchSong(title, artist) {
  const term = encodeURIComponent(`${title} ${artist}`);
  const url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=1`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0];
    }
    return null;
  } catch (error) {
    console.error(`Error fetching "${title}" by "${artist}":`, error.message);
    return null;
  }
}

async function downloadArtwork(url, slug) {
  const originalPath = join(ART_DIR, `${slug}.webp`);
  const pixelatedPath = join(ART_PIXELATED_DIR, `${slug}.webp`);

  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());

  await sharp(buffer)
    .resize(600, 600, { fit: 'cover' })
    .webp({ quality: 80 })
    .toFile(originalPath);

  const pixelSize = 12;
  const { width, height } = await sharp(buffer).metadata();
  const targetW = Math.round((pixelSize / width) * 600);
  const targetH = Math.round((pixelSize / height) * 600);

  await sharp(buffer)
    .resize(targetW, targetH, { kernel: 'nearest' })
    .resize(600, 600, { kernel: 'nearest' })
    .webp({ quality: 80 })
    .toFile(pixelatedPath);

  console.log(`  📐 Pixelated: ${targetW}x${targetH} → 600x600`);
}

async function main() {
  console.log('Reading songs from TSV...');
  const tsvContent = readFileSync(TSV_PATH, 'utf-8');
  const lines = tsvContent.split('\n').filter(line => line.trim());
  
  mkdirSync(ART_DIR, { recursive: true });
  mkdirSync(ART_PIXELATED_DIR, { recursive: true });

  const songs = [];
  let counter = 0;
  
  for (const line of lines) {
    const [title, artist] = line.split(',').map(s => s.trim());
    
    if (!title || !artist) {
      console.warn(`Skipping invalid line: "${line}"`);
      continue;
    }
    
    console.log(`\nSearching: "${title}" by "${artist}"`);
    const result = await fetchSong(title, artist);
    
    if (!result) {
      console.log(`  ❌ No results found`);
      continue;
    }
    
    const matchTitle = result.trackName;
    const matchArtist = result.artistName;
    const previewUrl = result.previewUrl;
    
    console.log(`  ✅ Matched: "${matchTitle}" by "${matchArtist}"`);
    
    if (!previewUrl) {
      console.log(`  ⚠️  No previewUrl available - skipping this song`);
      continue;
    }
    
    counter++;
    const slug = String(counter);

    console.log(`  📥 Downloading artwork...`);
    await downloadArtwork(result.artworkUrl100.replace('100x100', '600x600'), slug);

    songs.push({
      trackId: result.trackId,
      trackName: matchTitle,
      artistName: matchArtist,
      artworkUrl100: `/art/${slug}.webp`,
      previewUrl: previewUrl,
      slug: slug
    });
  }
  
  writeFileSync(JSON_PATH, JSON.stringify(songs, null, 2));
  console.log(`\n✅ Generated ${songs.length} songs in songs.json`);
}

main().catch(console.error);
