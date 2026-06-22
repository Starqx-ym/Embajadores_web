type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  event: string;
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  userId?: number;
  role?: string;
  error?: string;
  stack?: string;
  [key: string]: unknown;
}

const write = (level: LogLevel, payload: LogPayload) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: 'ambassador-backend',
    environment: process.env.NODE_ENV || 'development',
    ...payload
  };

  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
};

export const logger = {
  info: (payload: LogPayload) => write('info', payload),
  warn: (payload: LogPayload) => write('warn', payload),
  error: (payload: LogPayload) => write('error', payload)
};
