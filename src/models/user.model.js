import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index : true
      // ^optimise searching 
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim:true
    },
    fullName : {
        type : String,
        required : true,
        trim : true,
        index :  true
    },
    avatar : {
        type  : String, //we use cloudinary url 
        required : true,

    },
    coverImage :{
        type : String // cloudeNery
    },
    watchHistory : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Video"
    },
    
    password: {
      type: String, //need to encrypt and decrypt so that if db leaks hacker dont get data .
      required: [true, "password is required"]
    },
    refreshToken : {
        type : String

    }
  },
  { timestamps: true }
);
userSchema.pre("save",  async function(next){
    if(!this.isModified("password")) return next();
    // // ^ if password is modefied then only run the down code either return next.
    this.password=await bcrypt.hash(this.password, 10);
    // ^10 is just a number(can be 8 , etc) which tells how many times loop should run in backend 
    next();
    //^return next() flag always
})
// ^hooks to use bcrypt and jwt as middelware  


// to compair the user given pass and stored encrypted pass we define custoem method here.

userSchema.methods.isPasswordCorrect= async function(password){
    return await bcrypt.compare(password, this.password)
   // ^ return  true or false
}

userSchema.methods.generateAccessToken=function(){
    return jwt.sign({
        _id : this._id, 
        email : this.email,
        username : this.username,
        fullName : this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    }
)
}
userSchema.methods.generateRefreshToken=function(){

    return jwt.sign({
        _id : this._id, 
        email : this.email,
        username : this.username,
        fullName : this.fullName
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

export const User = mongoose.model('User', userSchema);
// ^"users"  db in mongo db ////