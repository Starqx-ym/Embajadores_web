const { performance } = require('perf_hooks');

const targetUrl = process.env.TARGET_URL || 'http://127.0.0.1:3000';
const path = process.env.TEST_PATH || '/api/actividades';
const method = process.env.METHOD || 'GET';
const totalRequests = Number(process.env.TOTAL_REQUESTS || 1000);
const concurrency = Number(process.env.CONCURRENCY || 50);
const timeoutMs = Number(process.env.TIMEOUT_MS || 10000);
const expectedStatus = Number(process.env.EXPECTED_STATUS || 200);
const token = process.env.TOKEN || '';
const body = process.env.BODY || '';

if (!Number.isInteger(totalRequests) || totalRequests <= 0) {
  throw new Error('TOTAL_REQUESTS debe ser un entero positivo.');
}

if (!Number.isInteger(concurrency) || concurrency <= 0) {
  throw new Error('CONCURRENCY debe ser un entero positivo.');
}

const url = new URL(path, targetUrl).toString();
const latencies = [];
const statusCounts = {};
let completed = 0;
let ok = 0;
let failed = 0;
let networkErrors = 0;
let nextRequest = 0;

const percentile = (values, p) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
};

const round = (value) => Math.round(value * 100) / 100;

const runOne = async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();

  try {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body) headers['Content-Type'] = 'application/json';

    const response = await fetch(url, {
      method,
      headers,
      body: body || undefined,
      signal: controller.signal
    });

    const elapsed = performance.now() - started;
    latencies.push(elapsed);
    statusCounts[response.status] = (statusCounts[response.status] || 0) + 1;

    if (response.status === expectedStatus) {
      ok += 1;
    } else {
      failed += 1;
    }
  } catch (error) {
    const elapsed = performance.now() - started;
    latencies.push(elapsed);
    failed += 1;
    networkErrors += 1;
  } finally {
    clearTimeout(timeout);
    completed += 1;
  }
};

const worker = async () => {
  while (nextRequest < totalRequests) {
    nextRequest += 1;
    await runOne();

    if (completed % 1000 === 0 || completed === totalRequests) {
      const errorRate = completed ? (failed / completed) * 100 : 0;
      process.stdout.write(`\rCompletadas: ${completed}/${totalRequests} | Error: ${round(errorRate)}%`);
    }
  }
};

const main = async () => {
  console.log('Stress test Embajadores');
  console.log(`URL: ${url}`);
  console.log(`Metodo: ${method}`);
  console.log(`Solicitudes: ${totalRequests}`);
  console.log(`Concurrencia: ${concurrency}`);
  console.log(`Status esperado: ${expectedStatus}`);
  console.log('');

  const started = performance.now();
  const workers = Array.from({ length: Math.min(concurrency, totalRequests) }, () => worker());
  await Promise.all(workers);
  const elapsedSeconds = (performance.now() - started) / 1000;
  const errorRate = totalRequests ? (failed / totalRequests) * 100 : 0;
  const avgLatency = latencies.reduce((sum, value) => sum + value, 0) / Math.max(latencies.length, 1);

  console.log('\n');
  console.log('Resultado');
  console.log(`Total: ${totalRequests}`);
  console.log(`OK: ${ok}`);
  console.log(`Errores: ${failed}`);
  console.log(`Errores de red/timeout: ${networkErrors}`);
  console.log(`Porcentaje de error: ${round(errorRate)}%`);
  console.log(`RPS aprox: ${round(totalRequests / elapsedSeconds)}`);
  console.log(`Duracion: ${round(elapsedSeconds)}s`);
  console.log(`Latencia promedio: ${round(avgLatency)}ms`);
  console.log(`Latencia p95: ${round(percentile(latencies, 95))}ms`);
  console.log(`Latencia p99: ${round(percentile(latencies, 99))}ms`);
  console.log('Codigos HTTP:', JSON.stringify(statusCounts, null, 2));

  if (errorRate > 5) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error('\nStress test fallo:', error.message);
  process.exit(1);
});
