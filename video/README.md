# Video production

- Final narration source: `narration.txt`
- Timed script and pronunciation notes: `../submission/video-script.md`
- Target: 1920×1080, approximately 1:16, hard maximum 2:55
- Voice: ElevenLabs `Liam - Energetic, Social Media Creator`, Eleven Multilingual v2, generated speed 1.20
- Source format: MP3 44.1 kHz, 128 kbps; final mix measured at -16.6 LUFS with a -1.5 dBTP peak
- Final render: 1920×1080 H.264/AAC, 1:16
- Captures must come from the deployed application and real WebMCP-compatible interactions.
- No music, third-party logo, private tab, credential, production identifier, or customer data.

`capture-demo.mjs`, `prepare-audio.ps1`, `generate-captions.mjs`, and `render-video.ps1` reproduce the capture and media pipeline. The native ElevenLabs cadence is preserved: no tempo or pitch stretching is applied. Raw browser footage and narration masters are excluded from Git; the final MP4, thumbnail, captions, source text, and `elevenlabs-generation.json` settings are retained.
