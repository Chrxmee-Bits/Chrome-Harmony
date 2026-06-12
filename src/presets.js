// Instrument/sample preset management

const fs = require('fs');
const path = require('path');

const PRESET_DIR = path.join(process.cwd(), 'presets');

class PresetManager {
  constructor() {
    if (!fs.existsSync(PRESET_DIR)) {
      fs.mkdirSync(PRESET_DIR, { recursive: true });
    }
  }
