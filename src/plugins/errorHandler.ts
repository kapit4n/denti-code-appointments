import { FastifyInstance, FastifyError } from 'fastify';
import { Prisma } from '@prisma/client';

interface CustomError extends FastifyError {
  entity?: string;
}

export function setErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: CustomError, request, reply) => {
    app.log.error(error);

    if (error.validation) {
      reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        details: error.validation,
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002': // Unique constraint violation
          reply.status(409).send({
            statusCode: 409,
            error: 'Conflict',
            message: `Unique constraint failed on ${ (error.meta?.target as string[])?.join(', ')}`,
          });
          return;
        case 'P2025': // Record not found
          reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: error.meta?.cause || 'Resource not found.',
          });
          return;
        case 'P2003': // Foreign key constraint failed
             reply.status(400).send({ // Or 409 Conflict depending on context
                statusCode: 400,
                error: 'Bad Request',
                message: `Foreign key constraint failed on the field: ${error.meta?.field_name}. Ensure the referenced ID exists.`,
             });
             return;
        default:
          break; // Fall through to generic error
      }
    }

    // Custom application errors might have a statusCode property
    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      statusCode: statusCode,
      error: error.name || 'Internal Server Error',
      message: error.message || 'An unexpected error occurred',
    });
  });
}