const musicElement = document.getElementById('bgMusic');
const toggleBtn = document.getElementById('toggleMusic');

const playlist = [
    'music/1-01.mp3',
    'music/1-02.mp3',
    'music/1-03.mp3',
   
];

let currentTrack = 0;
let musicStarted = false;

function playTrack() {
    currentTrack = (currentTrack + 1) % playlist.length;
    musicElement.src = playlist[currentTrack];
    musicElement.addEventListener('canplay', function handler() {
        musicElement.play().catch(err => console.error('Play error:', err));
        musicElement.removeEventListener('canplay', handler);
        console.log(`Playing: ${playlist[currentTrack]}`);
    });
}

// Automatically play next track when current ends
musicElement.addEventListener('ended', playTrack);

function initializeMusic() {
    if (!musicStarted) {
        musicElement.src = playlist[currentTrack];
        musicElement.addEventListener('canplay', function handler() {
            musicElement.play().catch(err => console.error('Play error:', err));
            musicStarted = true;
            musicElement.removeEventListener('canplay', handler);
        });
    }
}

function toggleMusic() {
     const label = toggleBtn.querySelector('p');
    if (musicElement.paused) {
        musicElement.play().catch(err => console.error('Play error:', err));
        label.textContent = 'Pause Music';
    } else {
        musicElement.pause();
        label.textContent = 'Play Music';
    }
}

musicElement.addEventListener('error', (e) => {
    console.error('Audio error:', e, musicElement.src);
});
musicElement.addEventListener('ended', playTrack);

document.addEventListener('click', initializeMusic);
toggleBtn.addEventListener('click', toggleMusic);

// Add sound effects for computer interactions
function playComputerHoverSound() {
  const audio = new Audio('/music/hover.mp3');
  audio.volume = 0.3;
  audio.play().catch(e => console.log('Audio play failed:', e));
}

function playComputerClickSound() {
  const audio = new Audio('/music/click.mp3');
  audio.volume = 0.5;
  audio.play().catch(e => console.log('Audio play failed:', e));
}

// Export functions for use in main.js
window.playComputerHoverSound = playComputerHoverSound;
window.playComputerClickSound = playComputerClickSound;




