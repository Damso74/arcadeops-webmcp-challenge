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
$introFilter = "drawbox=x=0:y=0:w=iw:h=ih:color=0x111214@1:t=fill:enable='between(t,0,2.2)',drawbox=x=(w-84)/2:y=(h/2)-100:w=84:h=5:color=0x2563eb@1:t=fill:enable='between(t,0,2.2)',drawtext=fontfile='$font':text='ARCADEOPS RELAY':fontcolor=white:fontsize=68:x=(w-text_w)/2:y=(h-text_h)/2-48:enable='between(t,0,2.2)',drawtext=fontfile='$font':text='Delegate. Decide. Verify.':fontcolor=0xd4d4d4:fontsize=30:x=(w-text_w)/2:y=(h-text_h)/2+42:enable='between(t,0,2.2)'"
$outroFilter = "drawbox=x=48:y=48:w=790:h=76:color=0x111214@0.94:t=fill:enable='between(t,103,108)',drawbox=x=48:y=48:w=6:h=76:color=0x2563eb@1:t=fill:enable='between(t,103,108)',drawtext=fontfile='$font':text='HUMANS DECIDE  /  AGENTS EXECUTE  /  EVIDENCE PROVES':fontcolor=white:fontsize=22:x=78:y=77:enable='between(t,103,108)'"
$stageFilter = "drawbox=x=48:y=44:w=380:h=56:color=0x111214@0.94:t=fill:enable='between(t,3,16)',drawbox=x=48:y=44:w=5:h=56:color=0x2563eb@1:t=fill:enable='between(t,3,16)',drawtext=fontfile='$font':text='01  INSPECT PROJECT':fontcolor=white:fontsize=18:x=76:y=63:enable='between(t,3,16)',drawbox=x=48:y=44:w=380:h=56:color=0x111214@0.94:t=fill:enable='between(t,17,30)',drawbox=x=48:y=44:w=5:h=56:color=0x2563eb@1:t=fill:enable='between(t,17,30)',drawtext=fontfile='$font':text='02  DRAFT BOUNDED PLAN':fontcolor=white:fontsize=18:x=76:y=63:enable='between(t,17,30)',drawbox=x=48:y=44:w=380:h=56:color=0x111214@0.94:t=fill:enable='between(t,31,45)',drawbox=x=48:y=44:w=5:h=56:color=0x2563eb@1:t=fill:enable='between(t,31,45)',drawtext=fontfile='$font':text='03  DELEGATE TO WORKER':fontcolor=white:fontsize=18:x=76:y=63:enable='between(t,31,45)',drawbox=x=48:y=44:w=380:h=56:color=0x111214@0.94:t=fill:enable='between(t,46,63)',drawbox=x=48:y=44:w=5:h=56:color=0xf59e0b@1:t=fill:enable='between(t,46,63)',drawtext=fontfile='$font':text='04  HUMAN DECISION':fontcolor=white:fontsize=18:x=76:y=63:enable='between(t,46,63)',drawbox=x=48:y=44:w=380:h=56:color=0x111214@0.94:t=fill:enable='between(t,64,80)',drawbox=x=48:y=44:w=5:h=56:color=0x2563eb@1:t=fill:enable='between(t,64,80)',drawtext=fontfile='$font':text='05  RESUME SAFELY':fontcolor=white:fontsize=18:x=76:y=63:enable='between(t,64,80)',drawbox=x=48:y=44:w=380:h=56:color=0x111214@0.94:t=fill:enable='between(t,81,102)',drawbox=x=48:y=44:w=5:h=56:color=0x22c55e@1:t=fill:enable='between(t,81,102)',drawtext=fontfile='$font':text='06  VERIFY EVIDENCE':fontcolor=white:fontsize=18:x=76:y=63:enable='between(t,81,102)'"
$subtitleFilter = "subtitles='$captions':force_style='FontName=Segoe UI,FontSize=11,PrimaryColour=&H00FFFFFF,OutlineColour=&H70000000,BorderStyle=3,BackColour=&H68000000,Outline=1,Shadow=0,MarginV=26,Alignment=2'"

& $Ffmpeg `
  -hide_banner `
  -y `
  -i $capture `
  -i $audio `
  -filter_complex "[0:v]split=6[v0][v1][v2][v3][v4][v5];[v0]trim=start=0:end=18,setpts=PTS-STARTPTS[s0];[v1]trim=start=18:end=34,setpts=PTS-STARTPTS,crop=1728:972:150:54,scale=1920:1080[s1];[v2]trim=start=34:end=67,setpts=PTS-STARTPTS,crop=1600:900:300:90,scale=1920:1080[s2];[v3]trim=start=67:end=84,setpts=PTS-STARTPTS,crop=1728:972:160:72,scale=1920:1080[s3];[v4]trim=start=84:end=103,setpts=PTS-STARTPTS,crop=1600:900:300:120,scale=1920:1080[s4];[v5]trim=start=103:end=108,setpts=PTS-STARTPTS,crop=1600:900:300:120,scale=1920:1080,tpad=stop_mode=clone:stop_duration=5[s5];[s0][s1][s2][s3][s4][s5]concat=n=6:v=1:a=0,$introFilter,$stageFilter,$outroFilter,$subtitleFilter[v];[1:a]anull[a]" `
  -map "[v]" `
  -map "[a]" `
  -t 108.00 `
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
  -ss 103 `
  -i $capture `
  -frames:v 1 `
  -vf $thumbnailFilter `
  $thumbnail

if ($LASTEXITCODE -ne 0) { throw "Thumbnail render failed with exit code $LASTEXITCODE" }

Write-Output $finalVideo
Write-Output $thumbnail
