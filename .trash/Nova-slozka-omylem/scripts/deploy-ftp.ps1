<#
.SYNOPSIS
  Sestaví web a odešle site/public na FTP přes lftp (stejné chování jako GitHub Actions).

.DESCRIPTION
  Vyžaduje nainstalované lftp (např. WSL: sudo apt install lftp, nebo balíček pro Windows).

  Nastavte proměnné prostředí před spuštěním:
    FTP_USER, FTP_PASS, FTP_HOST, FTP_PORT
  Volitelně:
    FTP_DEST  (výchozí RSD_Plzen)

.EXAMPLE
  $env:FTP_USER='...'; $env:FTP_PASS='...'; $env:FTP_HOST='...'; $env:FTP_PORT='21'
  .\scripts\deploy-ftp.ps1
#>
[CmdletBinding()]
param(
  [switch] $SkipPack,
  [string] $Dest = $(if ($env:FTP_DEST) { $env:FTP_DEST } else { 'RSD_Plzen' })
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$PackScript = Join-Path $ScriptDir 'pack-for-ftp.ps1'
$PublicDir = Join-Path $RepoRoot 'site\public_ftp'

$required = @('FTP_USER', 'FTP_PASS', 'FTP_HOST', 'FTP_PORT')
foreach ($name in $required) {
  $v = [Environment]::GetEnvironmentVariable($name, 'Process')
  if ([string]::IsNullOrWhiteSpace($v)) {
    Write-Error "Nastavte proměnnou prostředí $name (např. `$env:$name='...'`)."
  }
}

$user = [Environment]::GetEnvironmentVariable('FTP_USER', 'Process')
$pass = [Environment]::GetEnvironmentVariable('FTP_PASS', 'Process')
$hostName = [Environment]::GetEnvironmentVariable('FTP_HOST', 'Process')
$port = [Environment]::GetEnvironmentVariable('FTP_PORT', 'Process')

$lftp = Get-Command lftp -ErrorAction SilentlyContinue
if (-not $lftp) {
  Write-Error @"
lftp nebyl nalezen v PATH.
  • Nasaďte web ručně: spusťte .\scripts\pack-for-ftp.ps1 a nahrajte obsah site/public přes FileZilla.
  • Nebo nainstalujte lftp (WSL / balíček) a spusťte tento skript znovu.
"@
}

if (-not $SkipPack) {
  & $PackScript -SkipZip
}

if (-not (Test-Path -LiteralPath $PublicDir)) {
  Write-Error "Chybí site\public_ftp — nejdřív spusťte pack-for-ftp.ps1 (vytvoří přemapovaný obsah pro FTP)."
}

$htaccess = Join-Path $PublicDir '.htaccess'
if (-not (Test-Path -LiteralPath $htaccess)) {
  Write-Error "Chybí $htaccess — spusťte nejdřív pack-for-ftp.ps1"
}

$uri = "ftp://${hostName}:${port}"
Write-Host ">> lftp mirror -> $Dest"

$commands = @(
  'set ftp:passive-mode yes'
  'set ftp:ssl-allow no'
  'set cmd:fail-exit yes'
  'set net:timeout 20'
  'set net:max-retries 1'
  'set net:reconnect-interval-base 5'
  "mkdir -p `"$Dest`""
  "mirror -R --delete --verbose --exclude-glob `".htaccess`" `"$PublicDir/`" `"$Dest/`""
  "put -O `"$Dest`" `"$htaccess`""
  'quit'
) -join "`n"

$passFile = [System.IO.Path]::GetTempFileName()
try {
  [System.IO.File]::WriteAllText($passFile, $commands, [System.Text.UTF8Encoding]::new($false))
  & lftp -u "$user","$pass" $uri -f $passFile
}
finally {
  Remove-Item -LiteralPath $passFile -Force -ErrorAction SilentlyContinue
}

Write-Host 'Hotovo.'
