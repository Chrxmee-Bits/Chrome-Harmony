# Chrome Harmony

An audio-first language. Write audio, export audio. A local DAW in text.

## What is Chrome Harmony?

Chrome Harmony is a text-based DAW. You write `.ch` files and render them to `.wav` or `.mp3`. 
It's like BandLab, but everything is text. Import beats, clone voices, smash instruments together — all by writing.

## The Timeline

- 100 lines = 1 second
- Each line = 0.01 seconds
- Time is visible. The file is the timeline.

## Quick Start

```bash
# Render a song
chrome-harmony render examples/hello_world.ch

# Save a voice profile from audio
chrome-harmony profile save --name my_voice --source recording.wav

# Save any audio as a preset
chrome-harmony preset save --name my_bass --source bass_hit.wav

# Verify a voice to unlock full range
chrome-harmony profile verify --name my_voice --source weird_sentence.wav
