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
$introFilter = "drawbox=x=0:y=0:w=iw:h=ih:color=0x111214@1:t=fill:enable='between(t,0,1.6)',drawbox=x=(w-84)/2:y=(h/2)-100:w=84:h=5:color=0x2563eb@1:t=fill:enable='between(t,0,1.6)',drawtext=fontfile='$font':text='ARCADEOPS RELAY':fontcolor=white:fontsize=68:x=(w-text_w)/2:y=(h-text_h)/2-48:enable='between(t,0,1.6)',drawtext=fontfile='$font':text='Delegate. Decide. Verify.':fontcolor=0xd4d4d4:fontsize=30:x=(w-text_w)/2:y=(h-text_h)/2+42:enable='between(t,0,1.6)'"
$outroFilter = "drawbox=x=48:y=48:w=790:h=76:color=0x111214@0.94:t=fill:enable='between(t,73,76)',drawbox=x=48:y=48:w=6:h=76:color=0x2563eb@1:t=fill:enable='between(t,73,76)',drawtext=fontfile='$font':text='AGENTS EXECUTE  /  HUMANS DECIDE  /  EVIDENCE PROVES':fontcolor=white:fontsize=22:x=78:y=77:enable='between(t,73,76)'"
$stageFilter = "drawbox=x=48:y=44:w=380:h=56:color=0x111214@0.94:t=fill:enable='between(t,11,20)',drawbox=x=48:y=44:w=5:h=56:color=0x2563eb@1:t=fill:enable='between(t,11,20)',drawtext=fontfile='$font':text='01  INSPECT PROJECT':fontcolor=white:fontsize=18:x=76:y=63:enable='between(t,11,20)',drawbox=x=48:y=44:w=380:h=56:color=0x111214@0.94:t=fill:enable='between(t,20,29)',drawbox=x=48:y=44:w=5:h=56:color=0x2563eb@1:t=fill:enable='between(t,20,29)',drawtext=fontfile='$font':text='02  BOUNDED MISSION':fontcolor=white:fontsize=18:x=76:y=63:enable='between(t,20,29)',drawbox=x=48:y=44:w=380:h=56:color=0x111214@0.94:t=fill:enable='between(t,29,39)',drawbox=x=48:y=44:w=5:h=56:color=0x2563eb@1:t=fill:enable='between(t,29,39)',drawtext=fontfile='$font':text='03  DELEGATE TO WORKER':fontcolor=white:fontsize=18:x=76:y=63:enable='between(t,29,39)',drawbox=x=48:y=44:w=380:h=56:color=0x111214@0.94:t=fill:enable='between(t,39,53)',drawbox=x=48:y=44:w=5:h=56:color=0xf59e0b@1:t=fill:enable='between(t,39,53)',drawtext=fontfile='$font':text='04  HUMAN DECISION':fontcolor=white:fontsize=18:x=76:y=63:enable='between(t,39,53)',drawbox=x=48:y=44:w=380:h=56:color=0x111214@0.94:t=fill:enable='between(t,53,62)',drawbox=x=48:y=44:w=5:h=56:color=0x2563eb@1:t=fill:enable='between(t,53,62)',drawtext=fontfile='$font':text='05  RESUME EXACT RUN':fontcolor=white:fontsize=18:x=76:y=63:enable='between(t,53,62)',drawbox=x=48:y=44:w=420:h=56:color=0x111214@0.94:t=fill:enable='between(t,62,73)',drawbox=x=48:y=44:w=5:h=56:color=0x22c55e@1:t=fill:enable='between(t,62,73)',drawtext=fontfile='$font':text='06  EVIDENCE + CERTIFICATE':fontcolor=white:fontsize=18:x=76:y=63:enable='between(t,62,73)'"
$subtitleFilter = "subtitles='$captions':force_style='FontName=Segoe UI,FontSize=11,PrimaryColour=&H00FFFFFF,OutlineColour=&H70000000,BorderStyle=3,BackColour=&H68000000,Outline=1,Shadow=0,MarginV=26,Alignment=2'"

& $Ffmpeg `
  -hide_banner `
  -y `
  -i $capture `
  -i $audio `
  -filter_complex "[0:v]split=7[v0][v1][v2][v3][v4][v5][v6];[v0]trim=start=0:end=11,setpts=PTS-STARTPTS[s0];[v1]trim=start=11:end=20,setpts=PTS-STARTPTS,crop=1728:972:150:54,scale=1920:1080[s1];[v2]trim=start=13:end=22,setpts=PTS-STARTPTS,crop=1600:900:210:70,scale=1920:1080[s2];[v3]trim=start=19:end=29,setpts=PTS-STARTPTS,crop=1728:972:150:54,scale=1920:1080[s3];[v4]trim=start=29:end=43,setpts=PTS-STARTPTS,crop=1600:900:320:80,scale=1920:1080[s4];[v5]trim=start=48:end=57,setpts=PTS-STARTPTS,crop=1728:972:150:54,scale=1920:1080[s5];[v6]trim=start=54:end=65,setpts=PTS-STARTPTS,crop=1600:900:320:80,scale=1920:1080[s6];[s0][s1][s2][s3][s4][s5][s6]concat=n=7:v=1:a=0,tpad=stop_mode=clone:stop_duration=3,trim=duration=76,$introFilter,$stageFilter,$outroFilter,$subtitleFilter[v];[1:a]anull[a]" `
  -map "[v]" `
  -map "[a]" `
  -t 76.00 `
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
  -ss 64 `
  -i $capture `
  -frames:v 1 `
  -vf $thumbnailFilter `
  $thumbnail

if ($LASTEXITCODE -ne 0) { throw "Thumbnail render failed with exit code $LASTEXITCODE" }

Write-Output $finalVideo
Write-Output $thumbnail
