<#
.SYNOPSIS
  Sestaví Quartz web a připraví balíček pro nahrání na FTP (MONSTA / FileZilla).

.DESCRIPTION
  1) npm ci ve site (volitelně -Install)
  2) quartz build -> site/public
  3) zkopíruje apache-quartz.htaccess do site/public/.htaccess
  4) Vytvoří site/public_ftp jako kopii public a (výchozí chování) přemapuje cesty
     na strukturu jako na serveru /data/rsd_web:
       03_Oblasti-správy-informací -> 02_Oblasti-správy-informací
       07_Sprava_obsahu            -> 06_Sprava_obsahu
     Textové soubory (html, js, json, …) se upraví stejně, aby odkazy seděly.
  5) Zkopíruje MONSTA-JAK-NAHRAT.txt do kořene public_ftp.
  6) Zabalí public_ftp do RSD_Plzen_upload.zip v kořeni knowledge_base.

  Pro ruční nahrání: použijte obsah site/public_ftp nebo rozbalený zip — nahrajte
  do /data/rsd_web a nechte přepsat existující soubory.

.PARAMETER Install
  Spustí npm ci ve složce site před buildem.

.PARAMETER SkipZip
  Vytvoří site/public_ftp, ale nevytvoří RSD_Plzen_upload.zip.

.PARAMETER NoLegacyRemap
  Nepřemapovává 03->02 a 07->06; public_ftp je jen kopií public (např. pro jiný cíl než rsd_web).
#>
[CmdletBinding()]
param(
  [switch] $Install,
  [switch] $SkipZip,
  [switch] $NoLegacyRemap
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$SiteDir = Join-Path $RepoRoot 'site'
$PublicDir = Join-Path $SiteDir 'public'
$PublicFtpDir = Join-Path $SiteDir 'public_ftp'
$HtaccessSrc = Join-Path $ScriptDir 'apache-quartz.htaccess'
$MonstaReadmeSrc = Join-Path $ScriptDir 'MONSTA-JAK-NAHRAT.txt'
$ZipOut = Join-Path $RepoRoot 'RSD_Plzen_upload.zip'

function Copy-PublicToFtpFolder {
  param([string] $Source, [string] $Dest)
  if (Test-Path -LiteralPath $Dest) {
    Remove-Item -LiteralPath $Dest -Recurse -Force
  }
  New-Item -ItemType Directory -Path $Dest -Force | Out-Null
  Get-ChildItem -LiteralPath $Source -Force | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $Dest -Recurse -Force
  }
}

function Invoke-LegacyPathRemap {
  param([string] $Root)
  $newOblasti = '02_Oblasti-správy-informací'
  $newSprava = '06_Sprava_obsahu'

  $textExt = @(
    '.html', '.js', '.json', '.css', '.xml', '.txt', '.map',
    '.webmanifest', '.canvas', '.svg', '.mjs', '.xsl'
  )

  $dir03 = Get-ChildItem -LiteralPath $Root -Directory -Force |
    Where-Object { $_.Name -match '^03_Oblasti' } |
    Select-Object -First 1
  $oldOblasti = if ($dir03) { $dir03.Name } else { '03_Oblasti-správy-informací' }

  Get-ChildItem -LiteralPath $Root -Recurse -File -Force | ForEach-Object {
    $ext = $_.Extension.ToLowerInvariant()
    if ($textExt -notcontains $ext) { return }
    $c = [System.IO.File]::ReadAllText($_.FullName, [System.Text.UTF8Encoding]::new($false))
    $n = $c.Replace($oldOblasti, $newOblasti).Replace('07_Sprava_obsahu', $newSprava)
    if ($n -ne $c) {
      [System.IO.File]::WriteAllText($_.FullName, $n, [System.Text.UTF8Encoding]::new($false))
    }
  }

  $p02 = Join-Path $Root $newOblasti
  if ($dir03) {
    if ((Test-Path -LiteralPath $p02)) {
      Write-Error "Nelze přejmenovat oblasti: už existuje $p02"
    }
    Rename-Item -LiteralPath $dir03.FullName -NewName $newOblasti
  }

  $p07 = Join-Path $Root '07_Sprava_obsahu'
  $p06 = Join-Path $Root $newSprava
  if ((Test-Path -LiteralPath $p07)) {
    if ((Test-Path -LiteralPath $p06)) {
      Write-Error "Nelze přejmenovat správu obsahu: už existuje $p06"
    }
    Rename-Item -LiteralPath $p07 -NewName $newSprava
  }
}

if (-not (Test-Path -LiteralPath $SiteDir)) {
  Write-Error "Složka site nenalezena: $SiteDir"
}

Push-Location -LiteralPath $SiteDir
try {
  if ($Install) {
    Write-Host '>> npm ci'
    npm ci
  }

  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error 'Node.js není v PATH (potřeba verze 22+).'
  }

  Write-Host '>> quartz build'
  node ./quartz/bootstrap-cli.mjs build -d ..
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Quartz build skončil s kódem $LASTEXITCODE (zavřete náhledy souborů ve složce site\public a zkuste znovu)."
  }

  if (-not (Test-Path -LiteralPath $HtaccessSrc)) {
    Write-Error "Chybí soubor: $HtaccessSrc"
  }
  Copy-Item -LiteralPath $HtaccessSrc -Destination (Join-Path $PublicDir '.htaccess') -Force
  Write-Host ">> .htaccess -> $PublicDir"

  Write-Host '>> příprava site/public_ftp (kopie pro nahrání na FTP)'
  Copy-PublicToFtpFolder -Source $PublicDir -Dest $PublicFtpDir

  if (-not $NoLegacyRemap) {
    Write-Host '>> přemapování cest na strukturu /data/rsd_web (02_Oblasti…, 06_Sprava_obsahu)'
    Invoke-LegacyPathRemap -Root $PublicFtpDir
  }

  if (Test-Path -LiteralPath $MonstaReadmeSrc) {
    Copy-Item -LiteralPath $MonstaReadmeSrc -Destination (Join-Path $PublicFtpDir 'MONSTA-JAK-NAHRAT.txt') -Force
  }
}
finally {
  Pop-Location
}

if (-not $SkipZip) {
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  if (Test-Path -LiteralPath $ZipOut) {
    Remove-Item -LiteralPath $ZipOut -Force
  }
  Write-Host ">> zip -> $ZipOut"
  [System.IO.Compression.ZipFile]::CreateFromDirectory(
    $PublicFtpDir,
    $ZipOut,
    [System.IO.Compression.CompressionLevel]::Optimal,
    $false
  )
  $len = (Get-Item -LiteralPath $ZipOut).Length
  Write-Host "Hotovo. Zip: $([math]::Round($len / 1MB, 2)) MB"
} else {
  Write-Host 'Hotovo (bez zipu).'
}

Write-Host ''
Write-Host 'Nahrání: složka site\public_ftp  nebo  rozbalený RSD_Plzen_upload.zip'
Write-Host 'Cíl na serveru: /data/rsd_web  — vyberte vše z kořene balíčku a nechte přepsat existující soubory.'
Write-Host 'Návod: site\public_ftp\MONSTA-JAK-NAHRAT.txt'
