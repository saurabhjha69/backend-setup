import mongoose from "mongoose";
import { DBname } from "../constants.js";

const DBconnect = async () => {
    try {
        const mongooseConnect = await mongoose.connect(`${process.env.MONGODB_URI}/${DBname}`);
        console.log(`Database Connection Successfull : DB Host ${mongooseConnect.connection.host}`)

    } catch (error) {
        console.log("Connection Failed".error)
        process.exit(1);
    }
}

export default DBconnect;