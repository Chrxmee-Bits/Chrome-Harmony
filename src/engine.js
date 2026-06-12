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
    const secondsPerBeat = 60 / (parsed.header.tempo || 140);

    // Collect kick events for sidechain
    const kickEvents = [];

    // Process each track
    for (const [trackName, trackData] of Object.entries(parsed.tracks)) {
      let currentBeat = 0;
      
      for (const event of trackData.events) {
        // Grid time
        if (event.time !== null && event.time !== undefined) {
          const sampleOffset = Math.floor(event.time * this.sampleRate);
          for (const sound of event.sounds) {
            this.renderSound(masterBuffer, sound, sampleOffset, parsed.header.tempo);
            if (sound.instrument && sound.instrument.toLowerCase().includes('kick')) {
              kickEvents.push({ time: event.time });
            }
          }
          continue;
        }

        // Musical time
        if (event.beat !== null && event.beat !== undefined) {
          const sampleOffset = Math.floor(event.beat * secondsPerBeat * this.sampleRate);
          for (const sound of event.sounds) {
            this.renderSound(masterBuffer, sound, sampleOffset, parsed.header.tempo);
            if (sound.instrument && sound.instrument.toLowerCase().includes('kick')) {
              kickEvents.push({ time: event.beat * secondsPerBeat });
            }
          }
        }
      }
    }

    // Apply sidechain to tracks that request it
    for (const [trackName, trackData] of Object.entries(parsed.tracks)) {
      if (trackData.sidechain && kickEvents.length > 0) {
        // Apply sidechain ducking to the whole master for now
        const ducked = envelopes.sidechain(masterBuffer, kickEvents, this.sampleRate);
        for (let i = 0; i < masterBuffer.length; i++) {
          masterBuffer[i] = ducked[i];
        }
        break; // Only apply once
      }
    }

    const final = mixer.normalize(masterBuffer);
    const outPath = outputPath || chFilePath.replace('.ch', '.wav');
    wavWriter.write(outPath, final, this.sampleRate);
    return outPath;
  }

  renderSound(masterBuffer, sound, sampleOffset, tempo) {
    const freq = notes.getFrequency(sound.note);
    const dur = notes.getDuration(sound.duration || 'quarter', tempo);
    const glideFrom = sound.glideFrom ? notes.getFrequency(sound.glideFrom) : null;
    const raw = instruments.generate(sound.instrument, freq, dur, this.sampleRate, glideFrom);

    let processed;
    if (['pad', 'paddark'].includes(sound.instrument?.toLowerCase())) {
      processed = envelopes.adsr(raw, 0.05, 0.1, 0.7, 0.2, this.sampleRate);
    } else {
      processed = envelopes.apply(raw, 0.003, 0.04, this.sampleRate);
    }

    if (sound.effects && Object.keys(sound.effects).length > 0) {
      processed = effects.apply(processed, sound.effects, this.sampleRate);
    }

    mixer.mixInto(masterBuffer, processed, sampleOffset);
  }

  calculateDuration(parsed) {
    let maxTime = 0;
    const secondsPerBeat = 60 / (parsed.header.tempo || 140);

    for (const trackData of Object.values(parsed.tracks)) {
      for (const event of trackData.events) {
        if (event.time !== null && event.time !== undefined) {
          if (event.time > maxTime) maxTime = event.time;
        }
        if (event.beat !== null && event.beat !== undefined) {
          const t = (event.beat + 1) * secondsPerBeat;
          if (t > maxTime) maxTime = t;
        }
      }
    }

    for (const v of parsed.vocalSpans || []) {
      if (v.end > maxTime) maxTime = v.end;
    }

    return maxTime + 0.5;
  }
}

module.exports = ChromeHarmonyEngine;
