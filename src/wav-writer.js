// Writes Float32Array to valid WAV file

const fs = require('fs');

function write(filePath, buffer, sampleRate = 44100, numChannels = 1, bitDepth = 16) {
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = buffer.length * bytesPerSample;
  const headerSize = 44;
  const fileSize = headerSize + dataSize;
  
  const header = Buffer.alloc(headerSize);
  
  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize - 8, 4);
  header.write('WAVE', 8);
  
  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  
  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  
  // Convert float to int
  const intBuffer = Buffer.alloc(dataSize);
  for (let i = 0; i < buffer.length; i++) {
    const clamped = Math.max(-1, Math.min(1, buffer[i]));
    const intSample = bitDepth === 16 
      ? Math.floor(clamped * 32767)
      : Math.floor(clamped * 8388607);
    
    if (bitDepth === 16) {
      intBuffer.writeInt16LE(intSample, i * 2);
    } else {
      intBuffer.writeInt32LE(intSample, i * 3); // 24-bit
    }
  }
  
  const output = Buffer.concat([header, intBuffer]);
  fs.writeFileSync(filePath, output);
  return filePath;
}

module.exports = { write };
