import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:3000';
const ITERATIONS = Number(__ENV.K6_ITERATIONS || 1000);
const VUS = Number(__ENV.K6_VUS || 50);
const MAX_DURATION = __ENV.K6_MAX_DURATION || '10m';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || '';
const TOKEN = __ENV.TOKEN || '';

export const controlledCreateErrors = new Rate('controlled_create_error_rate');
export const controlledCreateErrorCount = new Counter('controlled_create_error_count');

export const options = {
  scenarios: {
    invalid_course_creation: {
      executor: 'shared-iterations',
      vus: VUS,
      iterations: ITERATIONS,
      maxDuration: MAX_DURATION,
    },
  },
  thresholds: {
    // Esta prueba esta diseñada para generar errores HTTP 400.
    controlled_create_error_rate: ['rate>0.90'],
  },
};

export function setup() {
  if (TOKEN) return { token: TOKEN };

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Define TOKEN o ADMIN_EMAIL/ADMIN_PASSWORD para crear errores controlados.');
  }

  const response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'login_admin' },
  });

  check(response, {
    'login admin/coordinador correcto': (res) => res.status === 200 && Boolean(res.json('token')),
  });

  return { token: response.json('token') };
}

export default function (data) {
  const invalidPayload = JSON.stringify({
    title: '',
    description: 'Payload invalido creado intencionalmente por k6.',
    cost_points: -50,
    provider: 'Prueba k6',
  });

  const response = http.post(`${BASE_URL}/api/courses`, invalidPayload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.token}`,
    },
    timeout: '15s',
    tags: { endpoint: 'crear_curso_invalido' },
  });

  const isControlledError = response.status === 400;

  check(response, {
    'curso invalido genera HTTP 400': () => isControlledError,
    'respuesta contiene mensaje de error': (res) => Boolean(res.json('error')),
  });

  controlledCreateErrors.add(isControlledError);
  if (isControlledError) controlledCreateErrorCount.add(1);

  sleep(Number(__ENV.SLEEP || 0.1));
}
