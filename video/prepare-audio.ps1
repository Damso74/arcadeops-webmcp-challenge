param(
  [string]$Ffmpeg = "$env:TEMP\codex-ffmpeg.exe"
)

$ErrorActionPreference = "Stop"

$videoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$inputAudio = Join-Path $videoRoot "assets\narration-master.mp3"
$outputAudio = Join-Path $videoRoot "assets\narration-final.wav"

if (-not (Test-Path -LiteralPath $Ffmpeg)) {
  throw "FFmpeg was not found at $Ffmpeg"
}

if (-not (Test-Path -LiteralPath $inputAudio)) {
  throw "Narration master was not found at $inputAudio"
}

# Keep the ElevenLabs delivery at its generated cadence. The measured values are
# from the Damien master and let loudnorm reach approximately -16 LUFS while
# preserving a safe -1.5 dBTP ceiling. No tempo or pitch processing is applied.
& $Ffmpeg `
  -hide_banner `
  -y `
  -i $inputAudio `
  -af "adelay=700,loudnorm=I=-13:TP=-1.5:LRA=11:measured_I=-18.69:measured_TP=-0.70:measured_LRA=5.50:measured_thresh=-29.13:offset=2.09:linear=false,aresample=48000,apad,atrim=duration=71.96" `
  -c:a pcm_s24le `
  $outputAudio

if ($LASTEXITCODE -ne 0) {
  throw "Audio preparation failed with exit code $LASTEXITCODE"
}

Write-Output $outputAudio
