const fs = require('fs');
const path = require('path');

const PRESET_DIR = path.join(process.cwd(), 'presets');

class PresetManager {
  constructor() {
    this.ensureDirectory();
  }
  
  ensureDirectory() {
    if (!fs.existsSync(PRESET_DIR)) {
      fs.mkdirSync(PRESET_DIR, { recursive: true });
    }
  }
  
  // Save an audio file as a named preset
  save(name, audioPath) {
    const presetDir = path.join(PRESET_DIR, name);
    fs.mkdirSync(presetDir, { recursive: true });
    
    // Copy audio file into preset directory
    const ext = path.extname(audioPath);
    const destPath = path.join(presetDir, `source${ext}`);
    fs.copyFileSync(audioPath, destPath);
    
    // Save preset metadata
    const preset = {
      name: name,
      source: destPath,
      created: new Date().toISOString(),
    };
    
    const presetPath = path.join(PRESET_DIR, `${name}.chpreset`);
    fs.writeFileSync(presetPath, JSON.stringify(preset, null, 2));
    
    return preset;
  }
  
  // Load a preset
  load(name) {
    const presetPath = path.join(PRESET_DIR, `${name}.chpreset`);
    if (!fs.existsSync(presetPath)) {
      throw new Error(`Preset not found: ${name}`);
    }
    return JSON.parse(fs.readFileSync(presetPath, 'utf-8'));
  }
  
  // List all presets
  list() {
    if (!fs.existsSync(PRESET_DIR)) return [];
    return fs.readdirSync(PRESET_DIR)
      .filter(f => f.endsWith('.chpreset'))
      .map(f => {
        const preset = JSON.parse(fs.readFileSync(path.join(PRESET_DIR, f), 'utf-8'));
        return {
          name: preset.name,
          created: preset.created,
        };
      });
  }
  
  // Delete a preset
  delete(name) {
    const presetPath = path.join(PRESET_DIR, `${name}.chpreset`);
    const presetDir = path.join(PRESET_DIR, name);
    
    let deleted = false;
    
    if (fs.existsSync(presetPath)) {
      fs.unlinkSync(presetPath);
      deleted = true;
    }
    
    if (fs.existsSync(presetDir)) {
      fs.rmSync(presetDir, { recursive: true });
      deleted = true;
    }
    
    return deleted;
  }
}

module.exports = PresetManager;
