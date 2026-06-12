// ADSR envelopes — kills the appliance hum

function apply(samples, attackTime, releaseTime, sampleRate = 44100) {
  const attackSamples = Math.floor(attackTime * sampleRate);
  const releaseSamples = Math.floor(releaseTime * sampleRate);
  const totalSamples = samples.length;
  
  const output = new Float32Array(totalSamples);
  
  for (let i = 0; i < totalSamples; i++) {
    let envelope = 1.0;
    
    // Attack phase
    if (i < attackSamples && attackSamples > 0) {
      envelope = i / attackSamples;
    }
    
    // Release phase
    const releaseStart = totalSamples - releaseSamples;
    if (i >= releaseStart && releaseSamples > 0) {
      envelope = (totalSamples - i) / releaseSamples;
    }
    
    output[i] = samples[i] * envelope;
  }
  
  return output;
}

// Sustain at a certain level between attack and release
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
      const decayPos = (i - attackSamples) / decaySamples;
      envelope = 1.0 - (1.0 - sustainLevel) * decayPos;
    } else if (i < releaseStart) {
      envelope = sustainLevel;
    } else if (releaseSamples > 0) {
      const releasePos = (i - releaseStart) / releaseSamples;
      envelope = sustainLevel * (1.0 - releasePos);
    }
    
    output[i] = samples[i] * envelope;
  }
  
  return output;
}

module.exports = { apply, adsr };
