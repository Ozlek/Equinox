/**
 * Sound utility using Web Audio API with HTML5 Audio fallback
 * Provides simple sound effects for UI feedback
 */

// Check if sounds are enabled via user preference
const isSoundEnabled = () => {
  const stored = localStorage.getItem('pref_sound');
  return stored === null ? true : stored === 'true';
};

// Get sound effects volume (0-1)
export const getSfxVolume = () => {
  const stored = localStorage.getItem('pref_sfx_volume');
  return stored !== null ? parseFloat(stored) : 0.5;
};

// Get music volume (0-1)
export const getMusicVolume = () => {
  const stored = localStorage.getItem('pref_music_volume');
  return stored !== null ? parseFloat(stored) : 0.3;
};

// Set sound effects volume
export const setSfxVolume = (volume) => {
  localStorage.setItem('pref_sfx_volume', Math.max(0, Math.min(1, volume)));
};

// Set music volume
export const setMusicVolume = (volume) => {
  localStorage.setItem('pref_music_volume', Math.max(0, Math.min(1, volume)));
};

// Audio context singleton for Web Audio API
let audioContext = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

// HTML5 Audio cache
const audioCache = {};

// Load HTML5 audio file
const loadAudio = (name) => {
  if (audioCache[name]) return audioCache[name];
  
  const ext = 'mp3'; // Prefer mp3, fallback to ogg
  const audio = new Audio(`/sounds/${name}.${ext}`);
  audio.preload = 'auto';
  audioCache[name] = audio;
  return audio;
};

// Play HTML5 audio with fallback to Web Audio
const playHtml5Audio = (name, fallbackFn, isMusic = false) => {
  if (!isSoundEnabled()) return;
  
  try {
    const audio = loadAudio(name);
    // Clone to allow overlapping plays
    const clone = audio.cloneNode();
    clone.volume = isMusic ? getMusicVolume() : getSfxVolume();
    clone.play().catch(() => {
      // If HTML5 audio fails, try Web Audio fallback
      if (fallbackFn) fallbackFn();
    });
  } catch (e) {
    // If HTML5 audio fails, try Web Audio fallback
    if (fallbackFn) fallbackFn();
  }
};

// Play a simple tone with given frequency and duration
const playTone = (frequency, duration = 0.1, type = 'sine', volume = 0.2) => {
  if (!isSoundEnabled()) return;
  
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.debug('Audio playback not available:', e);
  }
};

// Play a click sound (short, high-pitched)
export const playClick = () => {
  playHtml5Audio('click', () => playTone(800, 0.05, 'sine', 0.1));
};

// Play begin sound (for launching challenges)
export const playBegin = () => {
  playHtml5Audio('begin', () => playTone(440, 0.2, 'sine', 0.2));
};

// Play next sound (for navigation/page changes)
export const playNext = () => {
  playHtml5Audio('next', () => playTone(523, 0.15, 'sine', 0.15));
};

// Play topic select sound
export const playTopicSelect = () => {
  playHtml5Audio('topicSelect', () => playTone(659, 0.1, 'sine', 0.15));
};

// Play check sound (for checkbox interactions)
export const playCheck = () => {
  playHtml5Audio('check', () => playTone(330, 0.08, 'sine', 0.12));
};

// Play a correct/success sound (ascending pleasant tones)
export const playCorrect = () => {
  if (!isSoundEnabled()) return;
  
  try {
    const audio = loadAudio('correct');
    const clone = audio.cloneNode();
    clone.volume = 0.5;
    clone.play().catch(() => {
      // Fallback to Web Audio
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      [523, 659, 784].forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        gainNode.gain.value = 0.15;
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start(now + i * 0.08);
        oscillator.stop(now + i * 0.08 + 0.12);
      });
    });
  } catch (e) {
    // Fallback to Web Audio
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      gainNode.gain.value = 0.15;
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start(now + i * 0.08);
      oscillator.stop(now + i * 0.08 + 0.12);
    });
  }
};

// Play a wrong/error sound (descending tone)
export const playWrong = () => {
  playHtml5Audio('wrong', () => playTone(220, 0.3, 'sawtooth', 0.15));
};

// Play a notification sound
export const playNotification = () => {
  playHtml5Audio('notification', () => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    [600, 800].forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      gainNode.gain.value = 0.1;
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start(now + i * 0.15);
      oscillator.stop(now + i * 0.15 + 0.1);
    });
  });
};

// Play a level up/achievement sound
export const playLevelUp = () => {
  if (!isSoundEnabled()) return;
  
  try {
    const audio = loadAudio('levelup');
    const clone = audio.cloneNode();
    clone.volume = 0.5;
    clone.play().catch(() => {
      // Fallback to Web Audio
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      [523, 659, 784, 1047].forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        gainNode.gain.value = 0.12;
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start(now + i * 0.06);
        oscillator.stop(now + i * 0.06 + 0.15);
      });
    });
  } catch (e) {
    // Fallback to Web Audio
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    [523, 659, 784, 1047].forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      gainNode.gain.value = 0.12;
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start(now + i * 0.06);
      oscillator.stop(now + i * 0.06 + 0.15);
    });
  }
};

// Play a button hover sound (very subtle)
export const playHover = () => {
  playHtml5Audio('click', () => playTone(400, 0.03, 'sine', 0.05));
};

// Play a submit/confirm sound
export const playSubmit = () => {
  playHtml5Audio('click', () => playTone(600, 0.1, 'sine', 0.15));
};

// Play a delete sound
export const playDelete = () => {
  playHtml5Audio('delete', () => playTone(150, 0.15, 'sine', 0.1));
};

// Playthrough loop state management
let currentLoop = null;
let loopTimeout = null;
let isPlayingLoop1 = false;

// Play playthrough loop 1
export const playPlaythroughLoop1 = () => {
  if (!isSoundEnabled()) return;
  
  // Stop any currently playing loop
  if (currentLoop) {
    currentLoop.pause();
    currentLoop = null;
  }
  
  // Clear any existing timeout
  if (loopTimeout) {
    clearTimeout(loopTimeout);
    loopTimeout = null;
  }
  
  try {
    const audio = loadAudio('playthroughLoop1');
    const clone = audio.cloneNode();
    clone.volume = getMusicVolume();
    clone.loop = false;
    
    // Set up onended handler to play loop2 after a delay
    clone.onended = () => {
      if (isSoundEnabled() && currentLoop === clone) {
        // Add 1 second delay before crossfade
        loopTimeout = setTimeout(() => {
          if (isSoundEnabled()) {
            playPlaythroughLoop2();
          }
        }, 1000);
      }
    };
    
    clone.play().catch(() => {});
    currentLoop = clone;
    isPlayingLoop1 = true;
  } catch (e) {
    console.debug('Loop playback failed:', e);
  }
};

// Play playthrough loop 2
export const playPlaythroughLoop2 = () => {
  if (!isSoundEnabled()) return;
  
  // Stop any currently playing loop
  if (currentLoop) {
    currentLoop.pause();
    currentLoop = null;
  }
  
  // Clear any existing timeout
  if (loopTimeout) {
    clearTimeout(loopTimeout);
    loopTimeout = null;
  }
  
  try {
    const audio = loadAudio('playthroughLoop2');
    const clone = audio.cloneNode();
    clone.volume = getMusicVolume();
    clone.loop = false;
    
    // Set up onended handler to play loop1 after a delay
    clone.onended = () => {
      if (isSoundEnabled() && currentLoop === clone) {
        // Add 1 second delay before crossfade
        loopTimeout = setTimeout(() => {
          if (isSoundEnabled()) {
            playPlaythroughLoop1();
          }
        }, 1000);
      }
    };
    
    clone.play().catch(() => {});
    currentLoop = clone;
    isPlayingLoop1 = false;
  } catch (e) {
    console.debug('Loop playback failed:', e);
  }
};

// Start playthrough background music (randomly choose which loop to start with)
export const startPlaythroughMusic = () => {
  if (!isSoundEnabled()) return;
  
  // Stop any existing loop
  stopPlaythroughMusic();
  
  // Randomly start with loop1 or loop2
  if (Math.random() > 0.5) {
    playPlaythroughLoop1();
  } else {
    playPlaythroughLoop2();
  }
};

// Stop playthrough background music
export const stopPlaythroughMusic = () => {
  if (loopTimeout) {
    clearTimeout(loopTimeout);
    loopTimeout = null;
  }
  if (currentLoop) {
    currentLoop.pause();
    currentLoop = null;
  }
  isPlayingLoop1 = false;
};

// Hook to enable sounds on first user interaction
export const useSounds = () => {
  const enableSounds = () => {
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
  };
  
  return { enableSounds };
};

// Export all sound functions
export default {
  playClick,
  playBegin,
  playNext,
  playTopicSelect,
  playCheck,
  playCorrect,
  playWrong,
  playNotification,
  playLevelUp,
  playHover,
  playSubmit,
  playDelete,
  startPlaythroughMusic,
  stopPlaythroughMusic,
  useSounds,
  isSoundEnabled,
};
