import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { students } from './db/schema/schema.ts'
import { eq } from 'drizzle-orm'

const sql = postgres(process.env.DATABASE_URL!)
const db = drizzle(sql, {
  schema: {
    students
  }
})

const app = new Hono()

app.use("/*",cors({
  origin: 'https://frontend-p1s8qhn3a3djhk4xegscivb1-5173.thekalkicinematicuniverse.com' 
}))
 

app.get('/', async (c) => {
  const student = await db.select().from(students)
  return c.json({ message: 'Student Fetched Successfully', data: student || [{ id: 1, name: 'John Doe', age: 20, email: 'john@example.com', course: 'Computer Science', year: 2, gpa: 3.5 }] },{status: 200})
})

app.post('/', async (c) => {
  const { name, age, email, course, year, gpa } = await c.req.json()
  console.log("Data :", name, age, email, course, year, gpa)
  if(!name || !age || !email || !course || !year || !gpa){
    return c.json({message: 'All fields are required!'},{status: 400})
  }
  const response = await db.insert(students).values({ name, age, email, course, year, gpa })
  console.log("Response", response)
  return c.json({message: 'Student Added Successfully!', success: true},{status: 201})
})

app.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  await db.update(students).set(body).where(eq(students.id, id))
  return c.json({ message: `Student with ID ${id} updated successfully!`, success: true })
})

app.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const response = await db.delete(students).where(eq(students.id, id))
  return c.json({ message: `Student with ID ${id} deleted successfully!`, success: true })
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
