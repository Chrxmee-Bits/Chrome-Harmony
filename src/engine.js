// src/engine.js
const fs = require('fs');
const path = require('path');

class ChromeHarmonyEngine {
  constructor() {
    this.sampleRate = 44100;
    this.notes = {
      'C2': 65.41, 'Db2': 69.30, 'D2': 73.42, 'Eb2': 77.78, 'E2': 82.41,
      'F2': 87.31, 'Gb2': 92.50, 'G2': 98.00, 'Ab2': 103.83, 'A2': 110.00,
      'Bb2': 116.54, 'B2': 123.47,
      'C3': 130.81, 'Db3': 138.59, 'D3': 146.83, 'Eb3': 155.56, 'E3': 164.81,
      'F3': 174.61, 'Gb3': 185.00, 'G3': 196.00, 'Ab3': 207.65, 'A3': 220.00,
      'Bb3': 233.08, 'B3': 246.94,
      'C4': 261.63, 'Db4': 277.18, 'D4': 293.66, 'Eb4': 311.13, 'E4': 329.63,
      'F4': 349.23, 'Gb4': 369.99, 'G4': 392.00, 'Ab4': 415.30, 'A4': 440.00,
      'Bb4': 466.16, 'B4': 493.88,
      'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'G5': 783.99, 'A5': 880.00,
    };
  }

  parseChFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return this.parseChString(content);
  }

  parseChString(content) {
    const clean = content.replace(/\/\/.*$/gm, '');
    const header = this.parseSection(clean, 'HEADER');
    const score = this.parseSection(clean, 'SCORE');
    
    return {
      header: this.parseHeaderBlock(header),
      score: this.parseScoreBlock(score),
    };
  }

  parseSection(content, sectionName) {
    const regex = new RegExp(`\\[${sectionName}\\]([\\s\\S]*?)\\[\\/${sectionName}\\]`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  parseHeaderBlock(text) {
    const header = { bpm: 140, audio_note: 'none' };
    if (!text) return header;
    const lines = text.split('\n').filter(l => l.trim());
    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.substring(0, colonIdx).trim();
      let value = line.substring(colonIdx + 1).trim();
      if (!isNaN(value)) value = Number(value);
      header[key] = value;
    }
    return header;
  }

  parseScoreBlock(text) {
    const events = [];
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('//')) continue;
      events.push({
        line: i,
        time: i * 0.01, // 100 lines = 1 second
        content: line,
      });
    }
    return events;
  }

  // Generate a tone
  generateTone(freq, duration, type = 'bass') {
    const numSamples = Math.floor(duration * this.sampleRate);
    const samples = new Float32Array(numSamples);
    
    for (let i = 0; i < numSamples; i++) {
      const t = i / this.sampleRate;
      const envelope = Math.exp(-t * 3); // Decay
      
      let sample = 0;
      
      switch(type) {
        case 'bass':
          // Sub bass - sine wave with slight saturation
          sample = Math.sin(2 * Math.PI * freq * t);
          sample += Math.sin(2 * Math.PI * freq * 2 * t) * 0.3; // Harmonic
          sample += Math.sin(2 * Math.PI * freq * 3 * t) * 0.1;
          sample *= envelope * 0.8;
          break;
          
        case 'chime':
          // Bell-like tone with harmonics
          sample = Math.sin(2 * Math.PI * freq * t);
          sample += Math.sin(2 * Math.PI * freq * 2.76 * t) * 0.5;
          sample += Math.sin(2 * Math.PI * freq * 5.4 * t) * 0.25;
          sample *= Math.exp(-t * 4) * 0.6;
          break;
          
        case 'kick':
          // Kick drum - pitch sweep down
          const kickFreq = freq * Math.exp(-t * 40);
          sample = Math.sin(2 * Math.PI * kickFreq * t);
          sample *= Math.exp(-t * 8) * 0.9;
          break;
          
        case 'snare':
          // Snare - noise + tone
          sample = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 15) * 0.3;
          sample += (Math.random() * 2 - 1) * Math.exp(-t * 10) * 0.5;
          break;
          
        case 'hihat':
          // Hi-hat - filtered noise
          sample = (Math.random() * 2 - 1) * Math.exp(-t * 40) * 0.3;
          break;
      }
      
      samples[i] = sample;
    }
    
    return samples;
  }

  // Parse a line like [Bass: C2] or [Chime: G4] or [(Bass C2) (Chime G4)]
  parseLine(content) {
    const sounds = [];
    
    // Match [Instrument: Note] or [Instrument Note]
    const singleRegex = /\[(\w+):\s*(\w+)\]/g;
    let match;
    while ((match = singleRegex.exec(content)) !== null) {
      sounds.push({
        instrument: match[1].toLowerCase(),
        note: match[2],
      });
    }
    
    // Match [(Instrument Note)] stacked format
    const stackRegex = /\((\w+)\s+(\w+)\)/g;
    while ((match = stackRegex.exec(content)) !== null) {
      sounds.push({
        instrument: match[1].toLowerCase(),
        note: match[2],
      });
    }
    
    return sounds;
  }

  render(parsed) {
    const duration = parsed.score.length * 0.01;
    const totalSamples = Math.floor(duration * this.sampleRate);
    const buffer = new Float32Array(totalSamples);
    
    for (const event of parsed.score) {
      const sounds = this.parseLine(event.content);
      
      for (const sound of sounds) {
        const freq = this.notes[sound.note];
        if (!freq) continue;
        
        const soundDuration = this.getSoundDuration(sound.instrument);
        const samples = this.generateTone(freq, soundDuration, sound.instrument);
        
        const startSample = Math.floor(event.time * this.sampleRate);
        
        for (let i = 0; i < samples.length && (startSample + i) < totalSamples; i++) {
          buffer[startSample + i] += samples[i];
        }
      }
    }
    
    return this.normalize(buffer);
  }

  getSoundDuration(instrument) {
    switch(instrument) {
      case 'bass': return 0.3;
      case 'chime': return 0.5;
      case 'kick': return 0.2;
      case 'snare': return 0.15;
      case 'hihat': return 0.05;
      default: return 0.2;
    }
  }

  normalize(buffer) {
    let max = 0;
    for (let i = 0; i < buffer.length; i++) {
      const abs = Math.abs(buffer[i]);
      if (abs > max) max = abs;
    }
    if (max > 0.95) {
      const scale = 0.95 / max;
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] *= scale;
      }
    }
    return buffer;
  }

  writeWAV(filePath, buffer) {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = this.sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const dataSize = buffer.length * blockAlign;
    const headerSize = 44;
    const fileSize = headerSize + dataSize;
    
    const header = Buffer.alloc(headerSize);
    
    header.write('RIFF', 0);
    header.writeUInt32LE(fileSize - 8, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(this.sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);
    
    const intBuffer = Buffer.alloc(dataSize);
    for (let i = 0; i < buffer.length; i++) {
      const sample = Math.max(-1, Math.min(1, buffer[i]));
      const intSample = Math.floor(sample * 32767);
      intBuffer.writeInt16LE(intSample, i * 2);
    }
    
    const output = Buffer.concat([header, intBuffer]);
    fs.writeFileSync(filePath, output);
    return filePath;
  }

  renderFile(chFilePath, outputPath) {
    const parsed = this.parseChFile(chFilePath);
    const buffer = this.render(parsed);
    const outPath = outputPath || chFilePath.replace('.ch', '.wav');
    return this.writeWAV(outPath, buffer);
  }
}

module.exports = ChromeHarmonyEngine;
