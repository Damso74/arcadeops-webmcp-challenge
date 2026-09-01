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

# Keep the ElevenLabs delivery at its generated cadence. Tempo processing made
# earlier cuts sound unnaturally slow, so post-production only delays, resamples,
# normalizes and pads the native read.
& $Ffmpeg `
  -hide_banner `
  -y `
  -i $inputAudio `
  -af "adelay=1200,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,apad,atrim=duration=76.00" `
  -c:a pcm_s24le `
  $outputAudio

if ($LASTEXITCODE -ne 0) {
  throw "Audio preparation failed with exit code $LASTEXITCODE"
}

Write-Output $outputAudio
