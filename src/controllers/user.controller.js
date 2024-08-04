import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudnery.js"
import {ApiResponse} from "../utils/ApiResponse.js"
const registerUser=asyncHandler(async (req, res)=>{

    //  steps to register user 
    //  1. get user details(name , usernaem , password , email if needed verify it )// take it from frontend or postman.
    // 2.  checkk if user is already exist.(how => check if email is unique and username )
    //  3.  check for images and avatar as we have created our db to have images etc. 
    //  4. uploade the avatar and impage on cloudnery and get the url .
    //  5. create user OBJECT - create entry in DB
    //  6. we will get response as it is and password is encrypted  so give taht to user (remove password and refresh token field from response)
    //  7. check for user creation
    //  8. return res or error 


    //// return res.status(200).json({
    ////     message : "hello romil here"
    ////})

    // get data from user 
    const { fullName, email , username, password }=req.body
    console.log("fullName : ", fullName);
    console.log("email : ", email);
    console.log("usernaem : ", username);
    console.log("password : ", password);
    if([fullName, email, username, password].some((field)=> field?.trim()==="")){
        throw new ApiError(400, "All fields are required")
    }
    //^ some method takes a callback and run it for every element if any return true so stop and give true and if executed.
    
    // to check if user already exist or not, use USER methode to do so , it can takl to mongo db 

    const existedUser= await User.findOne({
        $or : [{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409, "User with email and username exists.")
    }
// check avatar and manage uploade. as we haev middleware in between of multer so it will add more fields in req.body ... bcz we use multer so we have acces of "req.files"

    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;
    // ^ we get the path of these files(PATH MEANS BCZ MULTER TAKE FILES FROM DEVISE AND PUT IT ON LOCAL STORAGE THEN UPLOADE ON CLOUDNERY , THE PATH WHERE IMAGES ARE STORED ON OUR SERVER IS NEEDED EX. /PUBLIC/TEMO), now check if avatart is present or not , bcz it is important.
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }
////upload using "uploadOnCloudinary"
    const avatar =await uploadOnCloudinary(avatarLocalPath)
    const coverImage =await uploadOnCloudinary(coverImageLocalPath)

    //  re check if avatar is present "MEANS IT IS UPLOADED OR NOT BCZ IN SCHEMA IT IS REQUIRED FIELS SO IF NOT THERE THEN DB BREAK"
    if(!avatar){
        throw new ApiError(400, "Avatar file is required") 
    } 

    // now upload url of cloudnery which we get on uploading  and other details// only User talk to Db
   const user= await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    }) 

    //  now check if user is created or not , mongoDb by default add a field "_id" with every field
    // use ".select"  if created , to get the specific data of created user., but it takes a string as input and santaxely we put "-"field what we dont want to select.

    const userCreated =await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!userCreated){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, userCreated, "user data registered sucessfully")
    )
})

export {registerUser};