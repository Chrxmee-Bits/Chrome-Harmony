// Audio effects — richness, reverb, distortion, chop, filter

function apply(samples, effectParams, sampleRate = 44100) {
  let processed = samples;
  
  if (effectParams.reverb) {
    processed = reverb(processed, effectParams.reverb, sampleRate);
  }
  if (effectParams.distort) {
    processed = distort(processed, effectParams.distort);
  }
  if (effectParams.chop) {
    processed = chop(processed, effectParams.chop);
  }
  if (effectParams.filter !== undefined) {
    processed = filter(processed, effectParams.filter);
  }
  if (effectParams.richness) {
    processed = richness(processed, effectParams.richness);
  }
  if (effectParams.volume !== undefined) {
    processed = gain(processed, effectParams.volume);
  }
  if (effectParams.pan !== undefined) {
    // pan would return stereo, keep mono for now
  }
  
  return processed;
}

function gain(samples, level) {
  const output = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    output[i] = samples[i] * Math.max(0, Math.min(1, level));
  }
  return output;
}

function reverb(samples, amount, sampleRate) {
  const delaySamples = Math.floor(0.03 * sampleRate); // 30ms delay
  const output = new Float32Array(samples.length);
  const decay = amount * 0.6;
  
  for (let i = 0; i < samples.length; i++) {
    output[i] = samples[i];
    if (i >= delaySamples) {
      output[i] += samples[i - delaySamples] * decay;
    }
  }
  return output;
}

function distort(samples, amount) {
  const output = new Float32Array(samples.length);
  const drive = 1 + amount * 20;
  for (let i = 0; i < samples.length; i++) {
    output[i] = Math.tanh(samples[i] * drive) / Math.tanh(drive);
  }
  return output;
}

function chop(samples, amount) {
  const output = new Float32Array(samples.length);
  const chopRate = Math.floor(2 + amount * 20); // chops per buffer
  const chopLength = Math.floor(samples.length / chopRate);
  
  for (let i = 0; i < samples.length; i++) {
    const chopIndex = Math.floor(i / chopLength);
    if (chopIndex % 2 === 0) {
      output[i] = samples[i];
    } else {
      output[i] = 0;
    }
  }
  return output;
}

function filter(samples, amount) {
  // Simple low-pass (0.0) to high-pass (1.0) blend
  const output = new Float32Array(samples.length);
  let prev = 0;
  const lowpassAmount = 1 - amount;
  
  for (let i = 0; i < samples.length; i++) {
    // Low pass
    prev = prev + lowpassAmount * (samples[i] - prev);
    // Blend with original (high pass = original - low pass)
    output[i] = prev * (1 - amount) + samples[i] * amount;
  }
  return output;
}

function richness(samples, amount) {
  // Richness = subtle saturation + EQ-like shaping
  const output = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    let s = samples[i];
    // Add warmth via soft clipping
    s = Math.tanh(s * (1 + amount * 2)) * (0.8 + amount * 0.4);
    output[i] = s;
  }
  return output;
}

module.exports = { apply };
