import S from 'fluent-json-schema';

export const performedActionParamsSchema = S.object().prop('actionId', S.integer().required());

export const appointmentParamsSchema = S.object().prop('appointmentId', S.integer().required());

export const createPerformedActionSchema = S.object()
  .prop('ProcedureTypeID', S.integer().required().description('External ProcedureType ID'))
  .prop('PerformingDoctorID', S.integer().required().description('External Doctor ID performing the action'))
  .prop('ToothInvolved', S.string().maxLength(50).description('e.g., "16", "UL Quadrant"'))
  .prop('SurfacesInvolved', S.string().maxLength(50).description('e.g., "MOD", "Occlusal"'))
  .prop('AnesthesiaUsed', S.string().maxLength(100).description('Type and amount of anesthesia'))
  .prop('Description_Notes', S.string().description('Clinical notes for this action'))
  .prop('Quantity', S.integer().minimum(1).default(1).required())
  .prop('UnitPrice', S.number().minimum(0).required().description('Price for one unit of this procedure'));
  // TotalPrice will be calculated in the service

export const updatePerformedActionSchema = S.object()
  .prop('ProcedureTypeID', S.integer().description('External ProcedureType ID'))
  .prop('PerformingDoctorID', S.integer().description('External Doctor ID performing the action'))
  .prop('ToothInvolved', S.string().maxLength(50).description('e.g., "16", "UL Quadrant"'))
  .prop('SurfacesInvolved', S.string().maxLength(50).description('e.g., "MOD", "Occlusal"'))
  .prop('AnesthesiaUsed', S.string().maxLength(100).description('Type and amount of anesthesia'))
  .prop('Description_Notes', S.string().description('Clinical notes for this action'))
  .prop('Quantity', S.integer().minimum(1))
  .prop('UnitPrice', S.number().minimum(0).description('Price for one unit of this procedure'));
  // TotalPrice will be recalculated if Quantity or UnitPrice changes

export const performedActionBaseSchema = S.object()
  .prop('PerformedActionID', S.integer())
  .prop('AppointmentID', S.integer())
  .prop('ProcedureTypeID', S.integer())
  .prop('PerformingDoctorID', S.integer())
  .prop('ActionDateTime', S.string().format(S.FORMATS.DATE_TIME))
  .prop('ToothInvolved', S.anyOf([S.string(), S.null()]))
  .prop('SurfacesInvolved', S.anyOf([S.string(), S.null()]))
  .prop('AnesthesiaUsed', S.anyOf([S.string(), S.null()]))
  .prop('Description_Notes', S.anyOf([S.string(), S.null()]))
  .prop('Quantity', S.integer())
  .prop('UnitPrice', S.number())
  .prop('TotalPrice', S.number());
