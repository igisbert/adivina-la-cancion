import { setProgress, updateStats } from './storage.js';

const INTERVALS = [1, 2, 4, 7, 11, 16];

export function createGame(songData, elements) {
  const { audio, playButton, attemptsDisplay, guessInput, guessDropdown, artwork, title, artist } = elements;
  
  let currentAttempt = 0;
  let solved = false;
  let guesses = [];
  let playTimeout = null;

  audio.src = songData.previewUrl;
  audio.preload = 'auto';

  function playSegment() {
    if (solved || currentAttempt >= INTERVALS.length) return;
    
    if (playTimeout) {
      clearTimeout(playTimeout);
    }
    
    audio.currentTime = 0;
    audio.play().then(() => {
      const duration = INTERVALS[currentAttempt];
      playTimeout = setTimeout(() => {
        audio.pause();
      }, duration * 1000);
      
      updatePlayButton(true);
    }).catch(err => {
      console.error('Playback failed:', err);
    });
  }

  function updatePlayButton(playing) {
    if (playing) {
      playButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
      `;
    } else {
      playButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      `;
    }
  }

  function handleGuess(song) {
    if (solved || currentAttempt >= INTERVALS.length) return;
    
    guesses.push(song);
    
    const isCorrect = song.trackId === songData.trackId;
    
    if (isCorrect) {
      solved = true;
      revealSong();
      showFeedback(true, guesses.length);
    } else {
      currentAttempt++;
      attemptsDisplay.textContent = `${currentAttempt}/${INTERVALS.length}`;
      
      if (currentAttempt >= INTERVALS.length) {
        revealSong();
        showFeedback(false, INTERVALS.length);
      }
    }
    
    setProgress(songData.trackId, {
      guesses: guesses.map(g => ({ id: g.trackId, name: g.trackName, artist: g.artistName })),
      solved,
      attempts: guesses.length
    });
    
    updateStats(solved, guesses.length);
  }

  function revealSong() {
    artwork.classList.remove('hidden');
    artwork.src = songData.artworkUrl100;
    title.textContent = songData.trackName;
    artist.textContent = songData.artistName;
    
    if (playTimeout) {
      clearTimeout(playTimeout);
    }
    audio.pause();
  }

  function showFeedback(won, attempts) {
    const feedback = document.createElement('div');
    feedback.className = `feedback ${won ? 'win' : 'lose'}`;
    
    if (won) {
      feedback.textContent = `🎉 Correct! You got it in ${attempts} ${attempts === 1 ? 'try' : 'tries'}!`;
    } else {
      feedback.textContent = `😢 Better luck next time! The song was "${songData.trackName}" by ${songData.artistName}`;
    }
    
    elements.feedbackContainer.appendChild(feedback);
  }

  playButton.addEventListener('click', playSegment);

  return { handleGuess, playSegment };
}
