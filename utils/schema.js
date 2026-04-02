// utils/schema.js - PURE POSTGRES
import { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  date, 
  timestamp, 
  integer 
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const GRADES = pgTable("grades", {
  id: serial("id").primaryKey(),
  grade: varchar("grade", { length: 10 }).notNull(),
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