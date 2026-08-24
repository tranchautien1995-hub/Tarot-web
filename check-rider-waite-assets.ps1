$ErrorActionPreference = "Stop"
$map = Import-Csv (Join-Path $PSScriptRoot "docs\rider-waite-file-map.csv")
$folder = Join-Path $PSScriptRoot "public\cards\rider-waite"
$missing = @()
foreach ($item in $map) {
  $path = Join-Path $folder $item.web_filename
  if (-not (Test-Path $path)) { $missing += $item.web_filename }
}
Write-Host "Rider-Waite asset check" -ForegroundColor Cyan
Write-Host "Co: $($map.Count - $missing.Count)/$($map.Count) la"
if ($missing.Count -eq 0) {
  Write-Host "OK: du 78 la." -ForegroundColor Green
} else {
  Write-Host "Thieu $($missing.Count) file:" -ForegroundColor Yellow
  $missing | ForEach-Object { Write-Host " - $_" }
  Write-Host "`nChay .\download-rider-waite.ps1 de tai lai bo anh." -ForegroundColor Yellow
}
