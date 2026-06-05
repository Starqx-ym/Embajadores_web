import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:3000';
const ITERATIONS = Number(__ENV.K6_ITERATIONS || 1000);
const VUS = Number(__ENV.K6_VUS || 50);
const MAX_DURATION = __ENV.K6_MAX_DURATION || '10m';
const TOKEN = __ENV.TOKEN || '';
const THINK_MIN = Number(__ENV.THINK_MIN || 0.05);
const THINK_MAX = Number(__ENV.THINK_MAX || 0.35);
const INCLUDE_WRITES = __ENV.INCLUDE_WRITES === '1';

export const errorRate = new Rate('embajadores_error_rate');
export const endpointErrors = new Counter('embajadores_endpoint_errors');

export const options = {
  scenarios: {
    realistic_iterations: {
      executor: 'shared-iterations',
      vus: VUS,
      iterations: ITERATIONS,
      maxDuration: MAX_DURATION,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    embajadores_error_rate: ['rate<0.05'],
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
  },
};

const random = (min, max) => Math.random() * (max - min) + min;

const authHeaders = () => {
  if (!TOKEN) return {};
  return { Authorization: `Bearer ${TOKEN}` };
};

const request = (name, method, path, body = null, expected = [200], headers = {}) => {
  const params = {
    tags: { endpoint: name },
    timeout: '15s',
    headers,
  };

  if (body) {
    params.headers = {
      'Content-Type': 'application/json',
      ...headers,
    };
  }

  const response = method === 'POST'
    ? http.post(`${BASE_URL}${path}`, body, params)
    : http.get(`${BASE_URL}${path}`, params);

  const ok = check(response, {
    [`${name} status esperado`]: (r) => expected.includes(r.status),
  });

  errorRate.add(!ok);
  if (!ok) endpointErrors.add(1, { endpoint: name, status: String(response.status) });

  return response;
};

export default function () {
  const roll = Math.random();

  if (roll < 0.35) {
    request('api actividades', 'GET', '/api/actividades', null, [200]);
  } else if (roll < 0.50) {
    request('frontend login', 'GET', '/login', null, [200]);
  } else if (roll < 0.65) {
    request('frontend dashboard', 'GET', '/dashboard/actividades', null, [200]);
  } else if (roll < 0.78) {
    request('api cursos', 'GET', '/api/courses', null, TOKEN ? [200] : [401, 403], authHeaders());
  } else if (roll < 0.90) {
    request('api perfil', 'GET', '/api/users/me', null, TOKEN ? [200] : [401, 403], authHeaders());
  } else if (roll < 0.98) {
    request('api ranking', 'GET', '/api/users/ranking', null, TOKEN ? [200] : [401, 403], authHeaders());
  } else if (INCLUDE_WRITES) {
    request('api inscripcion', 'POST', '/api/actividades/1/inscribir', '{}', [200, 400, 401, 403, 409], authHeaders());
  } else {
    request('api actividades fallback', 'GET', '/api/actividades', null, [200]);
  }

  sleep(random(THINK_MIN, THINK_MAX));
}
