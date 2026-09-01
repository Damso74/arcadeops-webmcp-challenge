param(
  [string]$Ffmpeg = "$env:TEMP\codex-ffmpeg.exe"
)

$ErrorActionPreference = "Stop"

$videoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $videoRoot
$capture = Join-Path $videoRoot "captures\relay-live-demo.webm"
$audio = Join-Path $videoRoot "assets\narration-final.wav"
$captions = (Join-Path $videoRoot "assets\captions.en.srt").Replace("\", "/").Replace(":", "\:")
$submissionDir = Join-Path $projectRoot "submission\media"
$finalVideo = Join-Path $submissionDir "arcadeops-relay-webmcp-demo.mp4"
$thumbnail = Join-Path $submissionDir "arcadeops-relay-thumbnail.png"

New-Item -ItemType Directory -Path $submissionDir -Force | Out-Null

if (-not (Test-Path -LiteralPath $Ffmpeg)) { throw "FFmpeg was not found at $Fmpeg" }

$font = "C\:/Windows/Fonts/segoeuib.ttf"
$introFilter = "drawbox=x=0:y=0:w=iw:h=ih:color=0x171717@1:t=fill:enable='between(t,0,3.2)',drawbox=x=(w-96)/2:y=(h/2)-116:w=96:h=6:color=0x2563eb@1:t=fill:enable='between(t,0,3.2)',drawtext=fontfile='$font':text='ARCADEOPS RELAY':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2-54:enable='between(t,0,3.2)',drawtext=fontfile='$font':text='Browser agents delegate. Humans decide. Evidence proves.':fontcolor=0xd4d4d4:fontsize=30:x=(w-text_w)/2:y=(h-text_h)/2+46:enable='between(t,0,3.2)'"
$subtitleFilter = "subtitles='$captions':force_style='FontName=Segoe UI,FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H80000000,BorderStyle=3,BackColour=&H70000000,Outline=1,Shadow=0,MarginV=34,Alignment=2'"

& $Ffmpeg `
  -hide_banner `
  -y `
  -i $capture `
  -i $audio `
  -filter_complex "[0:v]$introFilter,$subtitleFilter,tpad=stop_mode=clone:stop_duration=0.18[v];[1:a]anull[a]" `
  -map "[v]" `
  -map "[a]" `
  -t 159.06 `
  -c:v libx264 `
  -preset medium `
  -crf 18 `
  -pix_fmt yuv420p `
  -r 25 `
  -c:a aac `
  -b:a 192k `
  -ar 48000 `
  -movflags +faststart `
  $finalVideo

if ($LASTEXITCODE -ne 0) { throw "Final video render failed with exit code $LASTEXITCODE" }

$thumbnailFilter = "scale=1280:720,drawbox=x=0:y=0:w=650:h=720:color=0x171717@0.98:t=fill,drawbox=x=0:y=0:w=9:h=720:color=0x2563eb@1:t=fill,drawtext=fontfile='$font':text='WEBMCP CHALLENGE':fontcolor=0xa3a3a3:fontsize=22:x=54:y=118,drawtext=fontfile='$font':text='ARCADEOPS':fontcolor=white:fontsize=58:x=54:y=170,drawtext=fontfile='$font':text='RELAY':fontcolor=white:fontsize=58:x=54:y=234,drawtext=fontfile='$font':text='Browser agents delegate.':fontcolor=0xe5e5e5:fontsize=29:x=54:y=344,drawtext=fontfile='$font':text='Humans decide.':fontcolor=0xe5e5e5:fontsize=29:x=54:y=392,drawtext=fontfile='$font':text='Evidence proves.':fontcolor=0xe5e5e5:fontsize=29:x=54:y=440"

& $Ffmpeg `
  -hide_banner `
  -y `
  -ss 150 `
  -i $capture `
  -frames:v 1 `
  -vf $thumbnailFilter `
  $thumbnail

if ($LASTEXITCODE -ne 0) { throw "Thumbnail render failed with exit code $LASTEXITCODE" }

Write-Output $finalVideo
Write-Output $thumbnail
