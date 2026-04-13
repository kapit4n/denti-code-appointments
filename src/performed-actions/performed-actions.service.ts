import { PrismaClient, PerformedAction, Prisma } from '@prisma/client';
import {
  computeVisitInventoryDeltas,
  parseFacilityCodesFromPerformedAction,
  postApplyCodeDeltas,
} from '../inventory/visitInventorySync';

export interface CreatePerformedActionData {
  ProcedureTypeID: number;
  PerformingDoctorID: number;
  ToothInvolved?: string;
  SurfacesInvolved?: string;
  AnesthesiaUsed?: string;
  /** Catalog IDs stored as JSON array in the database */
  FacilitiesUsed?: string[];
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
  FacilitiesUsed?: string[];
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

    const { FacilitiesUsed, ...rest } = data;
    const facilitiesJson =
      FacilitiesUsed && FacilitiesUsed.length > 0 ? JSON.stringify(FacilitiesUsed) : undefined;

    const actionToCreate: Prisma.PerformedActionUncheckedCreateInput = {
      AppointmentID: appointmentId,
      ...rest,
      FacilitiesUsed: facilitiesJson,
      TotalPrice: totalPrice,
    };

    const created = await this.prisma.performedAction.create({
      data: actionToCreate,
    });

    const newCodes = [...new Set(FacilitiesUsed ?? [])];
    const deltas = computeVisitInventoryDeltas([], 0, newCodes, data.Quantity);
    if (deltas.length > 0) {
      try {
        await postApplyCodeDeltas(
          deltas,
          `PerformedAction ${created.PerformedActionID} created (appointment ${appointmentId})`,
        );
      } catch (err) {
        await this.prisma.performedAction.delete({
          where: { PerformedActionID: created.PerformedActionID },
        });
        throw err;
      }
    }

    return created;
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

  async findOne(actionId: number): Promise<PerformedAction> {
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

    const { FacilitiesUsed, ...rest } = data;
    const dataToUpdate: Prisma.PerformedActionUpdateInput = { ...rest };

    if (FacilitiesUsed !== undefined) {
      dataToUpdate.FacilitiesUsed =
        FacilitiesUsed.length > 0 ? JSON.stringify(FacilitiesUsed) : null;
    }

    const quantity = data.Quantity !== undefined ? data.Quantity : existingAction.Quantity;
    const unitPrice = data.UnitPrice !== undefined ? data.UnitPrice : existingAction.UnitPrice;

    if (data.Quantity !== undefined || data.UnitPrice !== undefined) {
      dataToUpdate.TotalPrice = this.calculateTotalPrice(quantity, unitPrice);
    }

    const oldCodes = parseFacilityCodesFromPerformedAction(existingAction.FacilitiesUsed);
    const oldQty = existingAction.Quantity;
    const newCodes =
      FacilitiesUsed !== undefined
        ? [...new Set(FacilitiesUsed.map((s) => String(s).trim()).filter(Boolean))]
        : oldCodes;
    const newQty = data.Quantity !== undefined ? data.Quantity : oldQty;

    const deltas = computeVisitInventoryDeltas(oldCodes, oldQty, newCodes, newQty);
    if (deltas.length > 0) {
      await postApplyCodeDeltas(deltas, `PerformedAction ${actionId} updated`);
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
    const existing = await this.findOne(actionId);
    const codes = parseFacilityCodesFromPerformedAction(existing.FacilitiesUsed);
    const qty = existing.Quantity;
    const returnDeltas = computeVisitInventoryDeltas(codes, qty, [], 0);
    if (returnDeltas.length > 0) {
      await postApplyCodeDeltas(returnDeltas, `PerformedAction ${actionId} deleted`);
    }

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