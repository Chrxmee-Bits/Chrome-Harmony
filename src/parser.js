// src/parser.js
// Chrome Harmony Parser
// Handles HEADER, PATTERNS, TRACKS, IMPORTS, VOCAL_SPAN, SCORE
// Supports: patterns, tracks, sidechain, glide, microtones, grid time

const fs = require('fs');
const { durationToBeats } = require('./notes');

function parseChFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseChString(content);
}

function parseChString(content) {
  // Strip comments
  const clean = content.replace(/\/\/.*$/gm, '');

  const header = getSection(clean, 'HEADER');
  const patterns = getSection(clean, 'PATTERNS');
  const imports = getSection(clean, 'IMPORTS');
  const score = getSection(clean, 'SCORE');

  const parsedPatterns = parsePatternsBlock(patterns);

  return {
    header: parseHeaderBlock(header),
    patterns: parsedPatterns,
    imports: parseImportsBlock(imports),
    tracks: parseScoreTracks(score, parsedPatterns),
    vocalSpans: parseVocalSpans(score),
  };
}

function getSection(content, name) {
  const regex = new RegExp(`\\[${name}\\]([\\s\\S]*?)\\[\\/${name}\\]`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

// ============================================================
// HEADER
// ============================================================

function parseHeaderBlock(text) {
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

// ============================================================
// PATTERNS
// ============================================================

function parsePatternsBlock(text) {
  const patterns = {};
  if (!text) return patterns;

  const patternRegex = /\[PATTERN:\s*(\w+)\]([\s\S]*?)\[\/PATTERN\]/gi;
  let match;

  while ((match = patternRegex.exec(text)) !== null) {
    const name = match[1];
    const body = match[2].trim();
    patterns[name] = parseTrackLines(body);
  }

  return patterns;
}

// ============================================================
// IMPORTS
// ============================================================

function parseImportsBlock(text) {
  const imports = [];
  if (!text) return imports;

  const lines = text.split('\n').filter(l => l.trim());
  for (const line of lines) {
    if (line.startsWith('import:')) {
      imports.push(parseImportLine(line));
    }
  }

  return imports;
}

function parseImportLine(line) {
  const importData = {};
  const parts = line.substring(7).split(/\s+/);
  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) {
      importData.file = part;
      continue;
    }
    const key = part.substring(0, colonIdx).trim();
    let value = part.substring(colonIdx + 1).trim();
    if (!isNaN(value)) value = Number(value);
    importData[key] = value;
  }
  return importData;
}

// ============================================================
// SCORE TRACKS
// ============================================================

function parseScoreTracks(text, patterns) {
  const tracks = {};
  if (!text) return tracks;

  // Expand pattern references first
  let expanded = text;
  const patternRefRegex = /pattern:(\w+)/gi;
  let refMatch;
  while ((refMatch = patternRefRegex.exec(text)) !== null) {
    const patternName = refMatch[1];
    if (patterns[patternName]) {
      const patternLines = patterns[patternName].map(e => e.content).join('\n');
      expanded = expanded.replace(refMatch[0], patternLines);
    }
  }

  // Parse [TRACK: name sidechain:kick] blocks
  const trackRegex = /\[TRACK:\s*(\w+)(?:\s+sidechain:(kick))?\s*\]([\s\S]*?)\[\/TRACK\]/gi;
  let trackMatch;

  while ((trackMatch = trackRegex.exec(expanded)) !== null) {
    const trackName = trackMatch[1];
    const hasSidechain = trackMatch[2] === 'kick';
    const trackBody = trackMatch[3];
    
    tracks[trackName] = {
      events: parseTrackLines(trackBody),
      sidechain: hasSidechain,
    };
  }

  // If no track blocks found, treat entire score as single "main" track
  if (Object.keys(tracks).length === 0 && expanded.trim()) {
    tracks.main = {
      events: parseTrackLines(expanded),
      sidechain: false,
    };
  }

  return tracks;
}

function parseTrackLines(text) {
  const events = [];
  const lines = text.split('\n');
  let currentBeat = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('//')) continue;
    if (trimmed.startsWith('[VOCAL_SPAN]')) continue;

    // Silence command
    if (trimmed.startsWith('silence')) {
      const durMatch = trimmed.match(/silence\s+(\w+)/);
      if (durMatch) {
        currentBeat += durationToBeats(durMatch[1]);
      }
      continue;
    }

    // Pattern reference inline
    if (trimmed.startsWith('pattern:')) {
      continue; // Already expanded above
    }

    // Grid time: line:N
    const lineMatch = trimmed.match(/^line:(\d+)\s+(.+)/i);
    if (lineMatch) {
      const time = parseInt(lineMatch[1]) * 0.01;
      const sounds = parseSoundTokens(lineMatch[2]);
      if (sounds.length > 0) {
        events.push({ beat: null, time, sounds });
      }
      continue;
    }

    // Musical time: Instrument:Note Duration effects...
    const soundMatch = trimmed.match(/^(\w+):(\S+)\s+(\w+)(.*)/);
    if (soundMatch) {
      const instrument = soundMatch[1];
      const note = soundMatch[2];
      const duration = soundMatch[3];
      const effectsStr = soundMatch[4] || '';
      const effects = parseEffects(effectsStr);
      const beats = durationToBeats(duration);

      events.push({
        beat: currentBeat,
        time: null,
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

    // Stacked sounds: (Instrument Note)
    const stacked = parseStackedSounds(trimmed);
    if (stacked.length > 0) {
      events.push({
        beat: currentBeat,
        time: null,
        sounds: stacked,
      });
      currentBeat += 1; // default quarter per stack
    }
  }

  return events;
}

function parseSoundTokens(content) {
  const sounds = [];

  // [Instrument:Note effects...]
  const bracketRegex = /\[(\w+):(\S+)\s*([^\]]*)\]/g;
  let match;
  while ((match = bracketRegex.exec(content)) !== null) {
    sounds.push({
      instrument: match[1],
      note: match[2],
      effects: parseEffects(match[3]),
    });
  }

  // (Instrument Note)
  sounds.push(...parseStackedSounds(content));

  return sounds;
}

function parseStackedSounds(content) {
  const sounds = [];
  const parenRegex = /\((\w+)\s+(\S+)(?:\s+glide:(\S+))?\s*\)/g;
  let match;

  while ((match = parenRegex.exec(content)) !== null) {
    const sound = {
      instrument: match[1],
      note: match[2],
    };
    if (match[3]) {
      sound.glideFrom = match[3];
    }
    sounds.push(sound);
  }

  return sounds;
}

function parseEffects(str) {
  const effects = {};
  if (!str) return effects;

  const parts = str.trim().split(/\s+/);
  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) continue;
    const key = part.substring(0, colonIdx).trim();
    let value = part.substring(colonIdx + 1).trim();
    if (!isNaN(value)) value = parseFloat(value);
    effects[key] = value;
  }

  return effects;
}

// ============================================================
// VOCAL SPANS
// ============================================================

function parseVocalSpans(text) {
  const spans = [];
  if (!text) return spans;

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
