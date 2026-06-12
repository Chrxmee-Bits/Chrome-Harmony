function apply(samples, attackTime, releaseTime, sampleRate = 44100) {
  const attackSamples = Math.floor(attackTime * sampleRate);
  const releaseSamples = Math.floor(releaseTime * sampleRate);
  const totalSamples = samples.length;
  const output = new Float32Array(totalSamples);
  
  for (let i = 0; i < totalSamples; i++) {
    let envelope = 1.0;
    if (i < attackSamples && attackSamples > 0) {
      envelope = i / attackSamples;
    }
    const releaseStart = totalSamples - releaseSamples;
    if (i >= releaseStart && releaseSamples > 0) {
      envelope = (totalSamples - i) / releaseSamples;
    }
    output[i] = samples[i] * envelope;
  }
  return output;
}

function adsr(samples, attack, decay, sustainLevel, release, sampleRate = 44100) {
  const attackSamples = Math.floor(attack * sampleRate);
  const decaySamples = Math.floor(decay * sampleRate);
  const releaseSamples = Math.floor(release * sampleRate);
  const totalSamples = samples.length;
  const output = new Float32Array(totalSamples);
  const sustainStart = attackSamples + decaySamples;
  const releaseStart = totalSamples - releaseSamples;
  
  for (let i = 0; i < totalSamples; i++) {
    let envelope = 0;
    if (i < attackSamples && attackSamples > 0) {
      envelope = i / attackSamples;
    } else if (i < sustainStart && decaySamples > 0) {
      envelope = 1.0 - (1.0 - sustainLevel) * ((i - attackSamples) / decaySamples);
    } else if (i < releaseStart) {
      envelope = sustainLevel;
    } else if (releaseSamples > 0) {
      envelope = sustainLevel * (1.0 - (i - releaseStart) / releaseSamples);
    }
    output[i] = samples[i] * envelope;
  }
  return output;
}

function sidechain(samples, kickEvents, sampleRate = 44100) {
  if (!kickEvents || kickEvents.length === 0) return samples;
  
  const output = new Float32Array(samples.length);
  const duckAmount = 0.3;
  const duckTime = 0.1;
  const duckSamples = Math.floor(duckTime * sampleRate);
  
  const envelope = new Float32Array(samples.length).fill(1.0);
  
  for (const kick of kickEvents) {
    const kickSample = Math.floor(kick.time * sampleRate);
    for (let i = 0; i < duckSamples && (kickSample + i) < envelope.length; i++) {
      const progress = i / duckSamples;
      const duck = duckAmount + (1.0 - duckAmount) * progress;
      if (duck < envelope[kickSample + i]) {
        envelope[kickSample + i] = duck;
      }
    }
  }
  
  for (let i = 0; i < samples.length; i++) {
    output[i] = samples[i] * envelope[i];
  }
  
  return output;
}

module.exports = { apply, adsr, sidechain };
