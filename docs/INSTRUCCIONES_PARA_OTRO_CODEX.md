# Instrucciones para otro Codex local - Proyecto Embajadores

Este documento explica como debe trabajar y responder otro Codex si se abre este proyecto desde otra PC.

## Contexto del proyecto

El proyecto se llama **Embajadores**.

En la PC local normalmente esta en:

```powershell
C:\embajadores
```

En la maquina virtual AWS Ubuntu esta en:

```bash
~/Embajadores_web
```

La conexion SSH a la VM es:

```powershell
ssh -i ".\llave1.pem" ubuntu@18.208.221.134
```

La aplicacion tiene:

- Frontend: `ambassador-frontend`
- Backend: `ambassador-backend`
- Base de datos: PostgreSQL
- Servidor: Ubuntu AWS
- Proxy/estaticos: Nginx
- Servicio backend: systemd `ambassador`

## Forma correcta de trabajar

Primero se deben hacer los cambios localmente en:

```powershell
C:\embajadores
```

Luego:

1. Compilar/probar localmente.
2. Hacer `git add`, `git commit`, `git push`.
3. Entrar a la VM.
4. Hacer `git pull origin main`.
5. Ejecutar migraciones si existen.
6. Hacer build frontend/backend.
7. Reiniciar servicios.
8. Verificar pagina y endpoints.

No asumir que los cambios locales ya estan en la VM. Hay que subirlos por GitHub y luego hacer pull en la VM.

## Respuestas que siempre se deben dar completas

Cuando se haga un cambio que deba ir a produccion, siempre entregar estos bloques completos.

### 1. Comandos para subir desde la PC

```powershell
cd C:\embajadores
git status
git add RUTAS_DE_ARCHIVOS_CAMBIADOS
git commit -m "MENSAJE_DEL_CAMBIO"
git push origin main
```

Si el usuario pide algo simple, se puede usar:

```powershell
git add .
```

pero es mejor listar los archivos cambiados cuando sea posible.

### 2. Entrar a la VM

```powershell
cd C:\Users\USER\Downloads
ssh -i ".\llave1.pem" ubuntu@18.208.221.134
```

### 3. Pull en la VM protegiendo `.env`

Siempre incluir esto:

```bash
cd ~/Embajadores_web
cp ambassador-backend/.env /tmp/ambassador.env.backup
git stash push -m "backup cambios locales VM antes de pull" -- ambassador-backend/.env ambassador-backend/dist
git pull origin main
cp /tmp/ambassador.env.backup ambassador-backend/.env
```

No recomendar `git stash pop` salvo que se revise manualmente, porque puede volver a meter archivos viejos.

### 4. Migraciones

Si se agrego una migracion SQL nueva, indicar exactamente el archivo:

```bash
sudo -u postgres psql -d ambassadordb -f ambassador-backend/migrations/NOMBRE_MIGRACION.sql
```

Si no hay migracion nueva, decir claramente:

```text
No hay migracion nueva para ejecutar.
```

### 5. Build/copia/restart completo

El usuario pidio que esto se de siempre, no decir "igual que antes".

```bash
cd ~/Embajadores_web/ambassador-frontend
npm install
npm run build
```

```bash
rm -rf ~/Embajadores_web/ambassador-backend/public/*
cp -r dist/* ~/Embajadores_web/ambassador-backend/public/
```

```bash
cd ~/Embajadores_web/ambassador-backend
npm install
npm run build
```

```bash
sudo systemctl daemon-reload
sudo systemctl restart ambassador
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Verificacion

Siempre cerrar con comandos de verificacion:

```bash
sudo systemctl status ambassador
sudo systemctl status nginx
curl http://127.0.0.1:3000/api/health
curl http://127.0.0.1:3000/api/actividades
curl http://18.208.221.134
```

Y URL:

```text
http://18.208.221.134
```

## CI/CD

El workflow esta en:

```text
.github/workflows/ci-cd.yml
```

El deploy usa SSH a:

```text
18.208.221.134
```

En GitHub debe existir el secret:

```text
AWS_SSH_KEY
```

El contenido del secret debe ser todo el contenido de `llave1.pem`, incluyendo:

```text
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

o:

```text
-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
```

## Pruebas de stress

Se usa `k6`.

Instalacion en Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates gnupg2 curl
curl -s https://dl.k6.io/key.gpg | gpg --dearmor | sudo tee /usr/share/keyrings/k6-archive-keyring.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install -y k6
```

Prueba realista de navegacion:

```bash
cd ~/Embajadores_web/ambassador-backend
K6_ITERATIONS=10000 K6_VUS=200 BASE_URL=http://127.0.0.1:3000 TOKEN="PEGAR_TOKEN" npm run stress:k6
```

Prueba real creando actividades:

```bash
K6_ITERATIONS=10000 K6_VUS=100 BASE_URL=http://127.0.0.1:3000 ADMIN_EMAIL="TU_ADMIN_EMAIL" ADMIN_PASSWORD="TU_PASSWORD" npm run stress:k6:create-activities
```

Prueba fuerte:

```bash
K6_ITERATIONS=50000 K6_VUS=300 BASE_URL=http://127.0.0.1:3000 ADMIN_EMAIL="TU_ADMIN_EMAIL" ADMIN_PASSWORD="TU_PASSWORD" K6_MAX_DURATION=45m npm run stress:k6:create-activities
```

Metricas a explicar:

- `http_req_failed`: porcentaje de error HTTP.
- `create_activity_error_rate`: errores funcionales creando actividades.
- `http_req_duration p(95)`: percentil 95 de latencia.
- `http_req_duration p(99)`: percentil 99 de latencia.
- `checks_succeeded` y `checks_failed`: validaciones funcionales.

Si se crean muchas actividades de prueba, limpiar con:

```bash
sudo -u postgres psql -d ambassadordb -c "DELETE FROM public.actividades WHERE nombre LIKE 'K6 Actividad%';"
```

## Logs estructurados y errores

El backend tiene:

- Logs JSON.
- `requestId` por peticion.
- Header `X-Request-Id`.
- Endpoint `GET /api/health`.
- Manejo de 404 API.
- Manejo centralizado de errores 500.

Demostrar:

```bash
curl -i http://127.0.0.1:3000/api/health
curl -i http://127.0.0.1:3000/api/no-existe
sudo journalctl -u ambassador -n 50 --no-pager
```

## Estilo de respuesta para el usuario

Responder en espanol claro y directo.

No decir:

```text
haz el build igual que antes
```

El usuario pidio que siempre se den los comandos completos.

Al finalizar un cambio, responder con:

1. Que se cambio.
2. Que pruebas se corrieron.
3. Comandos para subir a GitHub.
4. Comandos completos para desplegar en la VM.
5. Comandos de verificacion.

## Precauciones importantes

- No borrar `.env` de la VM.
- No hacer `git reset --hard` salvo que el usuario lo pida explicitamente.
- Si `git pull` falla por cambios locales en la VM, usar backup + stash como se indica arriba.
- Si hay migraciones, ejecutarlas antes de reiniciar backend.
- Si se toca frontend, siempre reconstruir y copiar `dist` a `ambassador-backend/public`.
- Si se toca backend, siempre ejecutar `npm run build` y reiniciar `ambassador`.

