import { pgTable, serial, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

export const students = pgTable('students',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    age: integer('age').notNull(),
    course: varchar('course', { length: 255 }).notNull(),
    year: varchar("year", { length: 255 }).notNull(),
    gpa: integer('gpa').notNull(),
  });

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  })