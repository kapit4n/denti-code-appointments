-- CreateTable
CREATE TABLE "Appointment" (
    "AppointmentID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "PatientID" INTEGER NOT NULL,
    "PrimaryDoctorID" INTEGER NOT NULL,
    "ScheduledDateTime" DATETIME NOT NULL,
    "EstimatedDurationMinutes" INTEGER,
    "AppointmentPurpose" TEXT,
    "Status" TEXT NOT NULL,
    "Notes" TEXT,
    "CreationDateTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastUpdateDateTime" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PerformedAction" (
    "PerformedActionID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "AppointmentID" INTEGER NOT NULL,
    "ProcedureTypeID" INTEGER NOT NULL,
    "PerformingDoctorID" INTEGER NOT NULL,
    "ActionDateTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ToothInvolved" TEXT,
    "SurfacesInvolved" TEXT,
    "AnesthesiaUsed" TEXT,
    "Description_Notes" TEXT,
    "Quantity" INTEGER NOT NULL DEFAULT 1,
    "UnitPrice" REAL NOT NULL,
    "TotalPrice" REAL NOT NULL,
    CONSTRAINT "PerformedAction_AppointmentID_fkey" FOREIGN KEY ("AppointmentID") REFERENCES "Appointment" ("AppointmentID") ON DELETE CASCADE ON UPDATE CASCADE
);
