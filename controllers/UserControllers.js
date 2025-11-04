import { PrismaClient } from '@prisma/client'
import md5 from 'md5';

const prisma = new PrismaClient()


//addUser
export const adduser = async (req, res) => {
  const { name, username, password, role } = req.body
  try {
    // Simpan user baru ke database
    const newUser = await prisma.user.create({
      data: {
        name: name,
        username: username,
        password: md5(password), // hash biar aman
        role: role
      }
    })

    // Response sesuai dokumentasi
    res.status(200).json({
      status: "success",
      message: "Pengguna berhasil ditambahkan",
      data: {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        role: newUser.role
      }
    })
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    })
  }
}


//edit User
export const editUser = async (req, res) => {
    const { username, password } = req.body
    try {
        const result = await prisma.user.update({
             where: { username}, 
             data: {
                password: password
  }
})
        res.status(200).json(
            {
                message: "data berikut berhasil rubah",
                data: result
            }
        )
    } catch (error) {
        res.status(400).json({ msg: error.message })
    }
}


//get User
export const getUser = async (req, res) => {
    const userId = parseInt(req.params.id);

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { username: true, password: true }, // Pilih field yang aman
        })

        if (!user) {
            return res.status(404).json({ status: 'error', msg: `Pengguna dengan ID ${userId} tidak ditemukan.` });
        }

        res.status(200).json({
            "status": "success",
            "data": user
        })
    } catch (error) {
        res.status(500).json({ status: 'error', msg: error.message });
    }
}

export const getAlluser = async (req, res) => {
    try {
        const response = await prisma.user.findMany()
        res.status(200).json(response)
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}