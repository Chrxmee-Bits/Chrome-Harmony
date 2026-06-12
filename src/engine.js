// Chrome Harmony Engine — ties everything together

const parser = require('./parser');
const notes = require('./notes');
const instruments = require('./instruments');
const envelopes = require('./envelopes');
const effects = require('./effects');
const mixer = require('./mixer');
const wavWriter = require('./wav-writer');

class ChromeHarmonyEngine {
  constructor() {
    this.sampleRate = 44100;
  }

  renderFile(chFilePath, outputPath) {
    const parsed = parser.parseChFile(chFilePath);
    const duration = this.calculateDuration(parsed);
    const totalSamples = Math.ceil(duration * this.sampleRate);
    const masterBuffer = new Float32Array(totalSamples);

    // Process grid events (absolute time)
    for (const event of parsed.gridEvents) {
      const sampleOffset = Math.floor(event.time * this.sampleRate);
      for (const sound of event.sounds) {
        this.renderSound(masterBuffer, sound, sampleOffset, parsed.header.tempo);
      }
    }

    // Process musical events (beat-based)
    const secondsPerBeat = 60 / (parsed.header.tempo || 140);
    for (const event of parsed.musicalEvents) {
      const sampleOffset = Math.floor(event.beat * secondsPerBeat * this.sampleRate);
      for (const sound of event.sounds) {
        this.renderSound(masterBuffer, sound, sampleOffset, parsed.header.tempo);
      }
    }

    // Normalize and write
    const final = mixer.normalize(masterBuffer);
    const outPath = outputPath || chFilePath.replace('.ch', '.wav');
    wavWriter.write(outPath, final, this.sampleRate);
    return outPath;
  }

  renderSound(masterBuffer, sound, sampleOffset, tempo) {
    const freq = notes.getFrequency(sound.note);
    const dur = notes.getDuration(sound.duration || 'quarter', tempo);
    const raw = instruments.generate(sound.instrument, freq, dur, this.sampleRate);
    
    // Apply envelope (kills the hum)
    let processed;
    if (['pad'].includes(sound.instrument?.toLowerCase())) {
      processed = envelopes.adsr(raw, 0.05, 0.1, 0.7, 0.2, this.sampleRate);
    } else {
      processed = envelopes.apply(raw, 0.003, 0.04, this.sampleRate);
    }
    
    // Apply effects
    if (sound.effects && Object.keys(sound.effects).length > 0) {
      processed = effects.apply(processed, sound.effects, this.sampleRate);
    }
    
    // Mix into master
    mixer.mixInto(masterBuffer, processed, sampleOffset);
  }

  calculateDuration(parsed) {
    let maxTime = 0;
    
    for (const e of parsed.gridEvents) {
      if (e.time > maxTime) maxTime = e.time;
    }
    
    const secondsPerBeat = 60 / (parsed.header.tempo || 140);
    for (const e of parsed.musicalEvents) {
      const t = (e.beat + 1) * secondsPerBeat;
      if (t > maxTime) maxTime = t;
    }
    
    for (const v of parsed.vocalSpans) {
      if (v.end > maxTime) maxTime = v.end;
    }
    
    return maxTime + 0.1; // small tail
  }
}

module.exports = ChromeHarmonyEngine;
