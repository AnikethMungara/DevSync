Set-StrictMode -Version Latest
$root = (git rev-parse --show-toplevel)
Set-Location $root

$changed = git status --porcelain
if ($changed) {
  $today = Get-Date -Format "yyyy-MM-dd"
  $devlog = Join-Path $root "DEVLOG.md"
  $content = Get-Content $devlog -Raw
  if ($content -notmatch [regex]::Escape($today)) {
    Add-Content $devlog "`n## $today`n- "
  }
  git add -A
  git commit -m "chore(devlog): update for $today"
  git push
} else {
  Write-Host "No changes to commit today."
}
