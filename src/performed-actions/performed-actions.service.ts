import { PrismaClient, PerformedAction, Prisma } from '@prisma/client';

export interface CreatePerformedActionData {
  ProcedureTypeID: number;
  PerformingDoctorID: number;
  ToothInvolved?: string;
  SurfacesInvolved?: string;
  AnesthesiaUsed?: string;
  Description_Notes?: string;
  Quantity: number;
  UnitPrice: number;
}

export interface UpdatePerformedActionData {
  ProcedureTypeID?: number;
  PerformingDoctorID?: number;
  ToothInvolved?: string;
  SurfacesInvolved?: string;
  AnesthesiaUsed?: string;
  Description_Notes?: string;
  Quantity?: number;
  UnitPrice?: number;
}


export class PerformedActionsService {
  constructor(private prisma: PrismaClient) {}

  private calculateTotalPrice(quantity: number, unitPrice: number): number {
    return quantity * unitPrice;
  }

  async create(appointmentId: number, data: CreatePerformedActionData): Promise<PerformedAction> {
    const appointment = await this.prisma.appointment.findUnique({ where: { AppointmentID: appointmentId } });
    if (!appointment) {
      const err = new Error(`Appointment with ID ${appointmentId} not found. Cannot add action.`) as any;
      err.statusCode = 404;
      throw err;
    }

    const totalPrice = this.calculateTotalPrice(data.Quantity, data.UnitPrice);

    const actionToCreate: Prisma.PerformedActionUncheckedCreateInput = {
      AppointmentID: appointmentId,
      ...data,
      TotalPrice: totalPrice,
    };

    return this.prisma.performedAction.create({
      data: actionToCreate,
    });
  }

  async findAllByAppointment(appointmentId: number): Promise<PerformedAction[]> {
    const appointment = await this.prisma.appointment.findUnique({ where: { AppointmentID: appointmentId } });
    if (!appointment) {
      const err = new Error(`Appointment with ID ${appointmentId} not found.`) as any;
      err.statusCode = 404;
      throw err;
    }

    return this.prisma.performedAction.findMany({
      where: { AppointmentID: appointmentId },
      orderBy: { ActionDateTime: 'asc' },
    });
  }

  async findOne(actionId: number): Promise<PerformedAction | null> {
    const action = await this.prisma.performedAction.findUnique({
      where: { PerformedActionID: actionId },
    });
    if (!action) {
      const err = new Error(`Performed Action with ID ${actionId} not found.`) as any;
      err.statusCode = 404;
      throw err;
    }
    return action;
  }

  async update(actionId: number, data: UpdatePerformedActionData): Promise<PerformedAction> {
    const existingAction = await this.findOne(actionId);
    if (!existingAction) {
        const err = new Error(`Performed Action with ID ${actionId} not found for update.`) as any;
        err.statusCode = 404;
        throw err;
    }

    const dataToUpdate: Prisma.PerformedActionUpdateInput = { ...data };

    const quantity = data.Quantity !== undefined ? data.Quantity : existingAction.Quantity;
    const unitPrice = data.UnitPrice !== undefined ? data.UnitPrice : existingAction.UnitPrice;

    if (data.Quantity !== undefined || data.UnitPrice !== undefined) {
      dataToUpdate.TotalPrice = this.calculateTotalPrice(quantity, unitPrice);
    }

    try {
      return await this.prisma.performedAction.update({
        where: { PerformedActionID: actionId },
        data: dataToUpdate,
      });
    } catch (error) {
      // Prisma's P2025 "Record to update not found" is handled by findOne or will be caught by central handler
      throw error; // Re-throw for central handler
    }
  }

  async remove(actionId: number): Promise<PerformedAction> {
    // findOne will throw if not found
    await this.findOne(actionId);
    try {
      return await this.prisma.performedAction.delete({
        where: { PerformedActionID: actionId },
      });
    } catch (error) {
      // Prisma's P2025 "Record to delete not found" is handled by findOne or will be caught by central handler
      throw error; // Re-throw for central handler
    }
  }
}