import dotenv from "dotenv"
import DBconnect from "./db/index.js"
import {app} from "./app.js"

dotenv.config({
    path: './env'
})

DBconnect().
then(() => {
    app.on("error",(error)=>{
        console.log("Error",error);
        throw error
    })
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Port is running on ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("Conncetionn Failed!!!",err)
})