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

app.get("/", (req, res) => {
  res.status(200).send("Backend is alive 🚀");
});

const allowedOrigins = [
  'http://localhost:5173',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
]

app.use(cors())
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
//railway deployment fix

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
