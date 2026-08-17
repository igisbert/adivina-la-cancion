import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const TSV_PATH = join(process.cwd(), 'src', 'data', 'songs-source.tsv');
const JSON_PATH = join(process.cwd(), 'src', 'data', 'songs.json');
const ART_DIR = join(process.cwd(), 'public', 'art');

async function fetchSong(title, artist) {
  const term = encodeURIComponent(`${title} ${artist}`);
  const url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=5`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const artistLower = artist.toLowerCase();
      const studio = data.results.find(r => !/live|concert|acoustic|remix|deluxe|version|edit|bonus/i.test(r.trackName) && r.artistName.toLowerCase() === artistLower);
      const artistMatch = data.results.find(r => r.artistName.toLowerCase() === artistLower);
      const studioAny = data.results.find(r => !/live|concert|acoustic|remix|deluxe|version|edit|bonus/i.test(r.trackName));
      return studio || artistMatch || studioAny || data.results[0];
    }
    return null;
  } catch (error) {
    console.error(`Error fetching "${title}" by "${artist}":`, error.message);
    return null;
  }
}

async function downloadArtwork(url, slug) {
  const filePath = join(ART_DIR, `${slug}.webp`);
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(filePath, buffer);
}

async function main() {
  console.log('Reading songs from TSV...');
  const tsvContent = readFileSync(TSV_PATH, 'utf-8');
  const lines = tsvContent.split('\n').filter(line => line.trim());

  mkdirSync(ART_DIR, { recursive: true });

  const songs = [];
  const failed = [];
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
      failed.push(`${title} - ${artist}`);
      continue;
    }

    const matchTitle = result.trackName;
    const matchArtist = result.artistName;
    const previewUrl = result.previewUrl;

    console.log(`  ✅ Matched: "${matchTitle}" by "${matchArtist}"`);

    if (!previewUrl) {
      console.log(`  ⚠️  No previewUrl available - skipping this song`);
      failed.push(`${title} - ${artist} (no preview)`);
      continue;
    }

    counter++;
    const slug = String(counter);

    console.log(`  📥 Downloading artwork...`);
    await downloadArtwork(result.artworkUrl100.replace('100x100', '600x600'), slug);

    await new Promise(r => setTimeout(r, 2000));

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
  if (failed.length > 0) {
    console.log(`\n❌ Failed (${failed.length}):`);
    failed.forEach(f => console.log(`  - ${f}`));
  }
}

main().catch(console.error);
