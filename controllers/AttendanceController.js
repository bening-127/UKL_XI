import { PrismaClient } from '@prisma/client'
import dayjs from 'dayjs'

const prisma = new PrismaClient()

//Tambah presensi baru
export const addAttendance = async (req, res) => {
  const { user_id, date, time, status } = req.body

  if (!user_id || !date || !time || !status) {
    return res.status(400).json({ msg: 'Semua field wajib diisi.' })
  }

  try {
    const newAttendance = await prisma.attendance.create({
      data: {
        userId: user_id,
        date: new Date(date),
        time,
        status
      }
    })

    res.status(200).json({
      status: 'success',
      message: 'Presensi berhasil dicatat',
      data: newAttendance
    })
  } catch (error) {
    res.status(400).json({ status: 'error', msg: error.message })
  }
}

//Semua data presensi
export const getAllAttendance = async (req, res) => {
  try {
    const result = await prisma.attendance.findMany({
      include: { user: { select: { name: true, username: true } } },
      orderBy: { date: 'desc' }
    })
    res.status(200).json({ status: 'success', data: result })
  } catch (error) {
    res.status(400).json({ status: 'error', msg: error.message })
  }
}

//Presensi berdasarkan ID
export const getAttendanceById = async (req, res) => {
  const { id } = req.params
  try {
    const result = await prisma.attendance.findUnique({
      where: { id: parseInt(id) },
      include: { user: { select: { name: true, username: true } } }
    })
    if (!result)
      return res.status(404).json({ status: 'error', msg: 'Presensi tidak ditemukan' })

    res.status(200).json({ status: 'success', data: result })
  } catch (error) {
    res.status(400).json({ status: 'error', msg: error.message })
  }
}

//Update presensi
export const updateAttendance = async (req, res) => {
  const { id } = req.params
  const { date, time, status } = req.body

  try {
    const updated = await prisma.attendance.update({
      where: { id: parseInt(id) },
      data: { date: new Date(date), time, status }
    })
    res.status(200).json({
      status: 'success',
      message: 'Data presensi berhasil diperbarui',
      data: updated
    })
  } catch (error) {
    res.status(400).json({ status: 'error', msg: error.message })
  }
}

//Hapus presensi
export const deleteAttendance = async (req, res) => {
  const { id } = req.params

  try {
    await prisma.attendance.delete({
      where: { id: parseInt(id) }
    })
    res.status(200).json({
      status: 'success',
      message: 'Data presensi berhasil dihapus'
    })
  } catch (error) {
    res.status(400).json({ status: 'error', msg: error.message })
  }
}

// Analisis presensi
export const analysis = async (req, res) => {
  const { start_date, end_date, group_by } = req.body

  if (!start_date || !end_date || !group_by) {
    return res.status(400).json({ msg: 'Field start_date, end_date, dan group_by wajib diisi.' })
  }

  if (group_by !== 'kelas' && group_by !== 'jabatan') {
    return res.status(400).json({ msg: 'group_by harus "kelas" atau "jabatan".' })
  }

  const startDate = dayjs(start_date).toDate()
  const endDate = dayjs(end_date).toDate()
  const totalDays = dayjs(end_date).diff(dayjs(start_date), 'day') + 1

  try {
    const totalUsersPerGroup = await prisma.user.groupBy({
      by: ['groupId'],
      where: { group: { type: group_by } },
      _count: { id: true }
    })

    const totalUsersMap = new Map()
    totalUsersPerGroup.forEach(item => {
      if (item.groupId) {
        totalUsersMap.set(item.groupId, item._count.id)
      }
    })

    const attendanceRecords = await prisma.attendance.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: {
        user: {
          select: {
            groupId: true,
            group: { select: { name: true, type: true } }
          }
        }
      }
    })

    const groupedCounts = new Map()

    attendanceRecords.forEach(record => {
      const group = record.user.group
      if (group && group.type === group_by) {
        const groupId = record.user.groupId
        const groupName = group.name

        if (!groupedCounts.has(groupId)) {
          groupedCounts.set(groupId, {
            group_name: groupName,
            total_hadir: 0,
            total_izin: 0,
            total_sakit: 0,
            total_users: totalUsersMap.get(groupId) || 0
          })
        }

        const counts = groupedCounts.get(groupId)
        const status = record.status.toLowerCase()

        if (status === 'hadir') counts.total_hadir++
        else if (status === 'izin') counts.total_izin++
        else if (status === 'sakit') counts.total_sakit++
      }
    })

    const groupedAnalysis = Array.from(groupedCounts.values()).map(item => {
      const totalHadir = item.total_hadir
      const totalIzin = item.total_izin
      const totalSakit = item.total_sakit
      const totalUsers = item.total_users
      const totalPresences = totalHadir + totalIzin + totalSakit
      const totalPossibleAttendance = totalUsers * totalDays
      let totalAlpa = totalPossibleAttendance - totalPresences
      if (totalAlpa < 0) totalAlpa = 0

      return {
        group: item.group_name,
        total_users: totalUsers,
        attendance_rate: {
          hadir_percentage:
            totalPossibleAttendance > 0
              ? parseFloat(((totalHadir / totalPossibleAttendance) * 100).toFixed(2))
              : 0.0,
          izin_percentage:
            totalPossibleAttendance > 0
              ? parseFloat(((totalIzin / totalPossibleAttendance) * 100).toFixed(2))
              : 0.0,
          sakit_percentage:
            totalPossibleAttendance > 0
              ? parseFloat(((totalSakit / totalPossibleAttendance) * 100).toFixed(2))
              : 0.0,
          alpa_percentage:
            totalPossibleAttendance > 0
              ? parseFloat(((totalAlpa / totalPossibleAttendance) * 100).toFixed(2))
              : 0.0
        },
        total_attendance: {
          hadir: totalHadir,
          izin: totalIzin,
          sakit: totalSakit,
          alpa: totalAlpa
        }
      }
    })

    res.status(200).json({
      status: 'success',
      data: {
        analysis_period: {
          start_date: dayjs(startDate).format('YYYY-MM-DD'),
          end_date: dayjs(endDate).format('YYYY-MM-DD')
        },
        grouped_analysis: groupedAnalysis
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: error.message })
  }
}
