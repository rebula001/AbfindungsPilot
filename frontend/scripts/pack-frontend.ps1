# pack-frontend.ps1
#
# Erstellt ein ZIP des frontend/-Verzeichnisses unter Berücksichtigung von
# .gitignore. Ausgabe landet im Repo-Root als abfindungspilot.zip
# (überschreibt eine vorhandene Datei)
#
# Funktioniert über `git ls-files`:
#   --cached            -> getrackte Dateien
#   --others            -> ungetrackte Dateien
#   --exclude-standard  -> respektiert .gitignore + global excludes
#   !sonar-project.properties -> zusätzlich Token-Datei ausschließen
#                               (doppelte Sicherheit, ist auch in .gitignore)
#
# Aufruf:
#   npm run pack            # vom frontend/-Verzeichnis aus
#   pwsh ./scripts/pack-frontend.ps1
#
# Voraussetzung: git im PATH, Skript muss im frontend/scripts/ liegen.

$ErrorActionPreference = 'Stop'

# Skriptpfad -> Frontend-Root -> Repo-Root auflösen
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendDir = Resolve-Path (Join-Path $ScriptDir '..')
$RepoRoot = Resolve-Path (Join-Path $FrontendDir '..')

$ZipName = 'abfindungspilot.zip'
$ZipPath = Join-Path $RepoRoot $ZipName

Write-Host "» Frontend dir : $FrontendDir"
Write-Host "» Output ZIP   : $ZipPath"
Write-Host ''

# Datei-Liste über git holen - relativ zu frontend/
Push-Location $FrontendDir
try {
  $files = git ls-files --cached --others --exclude-standard `
    ':!:sonar-project.properties'
  if ($LASTEXITCODE -ne 0) {
    throw "git ls-files schlug fehl (exit $LASTEXITCODE)."
  }
  if (-not $files) {
    throw 'Keine Dateien gefunden - läuft das Skript im richtigen Verzeichnis?'
  }
} finally {
  Pop-Location
}

# Vorhandene ZIP überschreiben
if (Test-Path $ZipPath) {
  Remove-Item $ZipPath -Force
}

# Spiegelt die git-getrackten Dateien in einen Tempordner als
#   <temp>/frontend/<original-pfad>
# Das stellt sicher, dass das ZIP "frontend/" als Top-Level-Verzeichnis enthält
# und die komplette Original-Verzeichnisstruktur erhalten bleibt.
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('abfindungspilot-pack-' + [Guid]::NewGuid().ToString('N'))
$stagingDir = Join-Path $tempRoot 'frontend'
$null = New-Item -ItemType Directory -Path $stagingDir -Force

try {
  $copied = 0
  $skipped = 0
  foreach ($rel in $files) {
    $src = Join-Path $FrontendDir $rel
    # Git listet evtl. gelöschte (aber nicht committete) Dateien - überspringen.
    if (-not (Test-Path -LiteralPath $src -PathType Leaf)) {
      $skipped++
      continue
    }

    $dst = Join-Path $stagingDir $rel
    $dstParent = Split-Path -Parent $dst
    if (-not (Test-Path -LiteralPath $dstParent)) {
      $null = New-Item -ItemType Directory -Path $dstParent -Force
    }

    Copy-Item -LiteralPath $src -Destination $dst
    $copied++
  }

  Write-Host "» $copied Dateien gespiegelt ($skipped übersprungen)"
  Write-Host '» ZIP wird erstellt ...'

  # Kompletten frontend/-Ordner als Top-Level packen.
  Compress-Archive -Path $stagingDir -DestinationPath $ZipPath -CompressionLevel Optimal
} finally {
  if (Test-Path -LiteralPath $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force
  }
}

$sizeMB = '{0:N2}' -f ((Get-Item $ZipPath).Length / 1MB)
Write-Host ''
Write-Host "✅ Fertig: $ZipName ($sizeMB MB)" -ForegroundColor Green
