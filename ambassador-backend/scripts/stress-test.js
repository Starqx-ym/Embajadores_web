const { performance } = require('perf_hooks');

const targetUrl = process.env.TARGET_URL || 'http://127.0.0.1:3000';
const totalRequests = Number(process.env.TOTAL_REQUESTS || 1000);
const concurrency = Number(process.env.CONCURRENCY || 50);
const timeoutMs = Number(process.env.TIMEOUT_MS || 10000);
const scenario = process.env.SCENARIO || 'realistic';
const rampUpMs = Number(process.env.RAMP_UP_MS || 5000);
const minThinkMs = Number(process.env.MIN_THINK_MS || 20);
const maxThinkMs = Number(process.env.MAX_THINK_MS || 250);
const loginEmail = process.env.LOGIN_EMAIL || '';
const loginPassword = process.env.LOGIN_PASSWORD || '';
let token = process.env.TOKEN || '';

if (!Number.isInteger(totalRequests) || totalRequests <= 0) {
  throw new Error('TOTAL_REQUESTS debe ser un entero positivo.');
}

if (!Number.isInteger(concurrency) || concurrency <= 0) {
  throw new Error('CONCURRENCY debe ser un entero positivo.');
}

const latencies = [];
const statusCounts = {};
const endpointCounts = {};
const endpointErrors = {};
let completed = 0;
let ok = 0;
let failed = 0;
let networkErrors = 0;
let nextRequest = 0;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const round = (value) => Math.round(value * 100) / 100;

const percentile = (values, p) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
};

const weightedPick = (items) => {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }

  return items[items.length - 1];
};

const buildUrl = (path) => {
  const url = new URL(path, targetUrl);
  if (process.env.CACHE_BUSTER === '1') {
    url.searchParams.set('_t', `${Date.now()}-${Math.random()}`);
  }
  return url.toString();
};

const singleEndpointPlan = () => [{
  name: process.env.TEST_PATH || '/api/actividades',
  path: process.env.TEST_PATH || '/api/actividades',
  method: process.env.METHOD || 'GET',
  expected: [Number(process.env.EXPECTED_STATUS || 200)],
  weight: 1,
  auth: Boolean(token),
  body: process.env.BODY || ''
}];

const realisticPlan = () => {
  const plan = [
    { name: 'listar actividades', path: '/api/actividades', method: 'GET', expected: [200], weight: 45, auth: false },
    { name: 'frontend login route', path: '/login', method: 'GET', expected: [200], weight: 10, auth: false },
    { name: 'frontend dashboard route', path: '/dashboard/actividades', method: 'GET', expected: [200], weight: 10, auth: false },
    { name: 'cursos publicos autenticados', path: '/api/courses', method: 'GET', expected: [200, 401, 403], weight: 15, auth: true },
    { name: 'perfil autenticado', path: '/api/users/me', method: 'GET', expected: [200, 401, 403], weight: 10, auth: true },
    { name: 'ranking autenticado', path: '/api/users/ranking', method: 'GET', expected: [200, 401, 403], weight: 10, auth: true }
  ];

  if (process.env.INCLUDE_WRITE_TESTS === '1') {
    plan.push({
      name: 'inscripcion id 1',
      path: '/api/actividades/1/inscribir',
      method: 'POST',
      expected: [200, 400, 401, 403, 409],
      weight: 3,
      auth: true,
      body: '{}'
    });
  }

  return plan;
};

const authenticate = async () => {
  if (token || !loginEmail || !loginPassword) return;

  const response = await fetch(buildUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: loginEmail, password: loginPassword })
  });

  if (!response.ok) {
    throw new Error(`No se pudo iniciar sesion para la prueba: HTTP ${response.status}`);
  }

  const data = await response.json();
  token = data.token;
};

const requestPlan = scenario === 'single' ? singleEndpointPlan() : realisticPlan();

const runOne = async () => {
  const selected = weightedPick(requestPlan);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();
  endpointCounts[selected.name] = (endpointCounts[selected.name] || 0) + 1;

  try {
    const headers = {};
    if (selected.auth && token) headers.Authorization = `Bearer ${token}`;
    if (selected.body) headers['Content-Type'] = 'application/json';

    const response = await fetch(buildUrl(selected.path), {
      method: selected.method,
      headers,
      body: selected.body || undefined,
      signal: controller.signal
    });

    const elapsed = performance.now() - started;
    latencies.push(elapsed);
    statusCounts[response.status] = (statusCounts[response.status] || 0) + 1;

    if (selected.expected.includes(response.status)) {
      ok += 1;
    } else {
      failed += 1;
      endpointErrors[selected.name] = (endpointErrors[selected.name] || 0) + 1;
    }
  } catch (error) {
    const elapsed = performance.now() - started;
    latencies.push(elapsed);
    failed += 1;
    networkErrors += 1;
    endpointErrors[selected.name] = (endpointErrors[selected.name] || 0) + 1;
  } finally {
    clearTimeout(timeout);
    completed += 1;
  }
};

const worker = async (index) => {
  if (rampUpMs > 0) {
    await sleep(Math.round((index / Math.max(concurrency, 1)) * rampUpMs));
  }

  while (nextRequest < totalRequests) {
    nextRequest += 1;
    await runOne();
    await sleep(randomInt(minThinkMs, maxThinkMs));

    if (completed % 1000 === 0 || completed === totalRequests) {
      const errorRate = completed ? (failed / completed) * 100 : 0;
      process.stdout.write(`\rCompletadas: ${completed}/${totalRequests} | Error: ${round(errorRate)}%`);
    }
  }
};

const main = async () => {
  await authenticate();

  console.log('Stress test Embajadores');
  console.log(`Target: ${targetUrl}`);
  console.log(`Escenario: ${scenario}`);
  console.log(`Solicitudes: ${totalRequests}`);
  console.log(`Concurrencia: ${concurrency}`);
  console.log(`Ramp-up: ${rampUpMs}ms`);
  console.log(`Pausa usuario: ${minThinkMs}-${maxThinkMs}ms`);
  console.log(`Autenticado: ${token ? 'si' : 'no'}`);
  console.log('');
  console.log('Mix de endpoints:');
  requestPlan.forEach(item => console.log(`- ${item.weight}% aprox | ${item.method} ${item.path} | ${item.name}`));
  console.log('');

  const started = performance.now();
  const workers = Array.from({ length: Math.min(concurrency, totalRequests) }, (_, index) => worker(index));
  await Promise.all(workers);
  const elapsedSeconds = (performance.now() - started) / 1000;
  const errorRate = totalRequests ? (failed / totalRequests) * 100 : 0;
  const avgLatency = latencies.reduce((sum, value) => sum + value, 0) / Math.max(latencies.length, 1);

  console.log('\n');
  console.log('Resultado');
  console.log(`Total: ${totalRequests}`);
  console.log(`OK esperados: ${ok}`);
  console.log(`Errores no esperados: ${failed}`);
  console.log(`Errores de red/timeout: ${networkErrors}`);
  console.log(`Porcentaje de error real: ${round(errorRate)}%`);
  console.log(`RPS aprox: ${round(totalRequests / elapsedSeconds)}`);
  console.log(`Duracion: ${round(elapsedSeconds)}s`);
  console.log(`Latencia promedio: ${round(avgLatency)}ms`);
  console.log(`Latencia p95: ${round(percentile(latencies, 95))}ms`);
  console.log(`Latencia p99: ${round(percentile(latencies, 99))}ms`);
  console.log('Codigos HTTP:', JSON.stringify(statusCounts, null, 2));
  console.log('Requests por endpoint:', JSON.stringify(endpointCounts, null, 2));
  console.log('Errores por endpoint:', JSON.stringify(endpointErrors, null, 2));

  if (errorRate > Number(process.env.MAX_ERROR_RATE || 5)) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error('\nStress test fallo:', error.message);
  process.exit(1);
});
