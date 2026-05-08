const cors = require('cors')
const dotenv = require('dotenv')
const express = require('express')
const connectDB = require('./config/db')
const errorHandler = require('./middleware/errorHandler')
const authRoutes = require('./routes/authRoutes')
const projectRoutes = require('./routes/projectRoutes')
const taskRoutes = require('./routes/taskRoutes')
const userRoutes = require('./routes/userRoutes')

dotenv.config()
connectDB()

const app = express()

const allowedOrigins = [
  'http://localhost:5173',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
]

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (no Origin header) and known frontends.
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  }),
)
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/users', userRoutes)

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.use(errorHandler)

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
