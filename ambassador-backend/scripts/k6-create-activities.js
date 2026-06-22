import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:3000';
const ITERATIONS = Number(__ENV.K6_ITERATIONS || 10000);
const VUS = Number(__ENV.K6_VUS || 100);
const MAX_DURATION = __ENV.K6_MAX_DURATION || '30m';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || '';
const TOKEN = __ENV.TOKEN || '';
const THINK_MIN = Number(__ENV.THINK_MIN || 0.05);
const THINK_MAX = Number(__ENV.THINK_MAX || 0.2);

export const createActivityErrorRate = new Rate('create_activity_error_rate');
export const createActivityErrors = new Counter('create_activity_errors');

export const options = {
  scenarios: {
    create_activities: {
      executor: 'shared-iterations',
      vus: VUS,
      iterations: ITERATIONS,
      maxDuration: MAX_DURATION,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.10'],
    create_activity_error_rate: ['rate<0.10'],
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
  },
};

const random = (min, max) => Math.random() * (max - min) + min;

export function setup() {
  if (TOKEN) return { token: TOKEN };

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Define TOKEN o ADMIN_EMAIL/ADMIN_PASSWORD para crear actividades.');
  }

  const response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'login_admin' },
  });

  check(response, {
    'login admin/coordinador correcto': (r) => r.status === 200 && Boolean(r.json('token')),
  });

  return { token: response.json('token') };
}

export default function (data) {
  const unique = `${__VU}-${__ITER}-${Date.now()}`;
  const payload = JSON.stringify({
    nombre: `K6 Actividad ${unique}`,
    titulo: `K6 Actividad ${unique}`,
    descripcion: `Actividad creada por k6 para prueba de entrega 100%. Iteracion ${__ITER}.`,
    puntos: Math.floor(random(5, 50)),
    puntos_otorgados: Math.floor(random(5, 50)),
    cupos_disponibles: Math.floor(random(10, 80)),
    fecha_evento: new Date(Date.now() + 86400000).toISOString(),
    estado: 'activo',
  });

  const response = http.post(`${BASE_URL}/api/actividades`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.token}`,
    },
    timeout: '20s',
    tags: { endpoint: 'crear_actividad' },
  });

  const ok = check(response, {
    'actividad creada HTTP 201': (r) => r.status === 201,
    'respuesta contiene id': (r) => Boolean(r.json('id')),
  });

  createActivityErrorRate.add(!ok);
  if (!ok) createActivityErrors.add(1, { status: String(response.status) });

  sleep(random(THINK_MIN, THINK_MAX));
}
