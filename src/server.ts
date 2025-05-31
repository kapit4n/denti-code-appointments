import { buildApp } from './app';
import { config } from './config';

const loggerConfig = config.nodeEnv === 'development'
  ? { transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' } } }
  : true; // Production logging (JSON)

const app = buildApp({ logger: loggerConfig });

const start = async () => {
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();