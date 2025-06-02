import { PrismaClient, Appointment, Prisma } from '@prisma/client';

export class AppointmentsService {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.AppointmentUncheckedCreateInput): Promise<Appointment> {
    // TODO: Here you might add logic to call other services to verify PatientID, PrimaryDoctorID if needed
    // For now, we assume they are provided and valid.
    return this.prisma.appointment.create({ data });
  }

  async findAll(): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({ include: { performedActions: true } });
  }

  async findOne(appointmentId: number): Promise<Appointment | null> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { AppointmentID: appointmentId },
      include: { performedActions: true }
    });
    if (!appointment) {
        // Error will be caught by central handler if P2025 is thrown or this custom error
        const err = new Error(`Appointment with ID ${appointmentId} not found.`) as any;
        err.statusCode = 404;
        throw err;
    }
    return appointment;
  }

  async update(appointmentId: number, data: Prisma.AppointmentUpdateInput): Promise<Appointment> {
    try {
        return await this.prisma.appointment.update({
            where: { AppointmentID: appointmentId },
            data,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            const err = new Error(`Appointment with ID ${appointmentId} not found for update.`) as any;
            err.statusCode = 404;
            throw err;
        }
        throw error; // Re-throw for central handler
    }
  }

  async remove(appointmentId: number): Promise<Appointment> {
     try {
        return await this.prisma.appointment.delete({
            where: { AppointmentID: appointmentId },
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            const err = new Error(`Appointment with ID ${appointmentId} not found for deletion.`) as any;
            err.statusCode = 404;
            throw err;
        }
        throw error; // Re-throw for central handler
    }
  }
}