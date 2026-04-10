import type { Appointment } from '@prisma/client';
import type { Prisma } from '@prisma/client';

function httpError(statusCode: number, message: string): Error {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

export function parseRolesHeader(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);
}

export function isStaffRole(roles: string[]): boolean {
  return roles.some((r) => r === 'ADMIN' || r === 'DOCTOR');
}

type PatientPatchBody = {
  Status?: string;
  ScheduledDateTime?: string;
};

/** Allowed fields for a patient-initiated PATCH (no Notes, Purpose, etc.). */
export function buildPatientAppointmentUpdate(
  appointment: Appointment,
  body: PatientPatchBody,
): Prisma.AppointmentUpdateInput {
  const keys = (Object.keys(body) as (keyof PatientPatchBody)[]).filter(
    (k) => body[k] !== undefined,
  );
  const unknown = keys.filter((k) => k !== 'Status' && k !== 'ScheduledDateTime');
  if (unknown.length > 0) {
    throw httpError(400, 'You may only change status or scheduled date/time.');
  }

  const hasTime = body.ScheduledDateTime !== undefined;
  const hasStatus = body.Status !== undefined;

  if (hasTime) {
    const d = new Date(body.ScheduledDateTime as string);
    if (Number.isNaN(d.getTime())) {
      throw httpError(400, 'Invalid scheduled date and time.');
    }
    if (d.getTime() <= Date.now()) {
      throw httpError(400, 'Please choose a future date and time.');
    }
    if (!['Scheduled', 'Confirmed', 'Rescheduled'].includes(appointment.Status)) {
      throw httpError(
        400,
        'This appointment cannot be rescheduled in its current state.',
      );
    }
    if (hasStatus && body.Status !== 'Scheduled' && body.Status !== 'Rescheduled') {
      throw httpError(400, 'When rescheduling, status must be Scheduled or Rescheduled.');
    }
    const nextStatus =
      body.Status === 'Rescheduled' ? 'Rescheduled' : 'Scheduled';
    return { ScheduledDateTime: d, Status: nextStatus };
  }

  if (hasStatus && body.Status === 'Confirmed') {
    if (keys.length !== 1) {
      throw httpError(400, 'Invalid confirm request.');
    }
    if (!['Scheduled', 'Rescheduled'].includes(appointment.Status)) {
      throw httpError(
        400,
        'You can only confirm visits that are scheduled or rescheduled.',
      );
    }
    return { Status: 'Confirmed' };
  }

  if (hasStatus && body.Status === 'Cancelled') {
    if (keys.length !== 1) {
      throw httpError(400, 'Invalid cancel request.');
    }
    if (['Completed', 'Cancelled', 'NoShow'].includes(appointment.Status)) {
      throw httpError(400, 'This appointment cannot be cancelled.');
    }
    return { Status: 'Cancelled' };
  }

  throw httpError(400, 'Unsupported update. Use confirm, cancel, or reschedule.');
}
