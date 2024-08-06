import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudnery.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessTokenAndRefreshToken=async(userId)=>{
    //  methode, as we have logied in we have access to user id , 
    try{

        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        //  generated not saved in DB so add
        user.refreshToken=refreshToken;
        // we haev set a value at  refreshToken as refreshtoken, now need to saev that data
        // user.save() //when we run this so mongoose models kick in ==> check password  adn other fields as if we are saving a nw object but we are updating a variable or property value only => no need to validate .
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    }catch(error){
        throw new ApiError(500, "something went wrong while generating tokens")
    }

}

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
            $or: [{username}, {email}]
        })
        if(existedUser){
            throw new ApiError(409, "User with email and username exists.")
        }
    // check avatar and manage uploade. as we haev middleware in between of multer so it will add more fields in req.body ... bcz we use multer so we have acces of "req.files"

        const avatarLocalPath=req.files?.avatar[0]?.path;
        // const coverImageLocalPath=req.files?.coverImage[0]?.path;  // we will do it down as a classic check 
        // ^ we get the path of these files(PATH MEANS BCZ MULTER TAKE FILES FROM DEVISE AND PUT IT ON LOCAL STORAGE THEN UPLOADE ON CLOUDNERY , THE PATH WHERE IMAGES ARE STORED ON OUR SERVER IS NEEDED EX. /PUBLIC/TEMO), now check if avatart is present or not , bcz it is important.


        let coverImageLocalPath;
        if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
            coverImageLocalPath=req.files.coverImage[0].path;
        }


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
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
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


const loginUser=asyncHandler( async(req, res)=>{
            // steps....
            // req body => data
            // how to login user Username or Email
            // find the user 
            //  1. exist if  NOT > not exist singup
            //password check > false > wrong password 
            // true > do >> generate ACCESSTOKE AND REFRESH TOKEN .  as user SIGNUP/ REGISTER we create its AC and RT and _id   
            //  send tokens useing secure  cookie
            

            //  implementation
            const {email, username, password}=req.body;
            //  using what to login
            if(!username || !email){
                if(!username && !email){

                    throw new ApiError(400, "username or password is required")
                }
            }

            //  find user for both email or username , use User db models 
            // User.findOne({email}) or User.findOne({email}) 
            //  best is 
           const user= await User.findOne({
                $or : [{username}, {email}]
            }) 
            if(!user){
                throw new ApiError(404, "user does not exist")
            }

            // user exist check password .. we have a method isPasswordCorrect in user.model
            // access that usomh user not User bcz User is  onject of Mongoose, where as user is a object of Schema
            const isPasswordValid=await user.isPasswordCorrect(password)
            if(!isPasswordValid) {
                throw new ApiError(401, "Password Incorrect")
            }
            // generate AC AND RT using methode 
            const {accessToken, refreshToken}=await generateAccessTokenAndRefreshToken(user._id)
            // send using cookies
            // IMP THE USER HERE IS NOT REFRESHED SO IT DONT HAVE RT AND AC VALUES EVEN THOUGH METHOD ^ HAVE SET IT 
            // WE HAEV TWO METHODE OEN UPDATE TEH USER OBJECT OR REFRESH OR REFETCH OBJ, DEPENDS ON EXPENSE OF OPERATION
            // DONT SELECT PASSWORD AND REFRESHTOKEN .....................LOOK SELECT METHODE -NOTTOSELECT
            const loggedInUser=await User.findById(user._id).select("-password -refreshToken");

            // cookies , when sending cookies => desing a option a object in cookies., secure true means only server can modifie it not user or client
            const options = {
                httpOnly:  true,
                secure: true
            }
            return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                     200,
                     {user: loggedInUser, accessToken, refreshToken},
                     "user logged in sucessfully "
                )
            )
})


const logoutUser=asyncHandler(async(req, res)=>{
    //  logout how 1. cleare cookies from user , 2. Reset Refreshtoken adn AT
    //  to remove RT AT from model object we need to find it using its id _id, but we dont have access to used data or object ==> 
        // User.findById(....), use middleware ==> when logout , get data in between set id =_id to logout and used that id to remove RT and At
        //  from object . req res aree just obj , 
        // create a middleware which give acess 
        // DONE WE WILL COME HERE ONLY WHE verifyJWT a authentication methhode extecuted sucessfully, AND ALSO IT ADD A NEW FIELD TO REQ , NOU USE THAT AND GET THE DATA .
         await User.findByIdAndUpdate(req.user._id, 
            {
                $set: {
                    refreshToken: undefined
                }
            },
            {
                new:true
            }
        )
        // refreshToken  removed 
        // now cookies

        const options = {
            httpOnly:  true,
            secure: true
        }
        
        return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out "))
        


})

const refreshAcessToken=asyncHandler(async(req, res)=>{
    // to get a new AT needed a RT so take from Cookies or body if mobile
    try {
        const incommingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
        if(!incommingRefreshToken){
            throw new ApiError(401, "unothorized request")
        }
    
            //  we haev a RT in DB and onen sended by user in req.
            // we need real db RT
            const decodedToken=jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
            // see the decoded form in model.js
            // get teh id
           const user=await User.findById(decodedToken?._id)
    
           if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
           }
    
        //    match the both RF
        if(incommingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        } 
    
        //  now generate new AT  bcz checked, and send to user in cookies
        const options = {
            httpOnly:  true,
            secure: true
        }
    
        const {accessToken, newRefreshToken}=await generateAccessTokenAndRefreshToken(user._id)
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, 
                {accessToken, refreshToken: newRefreshToken},
                "accessToken Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh Token")
        
    }

})

const changeCurrentPassword=asyncHandler(async(req, res)=>{
    // if user is able to change pasword this means he is logged in , so he has data in his cookies, and in its data a user object is there 
//  GET fields from user 
    const {oldPassword, newPassword}= req.body
    // find user fromm user through id 
    const user=await User.findById(req.user?._id)
    // check if the oldpassword given by user  is correct
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
    
    if(!isPasswordCorrect){
        throw new ApiError(400, "invalid password")
    }
    // set the password 
    user.password=newPassword
    // save it 
    await user.save({validateBeforeSave: false})

    return res.status(200)
    .json(new ApiResponse(200, {}, "Password changed sucessfuly"))


})


const getCurrentUser=asyncHandler(async(req, res)=>{
    return res.
    status(200).json(200, req.user, "current user fetched sucessfully ")
})

const updateAccountDetails=asyncHandler(async(req, res)=>{
    const {fullName, email}=req.body
    if(!fullName || !email){
        throw new ApiError(400 , "All fields are required ")
    }

  const user=  User.findByIdAndUpdate(
        req.user?._id,
        {
            $set :{
                fullName: fullName,
                email: email
            }
        }, 
        {new: true}
    ).select("-password")

    return res.status(200).json(new ApiError(200, user, "account updated sucessfully"))


})

const updaetUserAvatar= asyncHandler( async(req, res)=>{
    // file not files bcz only one file , previsouly we haev used files and fields bcz multiple file 
    // uplodad on local using multer
    const avatarLocalpath=req.file?.path
    if(!avatarLocalpath){
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar=await uploadOnCloudinary(avatarLocalpath)

    if(!avatar.url){
        throw new ApiError(400, "error while uploading on cloudnery")
    }

    //  now updaet the data in user obj, of avatar url

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar:avatar.url
            }
        }, 
        {new: true}
    ).select("-password")

    return res.status(200).json(
        new ApiResponse(200, user, "avatar updated sucessfully")
    )
})
const updaetUserCoverImage= asyncHandler( async(req, res)=>{
    // file not files bcz only one file , previsouly we haev used files and fields bcz multiple file 
    // uplodad on local using multer
    const coverImageLocalpath=req.file?.path
    if(!coverImageLocalpath){
        throw new ApiError(400, "coverImage file is missing")
    }

    const coverImage=await uploadOnCloudinary(coverImageLocalpath)

    if(!coverImage.url){
        throw new ApiError(400, "error while uploading on cloudnery")
    }

    //  now updaet the data in user obj, of avatar url

   const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage:coverImage.url
            }
        }, 
        {new: true}
    ).select("-password")
    
    return res.status(200).json(
        new ApiResponse(200, user, "Cover image updated sucessfully")
    )

})

export {registerUser, loginUser, logoutUser, refreshAcessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updaetUserAvatar, updaetUserCoverImage};