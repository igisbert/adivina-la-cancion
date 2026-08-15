let currentRequestId = 0;
let debounceTimer = null;

export function createSearchInput(inputElement, dropdownElement, onSelect) {
  if (!inputElement || !dropdownElement) return;

  inputElement.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (query.length < 2) {
      hideDropdown(dropdownElement);
      return;
    }

    debounceTimer = setTimeout(() => {
      searchSongs(query, dropdownElement, onSelect);
    }, 400);
  });

  inputElement.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideDropdown(dropdownElement);
      inputElement.blur();
    }
  });

  document.addEventListener('click', (e) => {
    if (!inputElement.contains(e.target) && !dropdownElement.contains(e.target)) {
      hideDropdown(dropdownElement);
    }
  });
}

async function searchSongs(query, dropdownElement, onSelect) {
  const requestId = ++currentRequestId;
  
  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=8`
    );
    
    if (!requestId === currentRequestId) return;
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      showDropdown(data.results, dropdownElement, onSelect);
    } else {
      hideDropdown(dropdownElement);
    }
  } catch (error) {
    console.error('Search error:', error);
    hideDropdown(dropdownElement);
  }
}

function showDropdown(results, dropdownElement, onSelect) {
  dropdownElement.innerHTML = '';
  
  results.forEach(song => {
    const item = document.createElement('div');
    item.className = 'search-item';
    item.innerHTML = `
      <img src="${song.artworkUrl60 || song.artworkUrl100}" alt="" class="search-item-art" />
      <div class="search-item-info">
        <div class="search-item-title">${escapeHtml(song.trackName)}</div>
        <div class="search-item-artist">${escapeHtml(song.artistName)}</div>
      </div>
    `;
    
    item.addEventListener('click', () => {
      onSelect(song);
      hideDropdown(dropdownElement);
    });
    
    dropdownElement.appendChild(item);
  });
  
  dropdownElement.classList.add('active');
}

function hideDropdown(dropdownElement) {
  dropdownElement.classList.remove('active');
  dropdownElement.innerHTML = '';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
