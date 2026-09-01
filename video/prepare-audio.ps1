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

# ElevenLabs delivered the 318-word read at a brisk 85.5 seconds. Keep that
# energy and slow it only enough for international clarity. The former 0.55
# tempo stretched the narration unnaturally; 0.82 preserves a lively delivery.
& $Ffmpeg `
  -hide_banner `
  -y `
  -i $inputAudio `
  -af "rubberband=tempo=0.82:pitch=1.0,aresample=48000,adelay=2200,loudnorm=I=-16:TP=-1.5:LRA=11,apad,atrim=duration=108.00" `
  -c:a pcm_s24le `
  $outputAudio

if ($LASTEXITCODE -ne 0) {
  throw "Audio preparation failed with exit code $LASTEXITCODE"
}

Write-Output $outputAudio
