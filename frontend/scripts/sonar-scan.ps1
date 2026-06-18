# sonar-scan.ps1 - One-shot SonarQube scan + report fetcher
# ------------------------------------------------------------
# 1. Reads config from frontend/sonar-project.properties
# 2. Runs sonar-scanner (uses sonar.token, sqp_...)
# 3. Waits for the CE task to finish (/api/ce/task)
# 4. Pulls Quality Gate, Metrics (New + Overall),
#    Issues (file-grouped), Duplications detail (Web API)
# 5. Writes single JSON to frontend/.sonarqube-report/sonar-report.json
#
# Usage (from any cwd):
#   pwsh -File frontend/scripts/sonar-scan.ps1           # scan + report
#   pwsh -File frontend/scripts/sonar-scan.ps1 -SkipScan # report only

[CmdletBinding()]
param(
  [switch]$SkipScan
)

$ErrorActionPreference = 'Stop'

# Paths
$scriptDir = $PSScriptRoot
$frontendDir = Split-Path -Parent $scriptDir
$propsPath = Join-Path $frontendDir 'sonar-project.properties'
$reportDir = Join-Path $frontendDir '.sonarqube-report'

if (-not (Test-Path $propsPath)) {
  Write-Host "sonar-project.properties not found at $propsPath" -ForegroundColor Red
  exit 2
}

# Parse sonar-project.properties (key=value, ignore # comments)
$props = @{}
Get-Content $propsPath | ForEach-Object {
  $line = $_.Trim()
  if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
    $k, $v = $line -split '=', 2
    $props[$k.Trim()] = $v.Trim()
  }
}

$projectKey = $props['sonar.projectKey']
$projectName = if ($props.ContainsKey('sonar.projectName')) { $props['sonar.projectName'] } else { $projectKey }
$hostUrl = ($props['sonar.host.url']).TrimEnd('/')
$scanToken = $props['sonar.token']
$reportToken = if ($props.ContainsKey('sonar.report.token') -and $props['sonar.report.token']) {
  $props['sonar.report.token']
} else {
  $scanToken
}

if (-not $projectKey -or -not $hostUrl -or -not $reportToken) {
  Write-Host 'Missing sonar.projectKey / sonar.host.url / sonar.token in properties.' -ForegroundColor Red
  exit 2
}

# Branch (best effort via git)
$branch = 'main'
try {
  Push-Location $frontendDir
  $b = (& git rev-parse --abbrev-ref HEAD 2>$null)
  if ($LASTEXITCODE -eq 0 -and $b) { $branch = $b.Trim() }
} catch {} finally { Pop-Location }

$apiHeaders = @{ Authorization = "Bearer $reportToken" }
$componentPrefix = "$projectKey:"

Write-Host "Project : $projectKey ($projectName)" -ForegroundColor Gray
Write-Host "Host    : $hostUrl" -ForegroundColor Gray
Write-Host "Branch  : $branch" -ForegroundColor Gray

# ============================================================
# STEP 1 - Run scanner (unless -SkipScan)
# ============================================================
$ceTaskId = $null
if (-not $SkipScan) {
  Write-Host ''
  Write-Host 'Running sonar-scanner...' -ForegroundColor Cyan
  Push-Location $frontendDir
  try {
    & sonar
    if ($LASTEXITCODE -ne 0) {
      Write-Host "sonar-scanner failed (exit $LASTEXITCODE)" -ForegroundColor Red
      exit 1
    }
  } finally { Pop-Location }

  # Find report-task.txt (sonar-scanner-npm writes it under .scannerwork/)
  $candidates = @(
    (Join-Path $frontendDir '.scannerwork\report-task.txt'),
    (Join-Path $frontendDir 'node_modules\sonar-scanner\.scannerwork\report-task.txt')
  )
  $reportTaskPath = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if (-not $reportTaskPath) {
    $reportTaskPath = Get-ChildItem -Path $frontendDir -Filter report-task.txt -Recurse -ErrorAction SilentlyContinue |
      Select-Object -First 1 -ExpandProperty FullName
  }
  if ($reportTaskPath -and (Test-Path $reportTaskPath)) {
    $ceTaskId = (Get-Content $reportTaskPath | Where-Object { $_ -match '^ceTaskId=' }) -replace '^ceTaskId=', ''
    Write-Host "CE task id: $ceTaskId" -ForegroundColor Gray
  } else {
    Write-Host 'Warning: report-task.txt not found; will poll latest task.' -ForegroundColor Yellow
  }
}

# ============================================================
# STEP 2 - Wait for CE task to finish
# ============================================================
if (-not $SkipScan) {
  Write-Host 'Waiting for SonarQube to process the report...' -ForegroundColor Cyan
  $maxWait = 180
  $waited = 0
  $taskStatus = 'PENDING'
  do {
    Start-Sleep -Seconds 3
    $waited += 3
    try {
      if ($ceTaskId) {
        $r = Invoke-RestMethod -Uri ("$hostUrl/api/ce/task?id=$ceTaskId") -Headers $apiHeaders -ErrorAction Stop
        if ($r.task) { $taskStatus = $r.task.status }
      } else {
        $r = Invoke-RestMethod -Uri ("$hostUrl/api/ce/activity?component=$projectKey&ps=1") -Headers $apiHeaders -ErrorAction Stop
        $last = $r.tasks | Select-Object -First 1
        if ($last) { $taskStatus = $last.status }
      }
    } catch { $taskStatus = 'PENDING' }
  } while (($taskStatus -in @('PENDING', 'IN_PROGRESS')) -and $waited -lt $maxWait)

  $color = if ($taskStatus -eq 'SUCCESS') { 'Green' } else { 'Yellow' }
  Write-Host "CE task: $taskStatus ($waited s)" -ForegroundColor $color
  if ($taskStatus -ne 'SUCCESS') {
    Write-Host 'Continuing with stale data...' -ForegroundColor Yellow
  }
}

# ============================================================
# STEP 3 - Prepare report dir
# ============================================================
if (-not (Test-Path $reportDir)) {
  New-Item -ItemType Directory -Path $reportDir | Out-Null
} else {
  Get-ChildItem $reportDir -Filter '*.json' -ErrorAction SilentlyContinue | Remove-Item -Force
}

# ============================================================
# Helpers
# ============================================================
function Get-AllIssues([string]$extraParams) {
  $page = 1
  $pageSize = 500
  $all = @()
  $total = 0
  do {
    $url = "$script:hostUrl/api/issues/search?componentKeys=$script:projectKey&branch=$script:branch&resolved=false&ps=$pageSize&p=$page&s=SEVERITY&asc=false$extraParams"
    $resp = Invoke-RestMethod -Uri $url -Headers $script:apiHeaders
    if ($resp.issues) { $all += $resp.issues }
    $total = [int]$resp.total
    $page++
  } while ($all.Count -lt $total -and $page -le 20)
  return @{ issues = $all; total = $total }
}

function Format-Issues([object[]]$rawIssues) {
  $byFile = [ordered]@{}
  $byRule = @{}
  $byType = @{}
  $bySeverity = @{}

  foreach ($i in $rawIssues) {
    $file = $i.component -replace [regex]::Escape($script:componentPrefix), ''
    $entry = [ordered]@{
      rule = $i.rule
      severity = $i.severity
      type = $i.type
      line = $i.line
      endLine = if ($i.textRange) { $i.textRange.endLine } else { $null }
      message = $i.message
      effort = $i.effort
      tags = $i.tags
    }
    if (-not $byFile.Contains($file)) { $byFile[$file] = @() }
    $byFile[$file] += $entry

    if ($byRule.ContainsKey($i.rule)) { $byRule[$i.rule]++ } else { $byRule[$i.rule] = 1 }
    if ($byType.ContainsKey($i.type)) { $byType[$i.type]++ } else { $byType[$i.type] = 1 }
    if ($bySeverity.ContainsKey($i.severity)) { $bySeverity[$i.severity]++ } else { $bySeverity[$i.severity] = 1 }
  }

  $sortedByFile = [ordered]@{}
  foreach ($kv in $byFile.GetEnumerator()) {
    $sortedByFile[$kv.Key] = @($kv.Value | Sort-Object { $_.line })
  }
  $sortedRules = [ordered]@{}
  $byRule.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { $sortedRules[$_.Key] = $_.Value }

  return [ordered]@{
    total = $rawIssues.Count
    bySeverity = $bySeverity
    byType = $byType
    byRule = $sortedRules
    fileCount = $byFile.Count
    byFile = $sortedByFile
  }
}

function Get-Rating([string]$val) {
  if ([string]::IsNullOrEmpty($val)) { return 'N/A' }
  switch ([math]::Floor([double]$val)) {
    1 { 'A' }
    2 { 'B' }
    3 { 'C' }
    4 { 'D' }
    5 { 'E' }
    default { $val }
  }
}

# ============================================================
# STEP 4 - Quality Gate
# ============================================================
Write-Host ''
Write-Host 'Fetching quality gate...' -ForegroundColor Cyan
$qgUrl = "$hostUrl/api/qualitygates/project_status?projectKey=$projectKey&branch=$branch"
$qualityGate = Invoke-RestMethod -Uri $qgUrl -Headers $apiHeaders
$qgStatus = $qualityGate.projectStatus.status
$qgConditions = @(
  $qualityGate.projectStatus.conditions | ForEach-Object {
    [ordered]@{
      metric = $_.metricKey
      status = $_.status
      actual = $_.actualValue
      threshold = $_.errorThreshold
      comparator = $_.comparator
    }
  }
)

# ============================================================
# STEP 5 - Metrics (New + Overall)
# ============================================================
Write-Host 'Fetching metrics...' -ForegroundColor Cyan
$overallMetricKeys = 'bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density,duplicated_blocks,duplicated_lines,ncloc,security_hotspots,reliability_rating,security_rating,sqale_rating'
$newCodeMetricKeys = 'new_bugs,new_vulnerabilities,new_code_smells,new_coverage,new_duplicated_lines_density,new_duplicated_lines,new_security_hotspots,new_reliability_rating,new_security_rating,new_maintainability_rating'
$allMetricKeys = "$overallMetricKeys,$newCodeMetricKeys"

$metricsUrl = "$hostUrl/api/measures/component?component=$projectKey&branch=$branch&metricKeys=$allMetricKeys"
$metricsResp = Invoke-RestMethod -Uri $metricsUrl -Headers $apiHeaders
$metricsMap = [ordered]@{}
$metricsResp.component.measures | ForEach-Object {
  $val = if ($_.PSObject.Properties['period']) { $_.period.value } else { $_.value }
  $metricsMap[$_.metric] = $val
}

# ============================================================
# STEP 6 - Issues (New + Overall)
# ============================================================
Write-Host 'Fetching New Code issues...' -ForegroundColor Cyan
$newCodeResult = Get-AllIssues '&inNewCodePeriod=true'
$newCodeFormatted = Format-Issues $newCodeResult.issues
Write-Host "New Code: $($newCodeResult.total) issues in $($newCodeFormatted.fileCount) files" -ForegroundColor Yellow

Write-Host 'Fetching Overall issues...' -ForegroundColor Cyan
$overallResult = Get-AllIssues ''
$overallFormatted = Format-Issues $overallResult.issues
Write-Host "Overall : $($overallResult.total) issues in $($overallFormatted.fileCount) files" -ForegroundColor Yellow

# ============================================================
# STEP 7 - Duplications
# ============================================================
Write-Host 'Fetching duplications...' -ForegroundColor Cyan
$allDuplications = @()
try {
  $dupTreeUrl = "$hostUrl/api/measures/component_tree?component=$projectKey&branch=$branch" +
    '&metricKeys=duplicated_lines_density,duplicated_blocks,duplicated_lines&ps=500&qualifiers=FIL' +
    '&s=metric&metricSort=duplicated_lines_density&asc=false'
  $tree = Invoke-RestMethod -Uri $dupTreeUrl -Headers $apiHeaders -ErrorAction Stop

  $filesWithDups = @(
    $tree.components | Where-Object {
      $_.measures | Where-Object { $_.metric -eq 'duplicated_blocks' -and [double]$_.value -gt 0 }
    }
  )

  foreach ($file in $filesWithDups) {
    $filePath = $file.key -replace [regex]::Escape($componentPrefix), ''
    $dupShowUrl = "$hostUrl/api/duplications/show?key=$([uri]::EscapeDataString($file.key))&branch=$branch"
    try {
      $detail = Invoke-RestMethod -Uri $dupShowUrl -Headers $apiHeaders -ErrorAction Stop
    } catch { continue }
    if (-not $detail -or -not $detail.duplications -or $detail.duplications.Count -eq 0) { continue }

    # Build a key->file lookup so block.refs (e.g. "1","2") can be resolved
    $refMap = @{}
    if ($detail.files) {
      foreach ($fProp in $detail.files.PSObject.Properties) {
        $refMap[$fProp.Name] = $fProp.Value
      }
    }

    foreach ($dup in $detail.duplications) {
      $blocks = @(
        $dup.blocks | ForEach-Object {
          $refKey = "$($_.ref)"
          $refFile = if ($refMap.ContainsKey($refKey)) {
            ($refMap[$refKey].key -replace [regex]::Escape($componentPrefix), '')
          } else { $filePath }
          [ordered]@{
            file = $refFile
            from = $_.from
            to = ($_.from + $_.size - 1)
            size = $_.size
          }
        }
      )
      $allDuplications += [ordered]@{ sourceFile = $filePath; blocks = $blocks }
    }

    Write-Host "  $($detail.duplications.Count) block(s) in: $filePath" -ForegroundColor Yellow
  }

  if ($filesWithDups.Count -eq 0) {
    Write-Host '  No duplications found' -ForegroundColor Green
  }
} catch {
  Write-Host "Duplication API unavailable: $($_.Exception.Message)" -ForegroundColor Yellow
  Write-Host "  (This usually means the user/token lacks 'Browse' permission on the project.)" -ForegroundColor DarkGray
}

# ============================================================
# STEP 8 - Assemble & save
# ============================================================
$report = [ordered]@{
  generatedAt = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssK')
  project = $projectKey
  projectName = $projectName
  branch = $branch
  dashboard = "$hostUrl/dashboard?id=$projectKey&branch=$branch"
  qualityGate = [ordered]@{
    status = $qgStatus
    conditions = $qgConditions
  }
  metrics = $metricsMap
  newCode = $newCodeFormatted
  overallCode = $overallFormatted
}

if ($allDuplications.Count -gt 0) {
  $report['duplications'] = $allDuplications
}

$reportPath = Join-Path $reportDir 'sonar-report.json'
$report | ConvertTo-Json -Depth 12 | Set-Content -Path $reportPath -Encoding UTF8

# ============================================================
# STEP 9 - Console summary
# ============================================================
Write-Host ''
Write-Host '========================================' -ForegroundColor Green
Write-Host '         SonarQube Report Summary       ' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Green

$qgColor = if ($qgStatus -eq 'OK') { 'Green' } else { 'Red' }
Write-Host "Quality Gate: $qgStatus" -ForegroundColor $qgColor
$qgConditions | Where-Object { $_.status -ne 'OK' } | ForEach-Object {
  Write-Host "  FAILED: $($_.metric) = $($_.actual) (threshold: $($_.comparator) $($_.threshold))" -ForegroundColor Red
}

function Write-Section($title, $f, $bugs, $vulns, $smells, $hotspots, $cov, $dup, $r, $s, $m, $loc) {
  Write-Host ''
  Write-Host "--- $title ---" -ForegroundColor Cyan
  Write-Host "Issues:            $($f.total) ($bugs bugs, $vulns vulnerabilities, $smells code smells)" -ForegroundColor White
  Write-Host "Security Hotspots: $hotspots" -ForegroundColor White
  Write-Host "Coverage:          $cov" -ForegroundColor White
  Write-Host "Duplications:      $dup" -ForegroundColor White
  Write-Host "Reliability: $r | Security: $s | Maintainability: $m" -ForegroundColor White
  if ($loc) { Write-Host "Lines of Code:     $loc" -ForegroundColor White }
  if ($f.total -gt 0) {
    $sev = ($f.bySeverity.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { "$($_.Key):$($_.Value)" }) -join ', '
    Write-Host "Severity:          $sev" -ForegroundColor Gray
    Write-Host "Files affected:    $($f.fileCount)" -ForegroundColor Gray
  }
}

function Get-Or($map, $key, $default = '0', $suffix = '') {
  if ($map[$key]) { return "$($map[$key])$suffix" } else { return $default }
}

Write-Section 'New Code (compared to main)' $newCodeFormatted `
  (Get-Or $metricsMap 'new_bugs') (Get-Or $metricsMap 'new_vulnerabilities') `
  (Get-Or $metricsMap 'new_code_smells') (Get-Or $metricsMap 'new_security_hotspots') `
  (Get-Or $metricsMap 'new_coverage' 'N/A' '%') (Get-Or $metricsMap 'new_duplicated_lines_density' 'N/A' '%') `
  (Get-Rating $metricsMap['new_reliability_rating']) (Get-Rating $metricsMap['new_security_rating']) `
  (Get-Rating $metricsMap['new_maintainability_rating']) $null

$dupBlocks = if ($allDuplications.Count -gt 0) { " - ($($allDuplications.Count) block(s))" } else { '' }
$ovDup = (Get-Or $metricsMap 'duplicated_lines_density' 'N/A' '%') + $dupBlocks
Write-Section 'Overall Code' $overallFormatted `
  (Get-Or $metricsMap 'bugs') (Get-Or $metricsMap 'vulnerabilities') `
  (Get-Or $metricsMap 'code_smells') (Get-Or $metricsMap 'security_hotspots') `
  (Get-Or $metricsMap 'coverage' 'N/A' '%') $ovDup `
  (Get-Rating $metricsMap['reliability_rating']) (Get-Rating $metricsMap['security_rating']) `
  (Get-Rating $metricsMap['sqale_rating']) (Get-Or $metricsMap 'ncloc' 'N/A')

Write-Host ''
Write-Host "Saved:     $reportPath" -ForegroundColor Green
Write-Host "Dashboard: $hostUrl/dashboard?id=$projectKey&branch=$branch" -ForegroundColor Green

if ($qgStatus -ne 'OK') { exit 1 }
exit 0
