#!/usr/bin/env node

const ChromeHarmonyEngine = require('../src/engine');
const ProfileManager = require('../src/profiles');
const PresetManager = require('../src/presets');

const engine = new ChromeHarmonyEngine();
const profiles = new ProfileManager();
const presets = new PresetManager();

const command = process.argv[2];
const args = process.argv.slice(3);

function showHelp() {
  console.log(`
Chrome Harmony - Audio-first language. Write audio, export audio.

Commands:
  render <file.ch> [--play]           Render .ch file to .wav
  profile save --name <name> --source <audio>   Save voice profile
  profile list                                 List saved profiles
  profile verify --name <name> --source <audio>  Verify voice ownership
  profile delete --name <name>                 Delete a profile
  preset save --name <name> --source <audio>   Save audio as preset
  preset list                                  List saved presets
  preset delete --name <name>                  Delete a preset

Examples:
  chrome-harmony render more_painting.ch
  chrome-harmony render more_painting.ch --play
  chrome-harmony profile save --name nine_vicious --source voice.wav
  chrome-harmony profile verify --name nine_vicious --source proof.wav
  chrome-harmony preset save --name prettifun --source bass.wav
  `);
}

function parseArgs(args) {
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace('--', '');
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      result[key] = value;
      if (value !== true) i++;
    } else if (!result._) {
      result._ = args[i];
    }
  }
  return result;
}

async function main() {
  switch (command) {
    case 'render': {
      const parsed = parseArgs(args);
      const file = parsed._ || args[0];
      if (!file) {
        console.error('Error: No .ch file specified');
        process.exit(1);
      }
      
      console.log(`Rendering ${file}...`);
      try {
        const outputPath = engine.renderFile(file);
        console.log(`Rendered: ${outputPath}`);
        
        if (parsed.play) {
          console.log('Playing audio...');
          // Would trigger system audio player
        }
      } catch (err) {
        console.error(`Render error: ${err.message}`);
        process.exit(1);
      }
      break;
    }
    
    case 'profile': {
      const parsed = parseArgs(args);
      const subcommand = parsed._ || args[0];
      
      switch (subcommand) {
        case 'save':
          if (!parsed.name || !parsed.source) {
            console.error('Usage: chrome-harmony profile save --name <name> --source <audio>');
            process.exit(1);
          }
          console.log(`Analyzing ${parsed.source}...`);
          console.log('Extracting voice profile...');
          const saved = profiles.save(parsed.name, parsed.source);
          console.log(`Profile saved: ${parsed.name}.chprofile`);
          console.log(`  Octave: ${saved.settings.base_octave}`);
          console.log(`  Formant: ${saved.settings.formant}`);
          console.log(`  Breath: ${saved.settings.breath}`);
          console.log(`  Grit: ${saved.settings.grit}`);
          console.log(`  Richness: ${saved.settings.richness}`);
          break;
          
        case 'list':
          const allProfiles = profiles.list();
          if (allProfiles.length === 0) {
            console.log('No profiles saved.');
          } else {
            console.log('Saved profiles:');
            allProfiles.forEach(p => {
              console.log(`  ${p.name} ${p.verified ? '(verified)' : ''} — ${p.created}`);
            });
          }
          break;
          
        case 'verify':
          if (!parsed.name || !parsed.source) {
            console.error('Usage: chrome-harmony profile verify --name <name> --source <audio>');
            process.exit(1);
          }
          console.log('Analyzing verification audio...');
          console.log('Checking spectral consistency...');
          console.log('Checking natural prosody...');
          console.log('Checking length...');
          console.log('Checking uniqueness...');
          console.log('Matching to profile...');
          
          const result = profiles.verify(parsed.name, parsed.source);
          if (result.passed) {
            console.log(`Match: ${(result.match * 100).toFixed(1)}%`);
            console.log('Verification passed.');
            console.log(`Censorship disabled for profile: ${parsed.name}`);
          } else {
            console.log(`Match: ${(result.match * 100).toFixed(1)}%`);
            console.log('Verification failed.');
            console.log('Profile remains restricted.');
          }
          break;
          
        case 'delete':
          if (!parsed.name) {
            console.error('Usage: chrome-harmony profile delete --name <name>');
            process.exit(1);
          }
          if (profiles.delete(parsed.name)) {
            console.log(`Profile deleted: ${parsed.name}`);
          } else {
            console.log(`Profile not found: ${parsed.name}`);
          }
          break;
          
        default:
          console.error('Unknown profile command. Use: save, list, verify, delete');
          process.exit(1);
      }
      break;
    }
    
    case 'preset': {
      const parsed = parseArgs(args);
      const subcommand = parsed._ || args[0];
      
      switch (subcommand) {
        case 'save':
          if (!parsed.name || !parsed.source) {
            console.error('Usage: chrome-harmony preset save --name <name> --source <audio>');
            process.exit(1);
          }
          presets.save(parsed.name, parsed.source);
          console.log(`Preset saved: ${parsed.name}`);
          break;
          
        case 'list':
          const allPresets = presets.list();
          if (allPresets.length === 0) {
            console.log('No presets saved.');
          } else {
            console.log('Saved presets:');
            allPresets.forEach(p => {
              console.log(`  ${p.name} — ${p.created}`);
            });
          }
          break;
          
        case 'delete':
          if (!parsed.name) {
            console.error('Usage: chrome-harmony preset delete --name <name>');
            process.exit(1);
          }
          if (presets.delete(parsed.name)) {
            console.log(`Preset deleted: ${parsed.name}`);
          } else {
            console.log(`Preset not found: ${parsed.name}`);
          }
          break;
          
        default:
          console.error('Unknown preset command. Use: save, list, delete');
          process.exit(1);
      }
      break;
    }
    
    case 'help':
    case '--help':
    case '-h':
    default:
      showHelp();
      break;
  }
}

main();
