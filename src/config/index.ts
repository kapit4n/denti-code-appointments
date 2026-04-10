import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3003', 10),
  databaseUrl: process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV || 'development',
  /** Used to verify PATIENT role ownership on PATCH (same host as local stack). */
  patientServiceUrl: process.env.PATIENT_SERVICE_URL || 'http://127.0.0.1:3001',
};
