import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const GRADES = pgTable("grades", {
    id: integer("id").primaryKey(),
    grade: varchar("grade", { length: 10 }).notNull(),
});