param(
  [string]$Ffmpeg = "$env:TEMP\codex-ffmpeg.exe"
)

$ErrorActionPreference = "Stop"

$videoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $videoRoot
$capture = Join-Path $videoRoot "captures\relay-live-demo.webm"
$audio = Join-Path $videoRoot "assets\narration-final.wav"
$logo = Join-Path $videoRoot "assets\arcadeops-checkpoint-v3.png"
$captions = (Join-Path $videoRoot "assets\captions.en.srt").Replace("\", "/").Replace(":", "\:")
$submissionDir = Join-Path $projectRoot "submission\media"
$finalVideo = Join-Path $submissionDir "arcadeops-relay-webmcp-demo.mp4"
$thumbnail = Join-Path $submissionDir "arcadeops-relay-thumbnail.png"

New-Item -ItemType Directory -Path $submissionDir -Force | Out-Null

if (-not (Test-Path -LiteralPath $Ffmpeg)) { throw "FFmpeg was not found at $Ffmpeg" }
if (-not (Test-Path -LiteralPath $capture)) { throw "Demo capture was not found at $capture" }
if (-not (Test-Path -LiteralPath $audio)) { throw "Prepared narration was not found at $audio" }
if (-not (Test-Path -LiteralPath $logo)) { throw "ArcadeOps brand mark was not found at $logo" }

$fontBold = "C\:/Windows/Fonts/segoeuib.ttf"
$fontRegular = "C\:/Windows/Fonts/segoeui.ttf"
$subtitleFilter = "subtitles='$captions':force_style='FontName=Segoe UI,FontSize=10,PrimaryColour=&H00FFFFFF,OutlineColour=&H70000000,BorderStyle=3,BackColour=&H72000000,Outline=1,Shadow=0,MarginV=26,Alignment=2'"

# Every source segment moves forward in time. Half-second overlaps are used only
# for functional crossfades, so actions are never replayed or shown out of order.
$videoFilter = "[0:v]split=5[v0][v1][v2][v3][v4];" +
  "[v0]trim=start=0:end=12,setpts=PTS-STARTPTS[s0];" +
  "[v1]trim=start=11.5:end=24.5,setpts=PTS-STARTPTS,crop=1650:928:150:45,scale=1920:1080[s1];" +
  "[v2]trim=start=24:end=36.5,setpts=PTS-STARTPTS,crop=1650:928:180:45,scale=1920:1080[s2];" +
  "[v3]trim=start=36:end=65,setpts=PTS-STARTPTS,crop=1400:788:430:70,scale=1920:1080[s3];" +
  "[v4]trim=start=64.5:end=71.96,setpts=PTS-STARTPTS[s4];" +
  "[s0][s1]xfade=transition=fade:duration=0.5:offset=11.5[x1];" +
  "[x1][s2]xfade=transition=fade:duration=0.5:offset=24[x2];" +
  "[x2][s3]xfade=transition=fade:duration=0.5:offset=36[x3];" +
  "[x3][s4]xfade=transition=fade:duration=0.5:offset=64.5[flow];" +
  "color=c=0x101416:s=1920x1080:d=1.8,format=rgba[ibg];" +
  "[2:v]scale=112:112,format=rgba[ilogo];" +
  "[ibg][ilogo]overlay=x=(W-w)/2:y=300:shortest=1," +
  "drawtext=fontfile='$fontBold':text='ARCADEOPS RELAY':fontcolor=0xF7F5F0:fontsize=64:x=(w-text_w)/2:y=445," +
  "drawtext=fontfile='$fontRegular':text='Mission control for agentic work':fontcolor=0xC9C7C2:fontsize=28:x=(w-text_w)/2:y=535," +
  "drawbox=x=(iw-86)/2:y=592:w=86:h=5:color=0xC98554@1:t=fill," +
  "fade=t=out:st=1.25:d=0.55:alpha=1[intro];" +
  "[flow][intro]overlay=x=0:y=0:eof_action=pass:shortest=0," +
  "$subtitleFilter[v]"

& $Ffmpeg `
  -hide_banner `
  -y `
  -i $capture `
  -i $audio `
  -loop 1 `
  -i $logo `
  -filter_complex $videoFilter `
  -map "[v]" `
  -map "1:a" `
  -t 71.96 `
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

$thumbnailFilter = "[0:v]scale=1280:720[shot];" +
  "[shot]drawbox=x=0:y=0:w=642:h=720:color=0x101416@0.985:t=fill," +
  "drawbox=x=0:y=0:w=9:h=720:color=0xC98554@1:t=fill[base];" +
  "[1:v]scale=92:92[mark];" +
  "[base][mark]overlay=x=54:y=86," +
  "drawtext=fontfile='$fontBold':text='ARCADEOPS':fontcolor=0xF7F5F0:fontsize=54:x=54:y=216," +
  "drawtext=fontfile='$fontBold':text='RELAY':fontcolor=0xF7F5F0:fontsize=54:x=54:y=276," +
  "drawtext=fontfile='$fontRegular':text='Inspect and plan.':fontcolor=0xD8D5CF:fontsize=27:x=54:y=390," +
  "drawtext=fontfile='$fontRegular':text='Delegate and guide.':fontcolor=0xD8D5CF:fontsize=27:x=54:y=435," +
  "drawtext=fontfile='$fontRegular':text='Verify delivery.':fontcolor=0xC98554:fontsize=27:x=54:y=480[thumb]"

& $Ffmpeg `
  -hide_banner `
  -y `
  -ss 65 `
  -i $capture `
  -i $logo `
  -filter_complex $thumbnailFilter `
  -map "[thumb]" `
  -frames:v 1 `
  $thumbnail

if ($LASTEXITCODE -ne 0) { throw "Thumbnail render failed with exit code $LASTEXITCODE" }

Write-Output $finalVideo
Write-Output $thumbnail
