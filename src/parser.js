// Reads .ch files, parses blended syntax

const fs = require('fs');

function parseChFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseChString(content);
}

function parseChString(content) {
  // Strip comments
  const clean = content.replace(/\/\/.*$/gm, '');
  
  const header = parseSection(clean, 'HEADER');
  const score = parseSection(clean, 'SCORE');
  
  return {
    header: parseHeader(header),
    gridEvents: parseScoreGrid(score),
    musicalEvents: parseScoreMusical(score),
    vocalSpans: parseVocalSpans(score),
  };
}

function parseSection(content, name) {
  const regex = new RegExp(`\\[${name}\\]([\\s\\S]*?)\\[\\/${name}\\]`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

function parseHeader(text) {
  const header = { tempo: 140, audio_note: 'none' };
  if (!text) return header;
  
  text.split('\n').filter(l => l.trim()).forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.substring(0, idx).trim();
    let value = line.substring(idx + 1).trim();
    if (!isNaN(value)) value = Number(value);
    header[key] = value;
  });
  
  return header;
}

function parseScoreGrid(text) {
  const events = [];
  const lines = text.split('\n');
  let lineNumber = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      lineNumber++;
      continue;
    }
    
    // Grid-specific: line:N
    const lineMatch = trimmed.match(/^line:(\d+)\s+(.+)/i);
    if (lineMatch) {
      const time = parseInt(lineMatch[1]) * 0.01;
      const content = lineMatch[2];
      const sounds = parseSounds(content);
      if (sounds.length > 0) {
        events.push({ time, sounds });
      }
      continue;
    }
    
    // Inline sounds on this line (grid mode)
    const sounds = parseSounds(trimmed);
    if (sounds.length > 0) {
      events.push({ time: lineNumber * 0.01, sounds });
    }
    
    lineNumber++;
  }
  
  return events;
}

function parseScoreMusical(text) {
  const events = [];
  const lines = text.split('\n');
  let currentBeat = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('line:')) continue;
    if (trimmed.startsWith('[VOCAL_SPAN]')) continue;
    
    // Silence: duration
    if (trimmed.startsWith('silence')) {
      const durMatch = trimmed.match(/silence\s+(\w+)/);
      if (durMatch) {
        const beats = durationToBeats(durMatch[1]);
        currentBeat += beats;
      }
      continue;
    }
    
    // Instrument:Note Duration effects...
    const soundMatch = trimmed.match(/^(\w+):(\w+)\s+(\w+)(.*)/);
    if (soundMatch) {
      const instrument = soundMatch[1];
      const note = soundMatch[2];
      const duration = soundMatch[3];
      const effectsStr = soundMatch[4] || '';
      
      const effects = parseEffects(effectsStr);
      const beats = durationToBeats(duration);
      
      events.push({
        beat: currentBeat,
        sounds: [{
          instrument,
          note,
          duration,
          effects: Object.keys(effects).length > 0 ? effects : null,
        }],
      });
      
      currentBeat += beats;
      continue;
    }
    
    // Stacked sounds: (Instrument Note) (Instrument Note)
    const stackMatch = trimmed.match(/\((\w+)\s+(\w+)\)/g);
    if (stackMatch) {
      const sounds = [];
      for (const s of stackMatch) {
        const inner = s.match(/\((\w+)\s+(\w+)\)/);
        if (inner) {
          sounds.push({ instrument: inner[1], note: inner[2], duration: 'quarter' });
        }
      }
      events.push({ beat: currentBeat, sounds });
      currentBeat += 1; // default quarter
    }
  }
  
  return events;
}

function parseSounds(content) {
  const sounds = [];
  
  // [Instrument:Note] or [Instrument:Note effects...]
  const bracketRegex = /\[(\w+):(\w+)\s*([^\]]*)\]/g;
  let match;
  while ((match = bracketRegex.exec(content)) !== null) {
    sounds.push({
      instrument: match[1],
      note: match[2],
      effects: parseEffects(match[3]),
    });
  }
  
  // (Instrument Note)
  const parenRegex = /\((\w+)\s+(\w+)\)/g;
  while ((match = parenRegex.exec(content)) !== null) {
    sounds.push({
      instrument: match[1],
      note: match[2],
    });
  }
  
  return sounds;
}

function parseEffects(str) {
  const effects = {};
  if (!str) return effects;
  
  const parts = str.trim().split(/\s+/);
  for (const part of parts) {
    const [key, value] = part.split(':');
    if (key && value !== undefined) {
      effects[key] = isNaN(value) ? value : parseFloat(value);
    }
  }
  
  return effects;
}

function durationToBeats(duration) {
  const map = {
    'whole': 4,
    'half': 2,
    'quarter': 1,
    'eighth': 0.5,
    'sixteenth': 0.25,
    'thirtysecond': 0.125,
  };
  return map[duration] || 0.25;
}

function parseVocalSpans(text) {
  const spans = [];
  const regex = /\[VOCAL_SPAN\]([\s\S]*?)\[\/VOCAL_SPAN\]/gi;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const spanText = match[1];
    const span = {};
    spanText.split('\n').filter(l => l.trim()).forEach(line => {
      const idx = line.indexOf(':');
      if (idx === -1) return;
      const key = line.substring(0, idx).trim();
      let value = line.substring(idx + 1).trim();
      if (!isNaN(value)) value = Number(value);
      span[key] = value;
    });
    spans.push(span);
  }
  
  return spans;
}

module.exports = { parseChFile, parseChString };
