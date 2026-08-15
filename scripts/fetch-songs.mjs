import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TSV_PATH = join(process.cwd(), 'src', 'data', 'songs-source.tsv');
const JSON_PATH = join(process.cwd(), 'src', 'data', 'songs.json');

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

async function main() {
  console.log('Reading songs from TSV...');
  const tsvContent = readFileSync(TSV_PATH, 'utf-8');
  const lines = tsvContent.split('\n').filter(line => line.trim());
  
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
    
    songs.push({
      trackId: result.trackId,
      trackName: matchTitle,
      artistName: matchArtist,
      artworkUrl100: result.artworkUrl100.replace('100x100', '600x600'),
      previewUrl: previewUrl,
      slug: String(counter)
    });
  }
  
  writeFileSync(JSON_PATH, JSON.stringify(songs, null, 2));
  console.log(`\n✅ Generated ${songs.length} songs in songs.json`);
}

main().catch(console.error);
