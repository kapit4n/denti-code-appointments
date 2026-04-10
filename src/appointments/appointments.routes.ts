import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import S from 'fluent-json-schema';
import { AppointmentsService } from './appointments.service';
import { createAppointmentSchema, updateAppointmentSchema, paramsSchema } from './appointments.schemas';
import { Prisma } from '@prisma/client';
import {
  buildPatientAppointmentUpdate,
  isStaffRole,
  parseRolesHeader,
} from './patientPatchPolicy';
import { fetchPatientIdFromPatientService } from './patientProfileClient';


export default async function appointmentRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const appointmentsService = new AppointmentsService(fastify.prisma);

  fastify.post('/', { schema: { body: createAppointmentSchema, response: { 201: { $ref: 'Appointment#' } } } }, async (request, reply) => {
    const appointment = await appointmentsService.create(request.body as Prisma.AppointmentUncheckedCreateInput);
    reply.code(201).send(appointment);
  });

  fastify.get('/', { schema: { response: { 200: S.array().items(S.ref('Appointment#')) } } }, async (request, reply) => {
    const appointments = await appointmentsService.findAll();
    reply.send(appointments);
  });

  fastify.get('/me', { schema: { response: { 200: S.array().items(S.ref('Appointment#')) } } }, async (request, reply) => {
    const appointments = await appointmentsService.findAll();
    reply.send(appointments);
  });

  fastify.get('/:appointmentId', { schema: { params: paramsSchema, response: { 200: { $ref: 'Appointment#' } } } }, async (request, reply) => {
    const { appointmentId } = request.params as { appointmentId: number };
    const appointment = await appointmentsService.findOne(appointmentId);
    reply.send(appointment);
  });

  fastify.patch('/:appointmentId', { schema: { params: paramsSchema, body: updateAppointmentSchema, response: { 200: { $ref: 'Appointment#' } } } }, async (request, reply) => {
    const { appointmentId } = request.params as { appointmentId: number };
    const existing = await appointmentsService.findOne(appointmentId);
    const roles = parseRolesHeader(request.headers['x-user-roles']);
    const body = request.body as Record<string, unknown>;

    let data: Prisma.AppointmentUpdateInput;

    if (isStaffRole(roles)) {
      data = body as Prisma.AppointmentUpdateInput;
    } else {
      const patientId = await fetchPatientIdFromPatientService(request.headers);
      if (existing.PatientID !== patientId) {
        const err = new Error('You do not have access to this appointment.') as Error & {
          statusCode: number;
        };
        err.statusCode = 403;
        throw err;
      }
      data = buildPatientAppointmentUpdate(existing, body as { Status?: string; ScheduledDateTime?: string });
    }

    const appointment = await appointmentsService.update(appointmentId, data);
    reply.send(appointment);
  });

  fastify.delete('/:appointmentId', { schema: { params: paramsSchema, response: { 204: S.null() } } }, async (request, reply) => {
    const { appointmentId } = request.params as { appointmentId: number };
    await appointmentsService.remove(appointmentId);
    reply.code(204).send();
  });
}
