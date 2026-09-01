# Video production

- Final narration source: `narration.txt`
- Timed script and pronunciation notes: `../submission/video-script.md`
- Target: 1920×1080, approximately 1:48, hard maximum 2:55
- Voice: existing ElevenLabs `George - Warm, Captivating Storyteller`
- Source format: MP3 44.1 kHz, 128 kbps; final mix measured at -16.54 LUFS with a -1.38 dBTP peak
- Final render: 1920×1080 H.264/AAC, approximately 1:48
- Captures must come from the deployed application and real WebMCP-compatible interactions.
- No music, third-party logo, private tab, credential, production identifier, or customer data.

`capture-demo.mjs`, `prepare-audio.ps1`, `generate-captions.mjs`, and `render-video.ps1` reproduce the capture and media pipeline. Raw browser footage and narration masters are excluded from Git; the final MP4, thumbnail, captions, source text, and generation settings are retained.
