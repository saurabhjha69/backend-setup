import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user-model.js";
import {
  cloudinaryFileUpload,
  userAvatarOrCoverRemover,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const option = {
  httpOnly: true,
  secure: true,
};

const userAccessAndRefreshToken = async (userid) => {
  try {
    const user = await User.findById(userid);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: false,
    });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Something went wrong");
  }
};
const userRegister = asyncHandler(async (req, res) => {
  //get user detail
  // validation lagana hai (email, not everything is empty)
  // check if user exists : username, email
  // check for images, check for avatar
  // upload them to cloudinary, check wheather avtar is uploaded
  // create user object - create entry in db
  // remove pass and refresh token from response
  // check for user creation
  // if user created send response to use r

  const { username, fullname, password, email } = req.body;

  if (
    [username, password, fullname, email].some((feild) => feild?.trim() === "")
  ) {
    throw new ApiError(400, "All Feilds Are Required!!");
  }

  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(414, "Given Email is not valid");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "Given Username or Email Already Exist!!");
  }

  const avatarPath = req.files?.avatar[0]?.path;
  let coverImagePath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImagePath = req.files.coverImage[0].path;
  }

  if (!avatarPath) {
    throw new ApiError(404, "File Required");
  }

  console.log("Avatar Path:", avatarPath);

  const avatarUploaded = await cloudinaryFileUpload(avatarPath);

  console.log("Avatar Uploaded:", avatarUploaded);
  const coverImageUploaded = coverImagePath
    ? await cloudinaryFileUpload(coverImagePath)
    : null;

  if (!avatarUploaded) {
    throw new ApiError(400, "file failed to upload!!");
  }

  const newUser = await User.create({
    username: username.toLowerCase(),
    email,
    fullname,
    password,
    avatar: avatarUploaded.url,
    coverImage: coverImageUploaded?.url || "",
  });

  // const

  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong , Failed To Create user!!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, createdUser, "user Created successfully!!"));
});

const userLogin = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  //find the user
  //password check
  //access and referesh token
  //send cookie

  const { email, username, password } = req.body;
  console.log(email);
  console.log(username);

  // if (!username && !email) {
  //     throw new ApiError(400, "username or email is required")
  // }

  // Here is an alternative of above code based on logic discussed in video:
  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  // console.log(user.password)

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  //    console.log(isPasswordValid)

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await userAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const userLogout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user_id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});

const userRefreshingToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    (await req.cookies?.refreshToken) || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized Access!!");
  }

  const decoded = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  if (!decoded) {
    throw new ApiError(401, "invalid Refresh Token");
  }
  console.log(decoded);

  const user = await User.findById(decoded._id);
  console.log(user.refreshToken);

  if (incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(401, "invalid Refresh Token");
  }

  const { accessToken, refreshToken } = await userAccessAndRefreshToken(
    user._id
  );

  // user.refreshToken=refreshToken
  // await user.save({
  //     validateBeforeSave: false
  // })

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,
          refreshToken,
        },
        "refreshToken Updated Successfully!"
      )
    );
});

const userUpdatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if ((oldPassword || newPassword) === "") {
    throw new ApiError(400, "Enter a valid Old or New password");
  }

  const user = await User.findById(req.user._id);

  const isOldPassValid = await user.isPasswordCorrect(oldPassword);
  console.log(isOldPassValid);

  if (!isOldPassValid) {
    throw new ApiError(400, "old Pass was incorrect!!");
  }

  user.password = newPassword;
  await user.save({
    validateBeforeSave: false,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Updated Succssfully!"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(200, req.user, "Current user founded Successfully!!")
    );
});

const userUpdateAccountDets = asyncHandler(async (req, res) => {
  const { newFullname, newEmail } = req.body;

  if (newFullname === "" || newEmail === "") {
    throw new ApiError(400, "Feilds are required , if updating dets!!");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname: newFullname,
        email: newEmail,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account updated succesfully!!"));
});

const userUpdateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "file not found!!");
  }

  const avatarUrl = req.user.avatar;

  const avatarUploaded = await cloudinaryFileUpload(avatarLocalPath);
  if (!avatarUploaded.url) {
    throw new ApiError(400, "file failed to upload!!");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatarUploaded.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(401, "avatar failed to update!");
  }

  try {
    await userAvatarOrCoverRemover(avatarUrl);
  } catch (error) {
    console.log("failed to delete old image from cloud!!", error);
  }

  res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated Succesfully"));
});

const userUpdateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
  
    if (!coverImageLocalPath) {
      throw new ApiError(400, "file not found!!");
    }
  
    // const coverUrl = req.user.avatar;
  
    const coverImageUploaded = await cloudinaryFileUpload(coverImageLocalPath);
    if (!coverImageUploaded.url) {
      throw new ApiError(400, "file failed to upload!!");
    }
  
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          coverImage: coverImageUploaded.url,
        },
      },
      {
        new: true,
      }
    ).select("-password -refreshToken");
  
    if (!user) {
      throw new ApiError(401, "cover Image failed to update!");
    }
  
    // try {
    //   await userAvatarOrCoverRemover(avatarUrl);
    // } catch (error) {
    //   console.log("failed to delete old image from cloud!!", error);
    // }
  
    res
      .status(200)
      .json(new ApiResponse(200, user, "coverImage updated Succesfully"));
  });

const userChannelDetailsAdder = asyncHandler(async (req, res) => {
  const username = req.params?.username;

  if (!username) {
    throw new ApiError(400, "usernname not found!!");
  }

  const channel = await User.aggregate([
    {
      $match: {
            username: username?.toLowerCase(),
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscribers",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribers: {
          $size: "$subscribers",
        },
        subscribedToChannels: {
          $size: "subscribedTo",
        },
        isSubscribed: {
          if: { $in: [req.user?._id, "$subscribers.subscriber"] },
          then: true,
          else: false,
        },
      },
    },
    {
      project: {
        username: 1,
        fullname: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribers: 1,
        subscribedToChannels: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(400, "channel doesnot exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "channel fecthed successfully!"));
});

const userwatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "vedios",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "user",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    res.status(200)
    .json(new ApiResponse(200,user[0].watchHistory,"User Watch history Fetched!"))
});

export {
  userRegister,
  userLogin,
  userLogout,
  userRefreshingToken,
  userUpdatePassword,
  getCurrentUser,
  userUpdateAccountDets,
  userUpdateAvatar,
  userUpdateCoverImage,
  userChannelDetailsAdder,
  userwatchHistory
};
