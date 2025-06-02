import S from 'fluent-json-schema';

export const createAppointmentSchema = S.object()
  .prop('PatientID', S.integer().required().description('External Patient ID'))
  .prop('PrimaryDoctorID', S.integer().required().description('External Doctor ID'))
  .prop('ScheduledDateTime', S.string().format(S.FORMATS.DATE_TIME).required())
  .prop('EstimatedDurationMinutes', S.integer().minimum(1))
  .prop('AppointmentPurpose', S.string().maxLength(255))
  .prop('Status', S.string().enum(['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'NoShow']).required())
  .prop('Notes', S.string());

export const updateAppointmentSchema = S.object()
  .prop('ScheduledDateTime', S.string().format(S.FORMATS.DATE_TIME))
  .prop('EstimatedDurationMinutes', S.integer().minimum(1))
  .prop('AppointmentPurpose', S.string().maxLength(255))
  .prop('Status', S.string().enum(['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'NoShow']))
  .prop('Notes', S.string());

export const paramsSchema = S.object().prop('appointmentId', S.integer().required());

export const appointmentBaseSchema = S.object()
  .prop('AppointmentID', S.integer())
  .prop('PatientID', S.integer())
  .prop('PrimaryDoctorID', S.integer())
  .prop('ScheduledDateTime', S.string().format(S.FORMATS.DATE_TIME))
  .prop('EstimatedDurationMinutes', S.anyOf([S.integer(), S.null()]))
  .prop('AppointmentPurpose', S.anyOf([S.string(), S.null()]))
  .prop('Status', S.string())
  .prop('Notes', S.anyOf([S.string(), S.null()]))
  .prop('CreationDateTime', S.string().format(S.FORMATS.DATE_TIME))
  .prop('LastUpdateDateTime', S.string().format(S.FORMATS.DATE_TIME))
  .prop('performedActions', S.array().items(S.ref('PerformedAction#')).description('List of actions performed in this appointment')); // Use optional if not always included