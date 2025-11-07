import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../index.ts'
import { students } from '../db/schema/schema.ts'
import * as z from 'zod'

const studentSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
  course: z.string(),
  year: z.string(),
  gpa: z.number()
})

const studentRouter = new Hono()

studentRouter.get('/', async (c) => {
  const student = await db.select().from(students)
  return c.json({ message: 'Student Fetched Successfully', data: student}, { status: 200 })
})

studentRouter.post('/', async (c) => {
  const { name, age, email, course, year, gpa } = await c.req.json()

  console.log("Data :", name, age, email, course, year, gpa)

  const parsed = studentSchema.safeParse({name,age,email,course,year,gpa})
  if (!parsed.success) {
    return c.json({ message: parsed.error.issues[0].message, success: false})
  }
  const response = await db.insert(students).values({ name, age, email, course, year, gpa })
  console.log("Response", response)
  return c.json({ message: 'Student Added Successfully!', success: true }, { status: 201 })
})

studentRouter.put('/:id', async (c) => {
  const id = c.req.param('id')
const body = await c.req.json()

  const parsed = studentSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ message: parsed.error.issues[0].message, success: false })
  }
  await db.update(students).set(body).where(eq(students.id, id))
  return c.json({ message: `Student with ID ${id} updated successfully!`, success: true })
})

studentRouter.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const response = await db.delete(students).where(eq(students.id, Number(id)))
  return c.json({ message: `Student with ID ${id} deleted successfully!`, success: true })
})

export default studentRouter;