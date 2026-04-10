import type { IncomingHttpHeaders } from 'http';
import { config } from '../config';

function headerSingle(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function httpError(statusCode: number, message: string): Error {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

/**
 * Resolves the logged-in patient's PatientID using the patients API (same as /patients/me).
 * Expects gateway-forwarded `x-user-email`.
 */
export async function fetchPatientIdFromPatientService(
  headers: IncomingHttpHeaders,
): Promise<number> {
  const email = headerSingle(headers['x-user-email']);
  if (!email) {
    throw httpError(401, 'User identity not provided.');
  }

  const base = config.patientServiceUrl.replace(/\/$/, '');
  const res = await fetch(`${base}/api/patients/me`, {
    headers: { 'x-user-email': email },
  });

  if (!res.ok) {
    throw httpError(403, 'Could not verify your patient profile.');
  }

  const data = (await res.json()) as { PatientID?: unknown };
  if (typeof data.PatientID !== 'number') {
    throw httpError(502, 'Invalid response from patient service.');
  }

  return data.PatientID;
}
