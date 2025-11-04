import express from 'express'
import {
  addAttendance,
  getAllAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  analysis
} from '../controllers/AttendanceController.js'

const app = express()

app.post('/add', addAttendance)
app.get('/all', getAllAttendance)
app.get('/by/:id', getAttendanceById)
app.put('/update/:id', updateAttendance)
app.delete('/del/:id', deleteAttendance)
app.post('/analysis', analysis)

export default app
