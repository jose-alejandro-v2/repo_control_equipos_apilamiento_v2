<#
.SYNOPSIS
   Configura túneles ADB reverse (6109 Metro + 6111 backend) para TODOS los dispositivos conectados a la vez.
.DESCRIPTION
  Cada dispositivo debug necesita sus propios túneles adb reverse para alcanzar
    Metro (127.0.0.1:6109) y la API (127.0.0.1:6111) desde el PC.
  Este script detecta todos los dispositivos ADB conectados y configura ambos
  túneles en cada uno, permitiendo ejecutar la app en 2 celulares simultáneamente.
.PARAMETER ReloadApp
  Si se especifica, reinicia la app (force-stop + start) en cada dispositivo tras configurar los túneles.
.EXAMPLE
  .\set-adb-tunnels.ps1
.EXAMPLE
  .\set-adb-tunnels.ps1 -ReloadApp
#>
[CmdletBinding()]
param(
  [switch]$ReloadApp
)

$ErrorActionPreference = 'Stop'

# ─── 1. Detectar dispositivos ───
function Get-AdbDevices {
  $devices = adb devices -l | Select-String -Pattern '^(\S+)\s+device\s+' | ForEach-Object {
    $serial = $_.Matches[0].Groups[1].Value
    $model  = if ($_ -match 'model:(\S+)') { $Matches[1] } else { 'desconocido' }
    [PSCustomObject]@{ Serial = $serial; Modelo = $model }
  }
  return $devices
}

# ─── 2. Configurar túneles en un dispositivo ───
function Set-Tunnels {
  param([string]$Serial)
  adb -s $Serial reverse tcp:6109 tcp:6109 | Out-Null
  adb -s $Serial reverse tcp:6111 tcp:6111 | Out-Null
  $list = adb -s $Serial reverse --list
  return ($list -join "`n")
}

# ─── 3. Verificar túneles en un dispositivo ───
function Test-Tunnels {
  param([string]$Serial)
  $ok6109 = adb -s $Serial shell "toybox nc -z -w 3 127.0.0.1 6109; echo exit:`$?" 2>$null | Select-String -Pattern 'exit:0'
  $ok6111 = adb -s $Serial shell "toybox nc -z -w 3 127.0.0.1 6111; echo exit:`$?" 2>$null | Select-String -Pattern 'exit:0'
  return [bool]($ok6109 -and $ok6111)
}

# ════════════════════════════════════════════════════════════
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "   apilamiento — Túneles ADB multi-dispositivo" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Magenta

$devices = @(Get-AdbDevices)

if ($devices.Count -eq 0) {
  Write-Host "`n[!] Ningún dispositivo ADB conectado." -ForegroundColor Yellow
  Write-Host "    Conecte los celulares por USB o depuración inalámbrica y reintente.`n"
  exit 1
}

Write-Host "`nDispositivos conectados: $($devices.Count)" -ForegroundColor Cyan
foreach ($d in $devices) {
  Write-Host "  - $($d.Serial)  ($($d.Modelo))"
}

Write-Host ""
foreach ($d in $devices) {
  Write-Host "  → Configurando túneles en $($d.Serial)..." -ForegroundColor Cyan
  $tunnels = Set-Tunnels -Serial $d.Serial
  if ($tunnels -match '6109' -and $tunnels -match '6111') {
    Write-Host "    ✓ tcp:6109 (Metro) + tcp:6111 (API) OK" -ForegroundColor Green
  } else {
    Write-Host "    ✗ No se registraron los túneles esperados:" -ForegroundColor Red
    Write-Host "      $tunnels"
  }
}

# ─── Verificación de conectividad ───
Write-Host ""
Write-Host "  → Verificando alcance de Metro y API..." -ForegroundColor Cyan
$allOk = $true
foreach ($d in $devices) {
  if (Test-Tunnels -Serial $d.Serial) {
    Write-Host "    ✓ $($d.Serial) alcanza 127.0.0.1:6109 y 127.0.0.1:6111" -ForegroundColor Green
  } else {
    Write-Host "    ✗ $($d.Serial) no alcanza los puertos. ¿Metro/backend corriendo?" -ForegroundColor Yellow
    $allOk = $false
  }
}

# ─── Reiniciar app (opcional) ───
if ($ReloadApp) {
  Write-Host ""
  Write-Host "  → Reiniciando la app en cada dispositivo..." -ForegroundColor Cyan
  foreach ($d in $devices) {
    adb -s $d.Serial shell am force-stop com.apilamiento.mobile 2>$null | Out-Null
    Start-Sleep -Milliseconds 500
    adb -s $d.Serial shell am start -n com.apilamiento.mobile/.MainActivity 2>$null | Out-Null
    Write-Host "    ✓ App reiniciada en $($d.Serial)" -ForegroundColor Green
  }
}

Write-Host "`nListo. Los $($devices.Count) dispositivos pueden ejecutar la app en paralelo.`n" -ForegroundColor Green
if (-not $allOk) {
  Write-Host "Nota: Verifique que Metro (6109) y el backend (6111) estén corriendo en el PC." -ForegroundColor Yellow
}
