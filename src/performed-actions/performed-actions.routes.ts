import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import S from 'fluent-json-schema';
import { PerformedActionsService, CreatePerformedActionData, UpdatePerformedActionData } from './performed-actions.service';
import {
  createPerformedActionSchema,
  updatePerformedActionSchema,
  performedActionParamsSchema,
  appointmentParamsSchema,
} from './performed-actions.schemas';

const performedActionResponseSchema: FastifySchema = {
    response: {
        200: { $ref: 'PerformedAction#' },
        201: { $ref: 'PerformedAction#' }
    }
};
const performedActionsListResponseSchema: FastifySchema = {
    response: {
        200: S.array().items(S.ref('PerformedAction#'))
    }
};


export default async function performedActionRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const performedActionsService = new PerformedActionsService(fastify.prisma);

  // POST /api/v1/appointments/:appointmentId/actions
  fastify.post(
    '/appointments/:appointmentId/actions',
    {
      schema: {
        tags: ['Performed Actions'],
        summary: 'Add a performed action to an appointment',
        params: appointmentParamsSchema,
        body: createPerformedActionSchema,
        ...performedActionResponseSchema
      },
    },
    async (request, reply) => {
      const { appointmentId } = request.params as { appointmentId: number };
      const actionData = request.body as CreatePerformedActionData;
      const performedAction = await performedActionsService.create(appointmentId, actionData);
      reply.code(201).send(performedAction);
    },
  );

  // GET /api/v1/appointments/:appointmentId/actions
  fastify.get(
    '/appointments/:appointmentId/actions',
    {
      schema: {
        tags: ['Performed Actions'],
        summary: 'Get all performed actions for an appointment',
        params: appointmentParamsSchema,
        ...performedActionsListResponseSchema
      },
    },
    async (request, reply) => {
      const { appointmentId } = request.params as { appointmentId: number };
      const actions = await performedActionsService.findAllByAppointment(appointmentId);
      reply.send(actions);
    },
  );

  // GET /api/v1/actions/:actionId
  fastify.get(
    '/actions/:actionId',
    {
      schema: {
        tags: ['Performed Actions'],
        summary: 'Get a specific performed action by its ID',
        params: performedActionParamsSchema,
        ...performedActionResponseSchema
      },
    },
    async (request, reply) => {
      const { actionId } = request.params as { actionId: number };
      const action = await performedActionsService.findOne(actionId);
      reply.send(action);
    },
  );

  // PATCH /api/v1/actions/:actionId
  fastify.patch(
    '/actions/:actionId',
    {
      schema: {
        tags: ['Performed Actions'],
        summary: 'Update a performed action',
        params: performedActionParamsSchema,
        body: updatePerformedActionSchema,
        ...performedActionResponseSchema
      },
    },
    async (request, reply) => {
      const { actionId } = request.params as { actionId: number };
      const updateData = request.body as UpdatePerformedActionData;
      const updatedAction = await performedActionsService.update(actionId, updateData);
      reply.send(updatedAction);
    },
  );

  // DELETE /api/v1/actions/:actionId
  fastify.delete(
    '/actions/:actionId',
    {
      schema: {
        tags: ['Performed Actions'],
        summary: 'Delete a performed action',
        params: performedActionParamsSchema,
        response: { 204: S.null() }
      },
    },
    async (request, reply) => {
      const { actionId } = request.params as { actionId: number };
      await performedActionsService.remove(actionId);
      reply.code(204).send();
    },
  );
}
