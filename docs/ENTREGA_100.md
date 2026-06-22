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
- Deploy por SSH a la VM si existen los secrets:
  - `AWS_HOST`
  - `AWS_SSH_KEY`

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
