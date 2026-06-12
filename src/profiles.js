// Voice profile management

const fs = require('fs');
const path = require('path');

const PROFILE_DIR = path.join(process.cwd(), 'profiles');

class ProfileManager {
  constructor() {
    if (!fs.existsSync(PROFILE_DIR)) {
      fs.mkdirSync(PROFILE_DIR, { recursive: true });
    }
  }

  save(name, audioPath) {
    const profile = {
      name,
      source: audioPath,
      settings: this.scrambleVoice(),
      verified: false,
      created: new Date().toISOString(),
    };
    
    const profilePath = path.join(PROFILE_DIR, `${name}.chprofile`);
    fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
    return profile;
  }

  scrambleVoice() {
    return {
      base_octave: Math.floor(Math.random() * 3) + 2,
      formant: Math.random() * 0.8 + 0.8,
      breath: Math.random() * 0.5,
      grit: Math.random() * 0.3,
      richness: Math.random() * 0.5 + 0.3,
    };
  }

  load(name) {
    const profilePath = path.join(PROFILE_DIR, `${name}.chprofile`);
    if (!fs.existsSync(profilePath)) {
      throw new Error(`Profile not found: ${name}`);
    }
    return JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
  }

  verify(name, audioPath) {
    const profile = this.load(name);
    const settings = this.scrambleVoice();
    const match = 0.92; // placeholder
    const lengthOk = true;
    
    if (match > 0.85 && lengthOk) {
      profile.verified = true;
      const profilePath = path.join(PROFILE_DIR, `${name}.chprofile`);
      fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
      return { passed: true, match };
    }
    
    return { passed: false, match };
  }

  list() {
    if (!fs.existsSync(PROFILE_DIR)) return [];
    return fs.readdirSync(PROFILE_DIR)
      .filter(f => f.endsWith('.chprofile'))
      .map(f => JSON.parse(fs.readFileSync(path.join(PROFILE_DIR, f), 'utf-8')));
  }

  delete(name) {
    const profilePath = path.join(PROFILE_DIR, `${name}.chprofile`);
    if (fs.existsSync(profilePath)) {
      fs.unlinkSync(profilePath);
      return true;
    }
    return false;
  }
}

module.exports = ProfileManager;
