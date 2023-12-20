import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user-model.js"

export const verifyJWT = asyncHandler (async (req,res,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        console.log(token)

        if(!token){
            throw new ApiError(407,"unauthorized Access")
        }

        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        console.log(decodedToken)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user){
            throw new ApiError(400,"invalid access to tokens")
        }
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(413,error?.message || "something went wrong")
    }
} )

