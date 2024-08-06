import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router= Router()

router.route("/register").post(upload.fields([
    {name: "avatar",
        maxCount: 1
    },
    {
        name : "coverImage",
        maxCount: 1
    }
]) , registerUser);
// router.route("/register").post( registerUser);
// router.route("/login").post(loginUser);

router.route("/login").post(loginUser)

// now give access to routes to user only if he is login , check using middleware auth.mi.js.   and use secured routes
// secured routes
router.route("/logout").post(verifyJWT,  logoutUser)
// ^ middleware verifyJWT return or do next(), so move to next ...
export default router;