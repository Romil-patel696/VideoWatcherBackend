import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
export const verifyJWT=asyncHandler(async(req, res, next)=>{
    // check if user is true login the add a object req.user
    //  to check useing AT and RT in user cookies.
    try {
        const token=    req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        // ^ req.cookies may not be avaliabel on mobile , mobile send headers(method) , haev a key Authorization : Bearer <token>.
    
        if(!token){
            throw new ApiError(401, "Unauthorized Request ")
        }
        // now verify token , token is a string which is a encrypted or encoded form of dat athat we set in while generating it , and also used a secret key, so while decoding user teh key adn decode info(see in user mmodel genAT.)
        //// {
        ////     _id : this._id, 
        ////     email : this.email,
        ////     username : this.username,
        ////     fullName : this.fullName
        //// },
        //// process.env.ACCESS_TOKEN_SECRET,
        //// {
        ////     expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        //// }
        // // ^ this is the dat aised while creating AT
    
        const decodedToken=jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        // decoded token will have 
       const user= await User.findById(decodedToken?._id).select("-password -refreshToken")
    
       if(!user){
        throw new ApiError(401, "Invalid Access Token");
       }
        //  add a user object to req.
       req.user=user;
       next()
    } catch (error) {
        throw new ApiError(401, error?.message ||"Invalid  access token")
    }


})