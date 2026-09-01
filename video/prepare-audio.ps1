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

# ElevenLabs delivered the 318-word read at a brisk 85.5 seconds. Rubber Band
# lowers tempo without lowering pitch. Three seconds of lead-in and a short
# closing hold bring the editorial master to the final 2:39.06 duration.
& $Ffmpeg `
  -hide_banner `
  -y `
  -i $inputAudio `
  -af "rubberband=tempo=0.55:pitch=1.0,aresample=48000,adelay=3000,loudnorm=I=-16:TP=-1.5:LRA=11,apad,atrim=duration=159.06" `
  -c:a pcm_s24le `
  $outputAudio

if ($LASTEXITCODE -ne 0) {
  throw "Audio preparation failed with exit code $LASTEXITCODE"
}

Write-Output $outputAudio
