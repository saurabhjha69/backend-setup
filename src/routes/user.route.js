import { Router }  from "express";
import { userRegister , userLogin, userLogout, userRefreshingToken,userUpdatePassword, getCurrentUser, userUpdateAccountDets, userUpdateAvatar, userUpdateCoverImage, userwatchHistory} from "../controllers/user-controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/register").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]),userRegister);

router.route("/login").post(userLogin);

router.route("/logout").post(verifyJWT,userLogout)

router.route("/refresh-token").post(userRefreshingToken)

router.route("/update-password").post(verifyJWT,userUpdatePassword)

router.route("/get-current-user").post(verifyJWT,getCurrentUser)

router.route("/update-account").patch(verifyJWT,userUpdateAccountDets)

router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),userUpdateAvatar)

router.route("/update-coverImage").patch(verifyJWT,upload.single("coverImage"),userUpdateCoverImage)

router.route("/c/:username").get(verifyJWT,userChannelDetailsAdder)

router.route("watch-history").get(verifyJWT,userwatchHistory)



export default router;