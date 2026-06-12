// src/vocalizer.js
// Chrome Harmony Voice Constructor
// Formant-based voice synthesis with profiles

class Vocalizer {
  constructor() {
    this.profiles = {};
    this.sampleRate = 44100;
  }

  // Load a voice profile
  loadProfile(name, profileData) {
    this.profiles[name] = profileData;
  }

  // Generate voice from text using a profile
  generate(text, profileName, duration, sampleRate = 44100) {
    const profile = this.profiles[profileName];
    if (!profile) {
      console.warn(`Profile not found: ${profileName}, using default`);
      return this.generateDefault(text, duration, sampleRate);
    }

    const settings = profile.settings || profile;
    const n = Math.floor(duration * sampleRate);
    const samples = new Float32Array(n);

    // Phoneme mapping (simplified)
    const phonemes = this.textToPhonemes(text);
    const phonemeDuration = n / phonemes.length;

    for (let p = 0; p < phonemes.length; p++) {
      const phoneme = phonemes[p];
      const startSample = Math.floor(p * phonemeDuration);
      const endSample = Math.floor((p + 1) * phonemeDuration);

      // Formant frequencies for this phoneme
      const formants = this.getFormants(phoneme, settings);

      for (let i = startSample; i < endSample && i < n; i++) {
        const t = (i - startSample) / sampleRate;
        let sample = 0;

        // Generate voice with formants
        for (let f = 0; f < formants.length; f++) {
          const freq = formants[f] * (1 + settings.formant * 0.3);
          const amplitude = 1 / (f + 1);
          
          // Base tone (vocal cord simulation)
          const baseFreq = 100 * Math.pow(2, (settings.base_octave || 3));
          const buzz = this.buzzWave(baseFreq * freq / 500, t);
          
          sample += buzz * amplitude;
        }

        // Add breath
        if (settings.breath > 0) {
          sample += (Math.random() * 2 - 1) * settings.breath * 0.3;
        }

        // Add grit (vocal fry)
        if (settings.grit > 0) {
          const fry = Math.sin(2 * Math.PI * 50 * t) * settings.grit * 0.3;
          sample += fry * (Math.random() * 2 - 1);
        }

        // Apply envelope
        const localEnv = this.localEnvelope(i - startSample, endSample - startSample);
        sample *= localEnv;

        // Richness (harmonic saturation)
        if (settings.richness > 0) {
          sample = Math.tanh(sample * (1 + settings.richness * 3));
        }

        samples[i] = sample * 0.5;
      }
    }

    return samples;
  }

  // Default voice when no profile loaded
  generateDefault(text, duration, sampleRate) {
    const defaultSettings = {
      base_octave: 3,
      formant: 1.0,
      breath: 0.2,
      grit: 0.05,
      richness: 0.5,
    };

    const n = Math.floor(duration * sampleRate);
    const samples = new Float32Array(n);
    const phonemes = this.textToPhonemes(text);
    const phonemeDuration = n / phonemes.length;

    for (let p = 0; p < phonemes.length; p++) {
      const startSample = Math.floor(p * phonemeDuration);
      const endSample = Math.floor((p + 1) * phonemeDuration);
      const baseFreq = 120;

      for (let i = startSample; i < endSample && i < n; i++) {
        const t = (i - startSample) / sampleRate;
        let sample = 0;

        // Simple vocal synthesis
        sample += Math.sin(2 * Math.PI * baseFreq * t);
        sample += Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.5;
        sample += Math.sin(2 * Math.PI * baseFreq * 3 * t) * 0.25;

        const localEnv = this.localEnvelope(i - startSample, endSample - startSample);
        sample *= localEnv * 0.4;

        samples[i] = sample;
      }
    }

    return samples;
  }

  // Convert text to simplified phoneme array
  textToPhonemes(text) {
    const lower = text.toLowerCase();
    const phonemes = [];
    
    const phonemeMap = {
      'a': 'ah', 'e': 'eh', 'i': 'ee', 'o': 'oh', 'u': 'oo',
      'b': 'b', 'c': 'k', 'd': 'd', 'f': 'f', 'g': 'g',
      'h': 'h', 'j': 'j', 'k': 'k', 'l': 'l', 'm': 'm',
      'n': 'n', 'p': 'p', 'q': 'kw', 'r': 'r', 's': 's',
      't': 't', 'v': 'v', 'w': 'w', 'x': 'ks', 'y': 'y',
      'z': 'z', ' ': 'sil',
    };

    for (let i = 0; i < lower.length; i++) {
      const char = lower[i];
      const phoneme = phonemeMap[char] || 'ah';
      if (phoneme !== 'sil') {
        phonemes.push(phoneme);
      }
    }

    return phonemes.length > 0 ? phonemes : ['ah'];
  }

  // Get formant frequencies for a phoneme
  getFormants(phoneme, settings) {
    const formantTable = {
      'ah': [700, 1200, 2500],
      'eh': [500, 1800, 2500],
      'ee': [300, 2200, 3000],
      'oh': [500, 900, 2500],
      'oo': [350, 800, 2400],
      'b':  [400, 1200, 2500],
      'd':  [400, 1700, 2700],
      'f':  [400, 1400, 2600],
      'g':  [300, 2000, 2600],
      'h':  [400, 1600, 2500],
      'j':  [300, 2000, 3000],
      'k':  [400, 1800, 2600],
      'l':  [350, 1400, 2600],
      'm':  [300, 1200, 2400],
      'n':  [300, 1500, 2500],
      'p':  [400, 1200, 2500],
      'kw': [350, 1200, 2300],
      'r':  [400, 1400, 2200],
      's':  [400, 1700, 2800],
      't':  [400, 1800, 2700],
      'v':  [400, 1300, 2500],
      'w':  [350, 900, 2300],
      'ks': [400, 1800, 2800],
      'y':  [300, 2000, 2800],
      'z':  [400, 1700, 2700],
    };

    return formantTable[phoneme] || [500, 1500, 2500];
  }

  // Buzz wave simulation (vocal cord vibration)
  buzzWave(freq, t) {
    let sample = 0;
    const harmonics = 12;
    for (let h = 1; h <= harmonics; h++) {
      sample += Math.sin(2 * Math.PI * freq * h * t) / (h * h);
    }
    return Math.tanh(sample * 2);
  }

  // Local envelope for each phoneme
  localEnvelope(position, totalLength) {
    const attack = totalLength * 0.05;
    const release = totalLength * 0.15;

    if (position < attack) {
      return position / attack;
    } else if (position > totalLength - release) {
      return (totalLength - position) / release;
    }
    return 1.0;
  }

  // Generate singing voice (pitched vocals)
  generateSinging(text, profileName, freq, duration, sampleRate = 44100) {
    const profile = this.profiles[profileName];
    const settings = profile ? (profile.settings || profile) : {
      base_octave: 3, formant: 1.0, breath: 0.2, grit: 0.05, richness: 0.5,
    };

    const n = Math.floor(duration * sampleRate);
    const samples = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // Pitched vocal
      sample += Math.sin(2 * Math.PI * freq * t);
      sample += Math.sin(2 * Math.PI * freq * 2 * t) * 0.5 * (1 + settings.formant * 0.5);
      sample += Math.sin(2 * Math.PI * freq * 3 * t) * 0.3;
      sample += Math.sin(2 * Math.PI * freq * 4 * t) * 0.15;

      // Breath
      sample += (Math.random() * 2 - 1) * settings.breath * 0.2;

      // Grit
      if (settings.grit > 0) {
        sample += Math.sin(2 * Math.PI * 50 * t) * settings.grit * 0.2 * (Math.random() * 2 - 1);
      }

      // Richness
      sample = Math.tanh(sample * (1 + settings.richness * 2));

      // Envelope
      const env = t < 0.01 ? t / 0.01 : Math.exp(-t * 0.3);
      samples[i] = sample * env * 0.5;
    }

    return samples;
  }

  // Bleep censor sound
  generateBleep(duration, sampleRate = 44100) {
    const n = Math.floor(duration * sampleRate);
    const samples = new Float32Array(n);
    const bleepFreq = 1000;

    for (let i = 0; i < n; i++) {
      const t = i / sampleRate;
      samples[i] = Math.sin(2 * Math.PI * bleepFreq * t) * 0.6;
    }

    return samples;
  }
}

module.exports = Vocalizer;
