import Fastify, { FastifyInstance } from 'fastify';
import prismaPlugin from './plugins/prisma';


export function buildApp(opts = {}): FastifyInstance {
  const app = Fastify(opts);

  app.register(prismaPlugin);


  return app;
}
