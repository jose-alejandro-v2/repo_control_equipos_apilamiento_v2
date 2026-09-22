<#
.SYNOPSIS
  Descarga una imagen de evidencia desde el backend y la abre en el visor predeterminado.
.DESCRIPTION
  Útil para depuración sin necesidad de la app móvil. Lee el JWT desde token.txt
  (generado con: adb logcat -d ReactNativeJS:E '*:S' | Select-String 'JWT_TOKEN').
.PARAMETER equipoId
  ID del equipo/ingreso (default: 2).
.PARAMETER tipo
  Tipo de evidencia (FRONTAL, POSTERIOR, LATERAL_IZQUIERDO, etc.).
.PARAMETER out
  Ruta de salida del archivo descargado.
#>
param(
  [string]$equipoId = "2",
  [string]$tipo = "FRONTAL",
  [string]$out = ".\evidencia_$tipo.jpg"
)

$tokenPath = "C:\repos\repo_control_equipos_apilamiento_v2\token.txt"
if (!(Test-Path $tokenPath)) {
  Write-Error "token.txt no existe. Abre la app y luego ejecuta: adb logcat -d ReactNativeJS:E '*:S' | Select-String 'JWT_TOKEN' | Select-Object -First 1 | ForEach-Object { ($_.Line -replace '.*JWT_TOKEN:', '').Trim() } > token.txt"
  exit 1
}

$token = Get-Content $tokenPath -Raw | ForEach-Object { $_.Trim() }
$headers = @{ Authorization = "Bearer $token" }

try {
  Invoke-WebRequest -Uri "http://localhost:6111/api/v1/ingresos-equipo/$equipoId/evidencias/$tipo/archivo" -Headers $headers -OutFile $out -UseBasicParsing
  Write-Output "Descargado: $out"
  Invoke-Item $out
} catch {
  Write-Error "Error: $_"
}
