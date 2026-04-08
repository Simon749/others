// utils/schema.js - PURE POSTGRES
import {
  pgTable,
  serial,
  varchar,
  text,
  date,
  timestamp,
  integer,
  boolean
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'


export const GRADES = pgTable("grades", {
  id: serial("id").primaryKey(),
  grade: varchar("grade", { length: 10 }).notNull(),
})

export const STREAMS = pgTable("streams", {
  id: serial("id").primaryKey(),
  gradeId: integer("grade_id").references(() => GRADES.id).notNull(),
  streamName: varchar("stream_name", { length: 10 }).notNull(), // e.g., "A", "B", "C"
  description: varchar("description", { length: 100 }), // e.g., "Form 1A"
  createdAt: timestamp("created_at").defaultNow(),
})

export const students = pgTable('students', {  // ← pgTable NOT mysqlTable
  id: serial('id').primaryKey(),  // ← serial NOT crypto.randomUUID()
  admissionNumber: varchar('admission_number', { length: 20 }).unique().notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  middleName: varchar('middle_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  gender: varchar('gender', { length: 10 }).notNull(),
  dateOfBirth: date('date_of_birth').notNull(),
  age: integer('age'),  // ← integer from pg-core
  class: varchar('class', { length: 20 }).notNull(),
  stream: varchar('stream', { length: 20 }),
  admissionDate: timestamp('admission_date').defaultNow().notNull(),
  previousSchool: varchar('previous_school', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const parents = pgTable('parents', {  // ← pgTable NOT mysqlTable
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phone1: varchar('phone_1', { length: 12 }).notNull(),
  phone2: varchar('phone_2', { length: 12 }),
  relationship: varchar('relationship', { length: 50 }).default('Parent'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const locations = pgTable('locations', {  // ← pgTable NOT mysqlTable
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id).notNull(),
  county: varchar('county', { length: 50 }).notNull(),
  subCounty: varchar('sub_county', { length: 100 }),
  villageEstate: text('village_estate'),  // ← text from pg-core
  createdAt: timestamp('created_at').defaultNow(),
})

export const medicalConditions = pgTable('medical_conditions', {  // ← pgTable
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id).notNull(),
  condition: varchar('condition', { length: 255 }).notNull(),
  severity: varchar('severity', { length: 20 }),
  medication: text('medication'),
  createdAt: timestamp('created_at').defaultNow(),
})

// Relations
export const studentsRelations = relations(students, ({ many }) => ({
  parents: many(parents),
  locations: many(locations),
  medicalConditions: many(medicalConditions),
}))

export const parentsRelations = relations(parents, ({ one }) => ({
  student: one(students, {
    fields: [parents.studentId],
    references: [students.id],
  }),
}))

export const locationsRelations = relations(locations, ({ one }) => ({
  student: one(students, {
    fields: [locations.studentId],
    references: [students.id],
  }),
}))

export const medicalConditionsRelations = relations(medicalConditions, ({ one }) => ({
  student: one(students, {
    fields: [medicalConditions.studentId],
    references: [students.id],
  }),
}))

// PHASE 1: USERS TABLE FOR PERMISSIONS & AUDIT
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(), // "admin", "class_teacher", "accountant", "parent"
  password: varchar('password', { length: 255 }).notNull(), // In production, use hashing!
  gradeId: integer('grade_id').references(() => GRADES.id), // Which class they teach (NULL if admin)
  streamId: integer('stream_id').references(() => STREAMS.id), // Which stream they teach (NULL if multi-stream)
  isActive: boolean('is_active').default(true),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// PHASE 1: ATTENDANCE TABLE - DECLARE BEFORE auditLogs (no forward references)
export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  studentId: integer('studentId').references(() => students.id).notNull(),
  gradeId: integer('grade_id').references(() => GRADES.id).notNull(),
  streamId: integer('stream_id').references(() => STREAMS.id).notNull(),
  date: text('date').notNull(), // Usually YYYY-MM-DD or YYYY-MM
  day: integer('day'), // Day of the month
  present: boolean('present').notNull().default(false),
  reason: varchar('reason', { length: 100 }).default('manual_entry'),
  lastModifiedBy: integer('last_modified_by').references(() => users.id), // WHO last changed it
  lastModifiedAt: timestamp('last_modified_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// PHASE 1: AUDIT LOGS TABLE - TRACKS ALL CHANGES (now attendance is defined)
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  attendanceId: integer('attendance_id').references(() => attendance.id).notNull(),
  changedBy: integer('changed_by').references(() => users.id).notNull(),
  previousValue: boolean('previous_value'), // Previous present/absent state
  newValue: boolean('new_value'), // New present/absent state
  reason: varchar('reason', { length: 255 }), // Why changed: "Manual entry", "Correction", "Excused", "Medical"
  ipAddress: varchar('ip_address', { length: 45 }), // Track WHERE change was made
  userAgent: text('user_agent'), // Browser/client info
  changedAt: timestamp('changed_at').defaultNow(),
  statusCode: integer('status_code'), // 200, 400, 500 etc if needed
})

// PHASE 1: SCHOOL HOLIDAYS TABLE - PREVENT MARKING HOLIDAYS
export const schoolHolidays = pgTable('school_holidays', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
})

