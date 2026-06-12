// Sound generators — each instrument sounds different

function generate(instrument, freq, duration, sampleRate = 44100) {
  switch (instrument.toLowerCase()) {
    case 'bass':    return bass(freq, duration, sampleRate);
    case 'kick':    return kick(freq, duration, sampleRate);
    case 'snare':   return snare(freq, duration, sampleRate);
    case 'hihat':   return hihat(freq, duration, sampleRate);
    case 'clap':    return clap(freq, duration, sampleRate);
    case 'chime':   return chime(freq, duration, sampleRate);
    case 'piano':   return piano(freq, duration, sampleRate);
    case 'pad':     return pad(freq, duration, sampleRate);
    case 'lead':    return lead(freq, duration, sampleRate);
    case 'pluck':   return pluck(freq, duration, sampleRate);
    case 'fx':      return fx(freq, duration, sampleRate);
    default:        return bass(freq, duration, sampleRate);
  }
}

// Sub bass with harmonics
function bass(freq, duration, sampleRate) {
  const n = Math.floor(duration * sampleRate);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    let s = Math.sin(2 * Math.PI * freq * t);
    s += Math.sin(2 * Math.PI * freq * 2 * t) * 0.3;
    s += Math.sin(2 * Math.PI * freq * 3 * t) * 0.1;
    samples[i] = s * 0.7;
  }
  return samples;
}

// Kick drum — pitch sweep
function kick(freq, duration, sampleRate) {
  const n = Math.floor(duration * sampleRate);
  const samples = new Float32Array(n);
  const startFreq = freq * 1.5;
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const sweepFreq = startFreq * Math.exp(-t * 30);
    let s = Math.sin(2 * Math.PI * sweepFreq * t);
    s *= Math.exp(-t * 10);
    samples[i] = s * 0.9;
  }
  return samples;
}

// Snare — tone + noise
function snare(freq, duration, sampleRate) {
  const n = Math.floor(duration * sampleRate);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const tone = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 20) * 0.4;
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 15) * 0.6;
    samples[i] = tone + noise;
  }
  return samples;
}

// Hi-hat — filtered noise
function hihat(freq, duration, sampleRate) {
  const n = Math.floor(duration * sampleRate);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const noise = (Math.random() * 2 - 1);
    const env = Math.exp(-t * 50);
    samples[i] = noise * env * 0.4;
  }
  return samples;
}

// Clap — layered noise bursts
function clap(freq, duration, sampleRate) {
  const n = Math.floor(duration * sampleRate);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    let s = (Math.random() * 2 - 1) * Math.exp(-t * 12) * 0.5;
    // Secondary bursts
    s += (Math.random() * 2 - 1) * Math.exp(-(t - 0.02) * 15) * 0.3;
    s += (Math.random() * 2 - 1) * Math.exp(-(t - 0.04) * 18) * 0.2;
    samples[i] = s;
  }
  return samples;
}

// Chime — bell-like with inharmonic overtones
function chime(freq, duration, sampleRate) {
  const n = Math.floor(duration * sampleRate);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 3);
    let s = Math.sin(2 * Math.PI * freq * t);
    s += Math.sin(2 * Math.PI * freq * 2.76 * t) * 0.5;
    s += Math.sin(2 * Math.PI * freq * 5.4 * t) * 0.3;
    s += Math.sin(2 * Math.PI * freq * 8.9 * t) * 0.15;
    samples[i] = s * env * 0.6;
  }
  return samples;
}

// Piano — harmonic series with percussive attack
function piano(freq, duration, sampleRate) {
  const n = Math.floor(duration * sampleRate);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 2.5);
    let s = Math.sin(2 * Math.PI * freq * t);
    s += Math.sin(2 * Math.PI * freq * 2 * t) * 0.6;
    s += Math.sin(2 * Math.PI * freq * 3 * t) * 0.3;
    s += Math.sin(2 * Math.PI * freq * 4 * t) * 0.15;
    s += Math.sin(2 * Math.PI * freq * 5 * t) * 0.08;
    samples[i] = s * env * 0.5;
  }
  return samples;
}

// Pad — slow attack, smooth
function pad(freq, duration, sampleRate) {
  const n = Math.floor(duration * sampleRate);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    let s = Math.sin(2 * Math.PI * freq * t);
    s += Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.4;
    s += Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.3;
    samples[i] = s * 0.3;
  }
  return samples;
}

// Lead — saw-like with edge
function lead(freq, duration, sampleRate) {
  const n = Math.floor(duration * sampleRate);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    let s = 0;
    for (let h = 1; h < 8; h++) {
      s += Math.sin(2 * Math.PI * freq * h * t) / h;
    }
    samples[i] = s * 0.4;
  }
  return samples;
}

// Pluck — short, bright attack
function pluck(freq, duration, sampleRate) {
  const n = Math.floor(duration * sampleRate);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 8);
    let s = Math.sin(2 * Math.PI * freq * t);
    s += Math.sin(2 * Math.PI * freq * 2 * t) * 0.5;
    s += Math.sin(2 * Math.PI * freq * 3 * t) * 0.2;
    samples[i] = s * env * 0.6;
  }
  return samples;
}

// FX — noise sweeps and weirdness
function fx(freq, duration, sampleRate) {
  const n = Math.floor(duration * sampleRate);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const sweep = freq * (0.5 + t * 2);
    let s = Math.sin(2 * Math.PI * sweep * t);
    s += (Math.random() * 2 - 1) * 0.2;
    samples[i] = s * Math.exp(-t) * 0.5;
  }
  return samples;
}

module.exports = { generate };
