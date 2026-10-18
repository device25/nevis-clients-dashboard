import type { FastifyInstance } from 'fastify';
import { clients } from '#data';

export interface ClientsRouteOptions {
  delayMs: number;
  fail: boolean;
}

export function registerClientsRoute(
  app: FastifyInstance,
  { delayMs, fail }: ClientsRouteOptions,
) {
  app.get('/api/clients', async (_request, reply) => {
    if (delayMs > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    }
    if (fail) {
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
    return reply.send(clients);
  });
}
