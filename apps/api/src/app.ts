import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { registerClientsRoute } from '#routes';

export interface BuildAppOptions {
  /** Artificial latency before `/api/clients` answers. */
  delayMs?: number;
  /** Makes `/api/clients` answer 500. */
  fail?: boolean;
  /** Directory of the built web app to serve; omitted in development. */
  webRoot?: string;
  logger?: boolean;
}

export function buildApp({
  delayMs = 0,
  fail = false,
  webRoot,
  logger = false,
}: BuildAppOptions = {}) {
  const app = Fastify({ logger });

  registerClientsRoute(app, { delayMs, fail });
  if (webRoot !== undefined) {
    void app.register(fastifyStatic, { root: webRoot });
  }
  app.setNotFoundHandler((_request, reply) => {
    return reply.code(404).send({ error: 'Not Found' });
  });

  return app;
}
