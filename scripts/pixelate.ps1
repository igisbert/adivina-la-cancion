$root = Split-Path -Parent $PSScriptRoot
$artDir = Join-Path $root "public\art"
$pixelatedDir = Join-Path $artDir "pixelated"

if (-not (Test-Path $pixelatedDir)) {
  New-Item -ItemType Directory -Path $pixelatedDir -Force | Out-Null
}

$images = Get-ChildItem -Path $artDir -Filter "*.webp" -File

foreach ($img in $images) {
  $outPath = Join-Path $pixelatedDir $img.Name
  Write-Host "⚡ $($img.Name)"
  ffmpeg -y -i $img.FullName -vf "scale=6:6:flags=neighbor,scale=600:600:flags=neighbor" -q:v 80 $outPath 2>$null
}

Write-Host "`n✅ Pixelated $($images.Count) images"
