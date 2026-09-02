# Video production

- Final narration source: `narration.txt`
- Timed script and pronunciation notes: `../submission/video-script.md`
- Target: 1920×1080, approximately 1:12, hard maximum 2:55
- Voice: existing ElevenLabs `Damien Voice`, Eleven Multilingual v2, recommended defaults (speed 1.00, stability 0.50, similarity 0.75, style 0)
- Source format: MP3 44.1 kHz, 128 kbps; final mix measured at -16.2 LUFS with a -1.3 dBTP peak
- Final render: 1920×1080 H.264/AAC, 1:11.96
- Visual flow: one chronological production-build capture, visible cursor and click feedback, branded functional crossfades, no replayed action
- Captures must come from the deployed application and real WebMCP-compatible interactions.
- No music, third-party logo, private tab, credential, production identifier, or customer data.

`capture-demo.mjs`, `prepare-audio.ps1`, `generate-captions.mjs`, and `render-video.ps1` reproduce the capture and media pipeline. The native ElevenLabs cadence is preserved: no tempo or pitch stretching is applied. Raw browser footage and narration masters are excluded from Git; the final MP4, thumbnail, captions, source text, and `elevenlabs-generation.json` settings are retained.
