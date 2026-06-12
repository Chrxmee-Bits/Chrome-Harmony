// Chrome Harmony Language Specification
// This file defines the vocabulary, grammar, and rules of Chrome Harmony.

const LANGUAGE = {
  name: "Chrome Harmony",
  version: "1.0.0",
  
  // === TIMELINE ===
  // 100 lines = 1 second
  // Each line = 0.01 seconds
  // BPM is optional — 140 BPM = ~43 lines per beat
  
  timeline: {
    linesPerSecond: 100,
    secondsPerLine: 0.01,
    defaultBPM: 140,
  },
  
  // === AUDIO NOTE ===
  // Global tuning. The entire file snaps to this key.
  audioNotes: [
    "C major", "C minor",
    "Db major", "C# minor",
    "D major", "D minor",
    "Eb major", "D# minor",
    "E major", "E minor",
    "F major", "F minor",
    "F# major", "F# minor",
    "G major", "G minor",
    "Ab major", "G# minor",
    "A major", "A minor",
    "Bb major", "A# minor",
    "B major", "B minor",
    "none"
  ],
  
  // === INSTRUMENTS ===
  // Built-in synthesized instruments.
  instruments: [
    "Bass",       // Sub bass, 808 style
    "Piano",      // Grand piano
    "Chime",      // Metallic bell, Chrome Harmony's signature
    "Pad",        // Ambient synth pad
    "Lead",       // Lead synth
    "Pluck",      // Plucked string
    "Kick",       // Bass drum
    "Snare",      // Snare drum
    "Hihat",      // Hi-hat cymbal
    "Clap",       // Hand clap
    "Crash",      // Crash cymbal
    "Ride",       // Ride cymbal
    "Tom",        // Tom drum
    "FX",         // Sound effects
  ],
  
  // === EFFECTS ===
  effects: {
    richness:    { min: 0.0, max: 1.0, default: 0.5, desc: "Tune leveling / fullness" },
    tune:        { min: 0.0, max: 1.0, default: 0.0, desc: "Pitch correction amount" },
    distort:     { min: 0.0, max: 1.0, default: 0.0, desc: "Distortion amount" },
    breath:      { min: 0.0, max: 1.0, default: 0.3, desc: "Whisper to full voice" },
    grit:        { min: 0.0, max: 1.0, default: 0.1, desc: "Clean to scream" },
    chaos:       { min: 0.0, max: 1.0, default: 0.0, desc: "Random destruction" },
    speed:       { min: 0.1, max: 5.0, default: 1.0, desc: "Playback speed multiplier" },
    stretch:     { min: 0.1, max: 10.0, default: 1.0, desc: "Time stretch factor" },
    reverse:     { type: "boolean", default: false, desc: "Play in reverse" },
    chop:        { min: 0.0, max: 1.0, default: 0.0, desc: "Glitch chop amount" },
    swing:       { min: 0.0, max: 1.0, default: 0.5, desc: "Swing/groove amount" },
    reverb:      { min: 0.0, max: 1.0, default: 0.0, desc: "Reverb amount" },
    delay:       { min: 0.0, max: 1.0, default: 0.0, desc: "Delay/echo amount" },
    filter:      { min: 0.0, max: 1.0, default: 0.5, desc: "Low-pass to high-pass" },
  },
  
  // === CONSTRUCTORS ===
  constructors: {
    vocalize: {
      desc: "Voice section. Inline or span.",
      params: ["voice", "profile", "speed", "tune", "distort", "breath", "grit", "richness", "chaos", "stretch", "reverse", "chop"],
      modes: ["inline", "span"],
    },
    ensemble: {
      desc: "Group multiple instruments playing together.",
      params: ["instruments", "notes", "timing"],
    },
    randomize: {
      desc: "Chaos section. Randomized music.",
      params: ["pool", "density", "seed", "start", "end"],
    },
  },
  
  // === SECTIONS ===
  sections: {
    HEADER:   ["title", "artist", "bpm", "audio_note", "richness", "swing", "time_sig"],
    VOICES:   "Voice profile definitions",
    PRESETS:  "Instrument preset definitions",
    IMPORTS:  "External audio file declarations",
    SCORE:    "The timeline — where sounds are placed",
  },
  
  // === CENSORSHIP ===
  censorship: {
    cussWords: "allowed",           // fuck, shit, damn, etc.
    slursAndInsults: "bleeped",     // Targeted hate, slurs
    censorMethod: ["bleep", "silence"],
    defaultCensor: "bleep",
    verificationRequired: true,     // Must verify voice ownership to disable
    verificationMinimumLength: 5,   // Seconds — long weird sentence required
  },
  
  // === PROFILE STRUCTURE ===
  profile: {
    params: ["base_octave", "formant", "breath", "grit", "richness"],
    fileExtension: ".chprofile",
    canBeVerified: true,
  },
  
  // === PRESET STRUCTURE ===
  preset: {
    fileExtension: ".chpreset",
    source: "Any audio file imported and saved as a named preset",
  },
  
  // === IMPORT FORMATS ===
  importFormats: [".wav", ".mp3", ".flac", ".ogg", ".aiff"],
  
  // === EXPORT FORMATS ===
  exportFormats: [".wav", ".mp3"],
  
  // === CHPROFILE FORMAT ===
  // A .chprofile file contains voice settings extracted from audio
  profileFormat: {
    name: "string",
    source: "audio_file_path",
    settings: {
      base_octave: "number",
      formant: "number",
      breath: "number",
      grit: "number",
      richness: "number",
    },
    verified: "boolean",
  },
};

module.exports = LANGUAGE;
