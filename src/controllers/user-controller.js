import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user-model.js";
import { cloudinaryFileUpload } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken";


const userAccessAndRefreshToken = async (userid) => {
    try {
        const user =await User.findById(userid)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
    
        user.refreshToken = refreshToken
        await user.save({
            validateBeforeSave: false
        })
    
        return {accessToken,refreshToken}
    } catch (error) {
        console.log(error)
        throw new ApiError(500,"Something went wrong")
        
    }
}
const userRegister = asyncHandler (async (req,res) => {
    //get user detail
// validation lagana hai (email, not everything is empty)
// check if user exists : username, email
// check for images, check for avatar
// upload them to cloudinary, check wheather avtar is uploaded
// create user object - create entry in db
// remove pass and refresh token from response
// check for user creation
// if user created send response to use r





    const {username, fullname,password,email} = req.body;

    if (
        [username,password,fullname,email].some((feild) => feild?.trim() === "")
    ) {
        throw new ApiError(400,"All Feilds Are Required!!")
    }

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)){
        throw new ApiError(414,"Given Email is not valid")
    }

    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })

    if (existedUser) {
        throw new ApiError(409,"Given Username or Email Already Exist!!")
    }

    const avatarPath = req.files?.avatar[0]?.path
    let coverImagePath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
    {
        coverImagePath = req.files.coverImage[0].path
    }

    if (!avatarPath) 
    {
        throw new ApiError(404,"File Required")
    }

    console.log("Avatar Path:", avatarPath);

    const avatarUploaded = await cloudinaryFileUpload(avatarPath);

    console.log("Avatar Uploaded:", avatarUploaded);
    const coverImageUploaded = coverImagePath? await cloudinaryFileUpload(coverImagePath) : null;

    if (!avatarUploaded) {
        throw new ApiError(400,"file failed to upload!!")
    }

    const newUser = await User.create({
        username: username.toLowerCase(),
        email,
        fullname,
        password,
        avatar: avatarUploaded.url,
        coverImage: coverImageUploaded?.url || ""
    })

    // const 

    const createdUser = await User.findById(newUser._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500,"something went wrong , Failed To Create user!!!")
    }

    return res.status(200).json(
        new ApiResponse(201,createdUser,"user Created successfully!!")
    )


})

const userLogin = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body
    console.log(email);
    console.log(username);

    // if (!username && !email) {
    //     throw new ApiError(400, "username or email is required")
    // }
    
    // Here is an alternative of above code based on logic discussed in video:
    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
        
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    // console.log(user.password)

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)
   console.log(isPasswordValid)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken,refreshToken} = await userAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const userLogout = asyncHandler (async (req,res) => {
    await User.findByIdAndUpdate(req.user_id,{
        $set: {
            refreshToken : undefined
        }
    },
    {
        new: true
    }
    
    )

    const option = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken",option)
    .clearCookie("refreshToken",option)
    .json(
        new ApiResponse(200,{},"user logged out successfully")
    )
    
})


export {userRegister,userLogin,userLogout}