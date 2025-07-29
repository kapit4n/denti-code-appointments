import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding for Appointments & Clinical Records Service...');

  // To ensure a clean slate, we'll delete existing records in order
  // (delete actions first, then appointments)
  await prisma.performedAction.deleteMany({});
  await prisma.appointment.deleteMany({});
  console.log('Cleared existing appointments and actions.');

  // --- Create Past Appointments (before July 28, 2025) ---

  const pastAppt1 = await prisma.appointment.create({
    data: {
      PatientID: 1, // John Doe
      PrimaryDoctorID: 2, // Peter Parker
      ScheduledDateTime: new Date('2025-06-15T14:00:00.000Z'), // June 15, 2025
      AppointmentPurpose: '6-Month Cleaning & Check-up',
      Status: 'Completed',
      Notes: 'Patient reported no issues. Standard cleaning performed.',
    },
  });

  // Add actions performed during this past appointment
  await prisma.performedAction.createMany({
    data: [
      {
        AppointmentID: pastAppt1.AppointmentID,
        ProcedureTypeID: 3, // Prophylaxis - Adult
        PerformingDoctorID: 2,
        Quantity: 1,
        UnitPrice: 120,
        TotalPrice: 120,
        Description_Notes: 'Routine cleaning completed.',
      },
      {
        AppointmentID: pastAppt1.AppointmentID,
        ProcedureTypeID: 2, // Bitewing Radiographs - Two Films
        PerformingDoctorID: 2,
        Quantity: 1,
        UnitPrice: 50,
        TotalPrice: 50,
        Description_Notes: 'X-rays show no new cavities.',
      },
    ],
  });

  const pastAppt2 = await prisma.appointment.create({
    data: {
      PatientID: 2, // Jane Smith
      PrimaryDoctorID: 1, // Susan Storm
      ScheduledDateTime: new Date('2025-07-10T10:30:00.000Z'), // July 10, 2025
      AppointmentPurpose: 'Root Canal Follow-up',
      Status: 'Completed',
      Notes: 'Follow-up on tooth #14. Healing well.',
    },
  });

  await prisma.performedAction.create({
    data: {
      AppointmentID: pastAppt2.AppointmentID,
      ProcedureTypeID: 1, // Comprehensive Oral Evaluation
      PerformingDoctorID: 1,
      ToothInvolved: '14',
      Quantity: 1,
      UnitPrice: 100,
      TotalPrice: 100,
      Description_Notes: 'Post-op evaluation of tooth #14. No signs of infection.',
    },
  });

  // --- Create Upcoming Appointments (after July 28, 2025) ---

  await prisma.appointment.create({
    data: {
      PatientID: 1, // John Doe
      PrimaryDoctorID: 2, // Peter Parker
      ScheduledDateTime: new Date('2025-08-05T11:00:00.000Z'), // August 5, 2025
      AppointmentPurpose: 'Composite Filling',
      Status: 'Confirmed',
      Notes: 'Filling for tooth #30, upper right.',
    },
  });

  await prisma.appointment.create({
    data: {
      PatientID: 4, // Sofia Gomez
      PrimaryDoctorID: 3, // Bruce Banner
      ScheduledDateTime: new Date('2025-08-12T09:00:00.000Z'), // August 12, 2025
      AppointmentPurpose: 'Orthodontic Consultation',
      Status: 'Scheduled',
    },
  });

  await prisma.appointment.create({
    data: {
      PatientID: 5, // Mateo Vargas
      PrimaryDoctorID: 4, // Tony Stark
      ScheduledDateTime: new Date('2025-09-02T16:00:00.000Z'), // September 2, 2025
      AppointmentPurpose: 'Periodontal Maintenance',
      Status: 'Scheduled',
      Notes: 'Routine check for gum health.',
    },
  });

  console.log('Seeding for Appointments Service finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
