#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# SCRIPT DE DESPLIEGUE — Servidor .24
# Ejecutar como root o con sudo en el servidor .24
# Uso: sudo bash deploy.sh
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# ---- Configuración ----
APP_NAME="control-equipos"
APP_DIR="/opt/$APP_NAME"
APP_USER="controlapp"
JAR_NAME="control-equipos-backend-1.0.0-SNAPSHOT-runner.jar"
SERVICE_NAME="$APP_NAME.service"

echo "=========================================="
echo " DESPLIEGUE: $APP_NAME"
echo "=========================================="

# ---- 1. Crear usuario del servicio ----
echo ""
echo "[1/7] Creando usuario del servicio..."
if ! id "$APP_USER" &>/dev/null; then
    sudo useradd --system --home "$APP_DIR" --shell /usr/sbin/nologin "$APP_USER"
    echo "   Usuario $APP_USER creado."
else
    echo "   Usuario $APP_USER ya existe."
fi

# ---- 2. Crear estructura de carpetas ----
echo ""
echo "[2/7] Creando estructura de carpetas..."
sudo mkdir -p "$APP_DIR/app"
sudo mkdir -p "$APP_DIR/config"
sudo mkdir -p "$APP_DIR/logs"
sudo mkdir -p "$APP_DIR/backup"
echo "   Carpetas creadas en $APP_DIR"

# ---- 3. Copiar artefactos ----
echo ""
echo "[3/7] Copiando artefactos..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Copiar JAR
if [ -f "$SCRIPT_DIR/app/$JAR_NAME" ]; then
    sudo cp "$SCRIPT_DIR/app/$JAR_NAME" "$APP_DIR/app/$JAR_NAME"
    echo "   JAR copiado."
else
    echo "   ERROR: No se encontro $SCRIPT_DIR/app/$JAR_NAME"
    exit 1
fi

# Copiar frontend dist/
if [ -d "$SCRIPT_DIR/app/dist" ]; then
    sudo cp -r "$SCRIPT_DIR/app/dist" "$APP_DIR/app/"
    echo "   Frontend dist/ copiado."
else
    echo "   ERROR: No se encontro $SCRIPT_DIR/app/dist"
    exit 1
fi

# Copiar configuracion
if [ -f "$SCRIPT_DIR/config/app.env" ]; then
    sudo cp "$SCRIPT_DIR/config/app.env" "$APP_DIR/config/app.env"
    echo "   app.env copiado."
else
    echo "   ERROR: No se encontro $SCRIPT_DIR/config/app.env"
    exit 1
fi

if [ -f "$SCRIPT_DIR/config/application.properties" ]; then
    sudo cp "$SCRIPT_DIR/config/application.properties" "$APP_DIR/config/application.properties"
    echo "   application.properties copiado."
else
    echo "   WARNING: application.properties no encontrado, usando el embebido en el JAR"
fi

# ---- 4. Establecer permisos ----
echo ""
echo "[4/7] Estableciendo permisos..."
sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR"
sudo chmod 600 "$APP_DIR/config/app.env"
echo "   Permisos establecidos."

# ---- 5. Verificar Java ----
echo ""
echo "[5/7] Verificando Java..."
if command -v java &>/dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -1)
    echo "   Java encontrado: $JAVA_VERSION"
else
    echo "   ERROR: Java no encontrado. Instalar JDK 21:"
    echo "   sudo yum install -y java-21-openjdk java-21-openjdk-devel  (Oracle/RHEL)"
    echo "   sudo apt install -y openjdk-21-jdk  (Ubuntu)"
    exit 1
fi

# ---- 6. Crear servicio systemd ----
echo ""
echo "[6/7] Creando servicio systemd..."
sudo tee "/etc/systemd/system/$SERVICE_NAME" > /dev/null << EOF
[Unit]
Description=Control de Equipos de Apilamiento
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR/app
EnvironmentFile=$APP_DIR/config/app.env
ExecStart=/usr/bin/java -jar $APP_DIR/app/$JAR_NAME --quarkus-profile=prod
SuccessExitStatus=143
Restart=on-failure
RestartSec=10
TimeoutStopSec=30
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
echo "   Servicio $SERVICE_NAME creado."

# ---- 7. Habilitar e iniciar servicio ----
echo ""
echo "[7/7] Iniciando servicio..."
sudo systemctl enable --now "$SERVICE_NAME"
sleep 3
sudo systemctl status "$SERVICE_NAME" --no-pager || true

echo ""
echo "=========================================="
echo " DESPLIEGUE COMPLETADO"
echo "=========================================="
echo ""
echo "Proximos pasos:"
echo "  1. Verificar: sudo systemctl status $SERVICE_NAME"
echo "  2. Logs: sudo journalctl -u $SERVICE_NAME -f"
  echo "  3. Probar: curl -i http://localhost:6111/api/v1/"
echo "  4. Abrir firewall para servidor .10"
echo ""
