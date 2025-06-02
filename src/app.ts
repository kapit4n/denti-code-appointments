import Fastify, { FastifyInstance } from 'fastify';
import prismaPlugin from './plugins/prisma';
import { setErrorHandler } from './plugins/errorHandler';
import appointmentRoutes from './appointments/appointments.routes';
import performedActionRoutes from './performed-actions/performed-actions.routes';
import { performedActionBaseSchema } from './performed-actions/performed-actions.schemas';
import { appointmentBaseSchema } from './appointments/appointments.schemas';

export function buildApp(opts = {}): FastifyInstance {
  const app = Fastify(opts);


  app.addSchema(performedActionBaseSchema.id('PerformedAction'));
  app.addSchema(appointmentBaseSchema.id('Appointment'));

  app.register(prismaPlugin);

  app.register(appointmentRoutes, { prefix: '/api/v1/appointments' });
  app.register(performedActionRoutes, { prefix: '/api/v1' });

  setErrorHandler(app);

  return app;
}
