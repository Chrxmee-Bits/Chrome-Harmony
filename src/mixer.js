// Mixes sample buffers together

function mixInto(masterBuffer, samples, startSample) {
  for (let i = 0; i < samples.length; i++) {
    const idx = startSample + i;
    if (idx < masterBuffer.length) {
      masterBuffer[idx] += samples[i];
    }
  }
}

function normalize(buffer) {
  let maxAmp = 0;
  for (let i = 0; i < buffer.length; i++) {
    const abs = Math.abs(buffer[i]);
    if (abs > maxAmp) maxAmp = abs;
  }
  
  if (maxAmp > 0.95) {
    const scale = 0.95 / maxAmp;
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] *= scale;
    }
  }
  
  return buffer;
}

function mixMultiple(buffers) {
  let maxLength = 0;
  for (const buf of buffers) {
    if (buf.length > maxLength) maxLength = buf.length;
  }
  
  const output = new Float32Array(maxLength);
  for (const buf of buffers) {
    for (let i = 0; i < buf.length; i++) {
      output[i] += buf[i];
    }
  }
  
  return normalize(output);
}

module.exports = { mixInto, normalize, mixMultiple };
