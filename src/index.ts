import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { students } from './db/schema/schema.ts'
import studentRoute from './routes/student.route.ts'
import authRouter from './routes/auth.route.ts'

const sql = postgres(process.env.DATABASE_URL!)
export const db = drizzle(sql, {
  schema: {
    students
  }
}) 

const app = new Hono()
const port = Number(process.env.PORT ?? 3000)
const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173'

app.use("/*",cors({
  origin: corsOrigin,
  credentials: true,
}))

app.route("/student", studentRoute) 
app.route("/auth",authRouter)

app.get("/", (c) => {
  return c.json({ message: "Server Working" })
})

serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`Server is running on port:${info.port}`)
})
