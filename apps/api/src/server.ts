import { fileURLToPath } from 'node:url';
import { ClientNodeSchema } from '@nevis/contract';
import { buildApp } from './app';
import { readConfig } from './config';
import { clients } from '#data';

function fatal(message: string): never {
  console.error(message);
  process.exit(1);
}

const payload = ClientNodeSchema.safeParse(clients);
if (!payload.success) {
  fatal(`clients.json does not match the contract: ${payload.error.message}`);
}

let config;
try {
  config = readConfig(process.env);
} catch (error) {
  fatal(error instanceof Error ? error.message : String(error));
}

const app = buildApp({
  delayMs: config.delayMs,
  fail: config.fail,
  logger: true,
  ...(config.serveWeb && {
    webRoot: fileURLToPath(new URL('../../web/dist', import.meta.url)),
  }),
});

await app.listen({ port: config.port, host: '0.0.0.0' });
