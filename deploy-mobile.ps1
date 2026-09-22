<#
.SYNOPSIS
  Despliegue y prueba de la app mobile apilamiento en dispositivo Android.
.DESCRIPTION
  Script interactivo que:
  1. Detecta dispositivos ADB conectados
  2. Permite elegir entre los seriales conocidos
  3. Inicia backend + BD Docker
  4. Inicia Metro bundler (background job)
   5. Configura túneles ADB (6109, 6111)
  6. Instala APK debug
  7. Abre la app
  8. Muestra errores en tiempo real
#>

$ErrorActionPreference = 'Stop'

# ─── Seriales conocidos (AGENTS.md §13.10) ───
$SERIAL_PRINCIPAL = "qctoduvsa6v4cyhi"  # Xiaomi 25100RA69G
$SERIAL_ALTERNO   = "85ijey5tdax8ob5p"  # Xiaomi alterno

# ─── Rutas fijas ───
$MOBILE_DIR   = "$PSScriptRoot\mobile"
$APK_PATH     = "$MOBILE_DIR\android\app\build\outputs\apk\debug\app-debug.apk"
$BACKEND_URL  = "http://localhost:6111/api/v1/auth/roles"

# ─── 1. Detectar dispositivos ───
function Select-Device {
  $devices = adb devices -l | Select-String -Pattern '^(\S+)\s+device\s+' | ForEach-Object {
    $serial = $_.Matches[0].Groups[1].Value
    $model  = if ($_ -match 'model:(\S+)') { $Matches[1] } else { 'desconocido' }
    [PSCustomObject]@{ Serial = $serial; Modelo = $model }
  }

  if (-not $devices) {
    Write-Host "`n[!] Ningún dispositivo ADB conectado." -ForegroundColor Yellow
    Write-Host "    Conecte el celular por USB y acepte la depuración USB.`n"
    exit 1
  }

  # Filtrar solo los conocidos
  $conocidos = $devices | Where-Object { $_.Serial -in @($SERIAL_PRINCIPAL, $SERIAL_ALTERNO) }

  if ($conocidos.Count -eq 1) {
    Write-Host "[i] Dispositivo detectado: $($conocidos[0].Serial) ($($conocidos[0].Modelo))" -ForegroundColor Green
    return $conocidos[0].Serial
  }

  if ($conocidos.Count -ge 2) {
    Write-Host "`nDispositivos conocidos conectados:" -ForegroundColor Cyan
    for ($i = 0; $i -lt $conocidos.Count; $i++) {
      $d = $conocidos[$i]
      Write-Host "  [$i] $($d.Serial)  —  $($d.Modelo)"
    }
    $choice = Read-Host "`nSeleccione [0-$($conocidos.Count-1)]"
    $idx = [int]::TryParse($choice, [ref]$null) ? [int]$choice : -1
    if ($idx -ge 0 -and $idx -lt $conocidos.Count) {
      return $conocidos[$idx].Serial
    }
    Write-Host "[!] Opción inválida. Usando el primero." -ForegroundColor Yellow
    return $conocidos[0].Serial
  }

  # Si hay otros dispositivos pero no los conocidos, mostrar todos
  Write-Host "`nDispositivos conectados (ninguno conocido):" -ForegroundColor Yellow
  for ($i = 0; $i -lt $devices.Count; $i++) {
    $d = $devices[$i]
    Write-Host "  [$i] $($d.Serial)  —  $($d.Modelo)"
  }
  $choice = Read-Host "`nSeleccione [0-$($devices.Count-1)] o Enter para cancelar"
  $idx = [int]::TryParse($choice, [ref]$null) ? [int]$choice : -1
  if ($idx -ge 0 -and $idx -lt $devices.Count) {
    return $devices[$idx].Serial
  }
  exit 0
}

# ─── 2. Iniciar backend ───
function Start-Backend {
  Write-Host "`n[2/7] Iniciando backend + BD Docker..." -ForegroundColor Cyan
  docker compose up -d 2>&1 | Out-Null
  Start-Sleep -Seconds 5

  try {
    $status = (Invoke-WebRequest $BACKEND_URL -UseBasicParsing -TimeoutSec 10).StatusCode
    if ($status -eq 200) {
      Write-Host "  ✓ API backend respondiendo (HTTP $status)" -ForegroundColor Green
    }
  } catch {
    Write-Host "  ✗ API backend no responde. Verifique Docker." -ForegroundColor Red
    exit 1
  }
}

# ─── 3. Iniciar Metro ───
function Start-Metro {
  Write-Host "[3/7] Iniciando Metro bundler..." -ForegroundColor Cyan
  $existing = Get-Job -Name metro -ErrorAction SilentlyContinue
  if ($existing) { $existing | Remove-Job -Force }

  $job = Start-Job -Name metro -ScriptBlock {
    param($dir)
    Set-Location -LiteralPath $dir
    npm run start
  } -ArgumentList $MOBILE_DIR

  Start-Sleep -Seconds 8
  try {
    $status = (Invoke-WebRequest http://localhost:6109/status -UseBasicParsing -TimeoutSec 5).StatusCode
    if ($status -eq 200) {
      Write-Host "  ✓ Metro corriendo en http://localhost:6109" -ForegroundColor Green
    }
  } catch {
    Write-Host "  ✗ Metro no arrancó. Revise la terminal." -ForegroundColor Red
    exit 1
  }
}

# ─── 4. Túneles ADB ───
function Setup-Tunnels {
  param([string]$Serial)
  Write-Host "[4/7] Configurando túneles ADB..." -ForegroundColor Cyan
  adb -s $Serial reverse tcp:6109 tcp:6109 | Out-Null
  adb -s $Serial reverse tcp:6111 tcp:6111 | Out-Null
  $list = adb -s $Serial reverse --list
  Write-Host "  $list" -ForegroundColor Gray
}

# ─── 5. Instalar APK ───
function Install-APK {
  param([string]$Serial)
  Write-Host "[5/7] Instalando APK..." -ForegroundColor Cyan
  if (-not (Test-Path -LiteralPath $APK_PATH)) {
    Write-Host "  ✗ APK no encontrado en: $APK_PATH" -ForegroundColor Red
    Write-Host "    Ejecute 'npm run build:android:local:debug' en mobile/ primero." -ForegroundColor Yellow
    exit 1
  }
  $result = adb -s $Serial install -r $APK_PATH 2>&1
  if ($result -match 'Success') {
    Write-Host "  ✓ APK instalado correctamente" -ForegroundColor Green
  } else {
    Write-Host "  ✗ Error al instalar APK:" -ForegroundColor Red
    Write-Host "    $result"
    exit 1
  }
}

# ─── 6. Abrir app ───
function Open-App {
  param([string]$Serial)
  Write-Host "[6/7] Abriendo aplicación..." -ForegroundColor Cyan
  adb -s $Serial shell am force-stop com.apilamiento.mobile 2>&1 | Out-Null
  Start-Sleep -Seconds 1
  adb -s $Serial shell am start -n com.apilamiento.mobile/.MainActivity 2>&1 | Out-Null
  Write-Host "  ✓ App lanzada" -ForegroundColor Green
}

# ─── 7. Logcat ───
function Show-Logs {
  param([string]$Serial)
  Write-Host "[7/7] Monitoreando errores (Ctrl+C para salir)..." -ForegroundColor Cyan
  Write-Host "  Presione Ctrl+C cuando termine de probar.`n" -ForegroundColor Gray
  Start-Sleep -Seconds 3
  adb -s $Serial logcat ReactNativeJS:E AndroidRuntime:E "*:S"
}

# ════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "   apilamiento — Deploy Mobile" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Magenta

$serial = Select-Device
Write-Host "`nSerial elegido: $serial" -ForegroundColor Green

Start-Backend
Start-Metro
Setup-Tunnels $serial
Install-APK $serial
Open-App $serial
Show-Logs $serial

# Limpieza al salir
Write-Host "`nLimpiando..." -ForegroundColor Gray
Get-Job -Name metro -ErrorAction SilentlyContinue | Stop-Job -PassThru | Remove-Job
