# Entrega 100% - Portal Embajadores

## 1. Proyecto funcional al 100%

Demostracion en navegador:

- Login y registro.
- Actividades disponibles para embajadores.
- Inscripcion y desinscripcion con motivo.
- Perfil con puntos, historial y ranking.
- Vista Cursos para canjear puntos.
- Panel Admin/Coordinador:
  - CRUD de actividades.
  - Asignacion de puntos.
  - Creacion de cursos.
  - Buzon de desinscripciones y canjes.
  - Gestion de usuarios solo para admin.

Comandos de verificacion en la VM:

```bash
curl http://127.0.0.1:3000/api/health
curl http://127.0.0.1:3000/api/actividades
sudo systemctl status ambassador
sudo systemctl status nginx
```

## 2. Pruebas de stress 10000 - 50000

Instalar k6 en Ubuntu:

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
K6_ITERATIONS=50000 K6_VUS=500 BASE_URL=http://127.0.0.1:3000 TOKEN="PEGAR_TOKEN" K6_MAX_DURATION=30m npm run stress:k6
```

Prueba real de escritura creando actividades:

```bash
K6_ITERATIONS=10000 K6_VUS=100 BASE_URL=http://127.0.0.1:3000 ADMIN_EMAIL="admin@correo.com" ADMIN_PASSWORD="PASSWORD" npm run stress:k6:create-activities
K6_ITERATIONS=50000 K6_VUS=300 BASE_URL=http://127.0.0.1:3000 ADMIN_EMAIL="admin@correo.com" ADMIN_PASSWORD="PASSWORD" K6_MAX_DURATION=45m npm run stress:k6:create-activities
```

Metricas que se deben mostrar:

- `http_req_failed`: porcentaje de error HTTP.
- `create_activity_error_rate`: porcentaje de error creando actividades.
- `http_req_duration p(95)` y `p(99)`: tiempos de respuesta bajo carga.
- `checks_succeeded` y `checks_failed`: validacion funcional.

## 3. Control de cuellos de botella

Evidencias:

```bash
top
free -m
df -h
sudo journalctl -u ambassador -f
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

Indicadores:

- CPU alta sostenida: subir instancia, reducir workers o revisar endpoints lentos.
- Memoria baja: revisar fugas, cache, numero de workers.
- PostgreSQL lento: revisar consultas, indices y conexiones.
- Nginx 502/504: backend caido, saturado o timeout.

Consultas utiles en PostgreSQL:

```sql
SELECT count(*) FROM public.actividades;
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;
SELECT now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY duration DESC
LIMIT 10;
```

## 4. Logs estructurados

El backend emite logs JSON con:

- `timestamp`
- `level`
- `service`
- `environment`
- `event`
- `requestId`
- `method`
- `path`
- `statusCode`
- `durationMs`
- `userId`
- `role`

Demostracion:

```bash
sudo journalctl -u ambassador -n 50 --no-pager
curl -i http://127.0.0.1:3000/api/health
```

El header `X-Request-Id` permite cruzar una respuesta con el log del servidor.

## 5. Errores esperados y caidas

Demostracion de endpoint inexistente:

```bash
curl -i http://127.0.0.1:3000/api/no-existe
```

Demostracion de estado del servidor y base de datos:

```bash
curl -i http://127.0.0.1:3000/api/health
```

Si PostgreSQL falla, `/api/health` responde `503` con el motivo.

Frontend:

- Si hay error de red o 5xx, axios redirige a `/server-error`.

## 6. CI/CD

Pipeline incluido:

```text
.github/workflows/ci-cd.yml
```

Demostracion:

- Push a `main`.
- GitHub Actions compila backend.
- GitHub Actions compila frontend.
- Deploy por SSH a la VM `18.208.221.134` si existe el secret:
  - `AWS_SSH_KEY`

El secret `AWS_SSH_KEY` debe contener toda la llave privada `llave1.pem`.

## 7. Estrategia de migracion de servidor sin perdida sustancial

Estrategia recomendada:

1. Crear nueva VM con Node, Nginx, PostgreSQL client y k6.
2. Clonar repo en `/home/ubuntu/Embajadores_web`.
3. Restaurar `.env` y configurar systemd/Nginx.
4. Replicar base de datos:

```bash
pg_dump -Fc -U ambassador -h ORIGEN ambassadordb > embajadores.dump
pg_restore -U ambassador -h DESTINO -d ambassadordb embajadores.dump
```

5. Ejecutar migraciones pendientes.
6. Hacer build frontend/backend.
7. Validar `/api/health` y flujos principales.
8. Cambiar DNS o Elastic IP hacia la nueva VM.
9. Mantener la VM antigua en modo rollback durante una ventana corta.

Para reducir corte:

- Usar TTL bajo en DNS antes de migrar.
- Hacer backup justo antes del cambio.
- Congelar escrituras durante minutos si no hay replicacion.
- Validar con k6 una prueba corta antes de abrir trafico.

## 8. Guion paso a paso para demostrar la entrega

### Paso 1: Mostrar proyecto funcionando

Abrir:

```text
http://18.208.221.134
```

Demostrar:

1. Login.
2. Vista de actividades.
3. Inscripcion a una actividad.
4. Perfil con puntos, historial y ranking.
5. Cursos canjeables.
6. Panel admin/coordinador:
   - CRUD de actividades.
   - Creacion de cursos.
   - Asignacion de puntos.
   - Buzon de avisos.

Respuesta sugerida:

```text
El proyecto esta funcional en la VM AWS. El frontend lo sirve Nginx y el backend Express corre como servicio systemd. La aplicacion cubre login, roles, actividades, inscripciones, cursos, puntos, ranking y administracion.
```

### Paso 2: Verificar servicios y healthcheck

En la VM:

```bash
sudo systemctl status ambassador
sudo systemctl status nginx
curl -i http://127.0.0.1:3000/api/health
curl -i http://127.0.0.1:3000/api/actividades
```

Que mostrar:

- `ambassador` activo.
- `nginx` activo.
- `/api/health` con `status: ok`.
- `/api/actividades` con respuesta JSON.

### Paso 3: Probar errores esperados

```bash
curl -i http://127.0.0.1:3000/api/no-existe
```

Que mostrar:

- HTTP `404`.
- JSON controlado.
- `requestId` para cruzar con logs.

Respuesta sugerida:

```text
Los errores esperados no rompen el servidor. Se devuelven respuestas JSON controladas con requestId para rastreo.
```

### Paso 4: Mostrar logs estructurados

```bash
sudo journalctl -u ambassador -n 80 --no-pager
```

Que mostrar:

- Logs en formato JSON.
- Campos `timestamp`, `level`, `event`, `requestId`, `method`, `path`, `statusCode`, `durationMs`.

Respuesta sugerida:

```text
Los logs son estructurados en JSON y permiten medir tiempos de respuesta, errores y rutas lentas.
```

### Paso 5: Ejecutar prueba k6 realista

```bash
cd ~/Embajadores_web/ambassador-backend
K6_ITERATIONS=10000 K6_VUS=200 BASE_URL=http://127.0.0.1:3000 TOKEN="PEGAR_TOKEN" npm run stress:k6
```

Para 50000:

```bash
K6_ITERATIONS=50000 K6_VUS=500 BASE_URL=http://127.0.0.1:3000 TOKEN="PEGAR_TOKEN" K6_MAX_DURATION=30m npm run stress:k6
```

Que mostrar:

- `http_req_failed`.
- `embajadores_error_rate`.
- `http_req_duration p(95)`.
- `http_req_duration p(99)`.
- `checks_succeeded`.

### Paso 6: Ejecutar prueba k6 creando actividades reales

Esta prueba crea registros reales en `public.actividades`.

```bash
cd ~/Embajadores_web/ambassador-backend
K6_ITERATIONS=10000 K6_VUS=100 BASE_URL=http://127.0.0.1:3000 ADMIN_EMAIL="TU_ADMIN_EMAIL" ADMIN_PASSWORD="TU_PASSWORD" npm run stress:k6:create-activities
```

Para 50000:

```bash
K6_ITERATIONS=50000 K6_VUS=300 BASE_URL=http://127.0.0.1:3000 ADMIN_EMAIL="TU_ADMIN_EMAIL" ADMIN_PASSWORD="TU_PASSWORD" K6_MAX_DURATION=45m npm run stress:k6:create-activities
```

Que mostrar:

- `create_activity_error_rate`.
- `http_req_failed`.
- `actividad creada HTTP 201`.
- `respuesta contiene id`.

Verificar en PostgreSQL:

```bash
sudo -u postgres psql -d ambassadordb -c "SELECT count(*) FROM public.actividades WHERE nombre LIKE 'K6 Actividad%';"
```

Limpiar datos de prueba:

```bash
sudo -u postgres psql -d ambassadordb -c "DELETE FROM public.actividades WHERE nombre LIKE 'K6 Actividad%';"
```

### Paso 6.1: Ejecutar prueba k6 con errores controlados

Esta prueba intenta crear cursos invalidos, por ejemplo sin titulo y con puntos negativos.
El objetivo es demostrar que el servidor contiene errores esperados y responde `400` sin caerse.

```bash
cd ~/Embajadores_web/ambassador-backend
K6_ITERATIONS=1000 K6_VUS=50 BASE_URL=http://127.0.0.1:3000 ADMIN_EMAIL="TU_ADMIN_EMAIL" ADMIN_PASSWORD="TU_PASSWORD" npm run stress:k6:error-create-courses
```

Para una prueba mayor:

```bash
K6_ITERATIONS=10000 K6_VUS=200 BASE_URL=http://127.0.0.1:3000 ADMIN_EMAIL="TU_ADMIN_EMAIL" ADMIN_PASSWORD="TU_PASSWORD" K6_MAX_DURATION=20m npm run stress:k6:error-create-courses
```

Que mostrar:

- `http_req_failed`: debe subir porque k6 considera los HTTP `400` como fallos HTTP.
- `controlled_create_error_rate`: debe estar cerca de `100%`, porque la prueba esta disenada para generar errores controlados.
- Checks:
  - `curso invalido genera HTTP 400`
  - `respuesta contiene mensaje de error`

Respuesta sugerida:

```text
Esta prueba no busca que todo sea exitoso. Busca demostrar que los errores esperados se contienen dentro del servidor: el backend responde 400 con JSON de error y no se cae.
```

### Paso 7: Controlar cuellos de botella durante k6

En otra terminal SSH:

```bash
top
free -m
df -h
sudo journalctl -u ambassador -f
```

PostgreSQL:

```bash
sudo -u postgres psql -d ambassadordb
```

Dentro de `psql`:

```sql
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;
SELECT now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY duration DESC
LIMIT 10;
```

Respuesta sugerida:

```text
Los cuellos de botella se controlan observando CPU, memoria, disco, conexiones PostgreSQL, endpoints lentos y errores Nginx/backend. Con k6 se identifican p95/p99 y porcentaje de fallos.
```

### Paso 8: Mostrar CI/CD

En GitHub:

1. Abrir pestaña `Actions`.
2. Mostrar workflow `Embajadores CI/CD`.
3. Mostrar job `Build frontend and backend`.
4. Mostrar job `Deploy to AWS VM`.

Respuesta sugerida:

```text
El pipeline compila backend y frontend en cada push a main. Si la compilacion pasa, despliega por SSH a la VM AWS usando el secret AWS_SSH_KEY.
```

### Paso 9: Estrategia de migracion sin perdida sustancial

Explicar:

1. Crear nueva VM.
2. Instalar Node, Nginx, PostgreSQL client y k6.
3. Clonar repo.
4. Copiar `.env`.
5. Migrar base con `pg_dump` y `pg_restore`.
6. Ejecutar migraciones.
7. Validar `/api/health`.
8. Correr k6 corto.
9. Cambiar DNS o Elastic IP.
10. Mantener VM anterior como rollback temporal.

Comandos base:

```bash
pg_dump -Fc -U ambassador -h ORIGEN ambassadordb > embajadores.dump
pg_restore -U ambassador -h DESTINO -d ambassadordb embajadores.dump
```

Respuesta sugerida:

```text
La migracion se haria preparando una VM paralela, restaurando la base, validando salud y rendimiento, y cambiando DNS o Elastic IP con rollback disponible.
```
