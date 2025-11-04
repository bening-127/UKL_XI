import express from "express"

import{ 
    getUser,
    adduser,
    editUser,
    getAlluser

 } from "../controllers/UserControllers.js"

import { authenticate } from "../controllers/Authcontrollers.js";
const app = express()

app.get("/", getAlluser)
app.get(`/:id`, getUser)
// app.post("/Tiket/:id", GetUserbyID)
app.post ("/add/:id", adduser)
app.put("/edit/:id", editUser)
// app.delete("/delete/:id", delUser)

app.post('/login', authenticate)


export default app