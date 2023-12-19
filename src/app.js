import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()

app.use(cors({
    origin: process.env.OriginLink,
    Credentials: true
}))
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended:true, limit: "16kb"}))
app.use(express.static("public"))

app.use(cookieParser())


import Router from "../src/routes/user.route.js";
app.use("/api/v1/user",Router)

export {app}