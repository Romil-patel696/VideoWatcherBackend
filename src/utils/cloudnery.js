import { v2 as cloudinary } from 'cloudinary';
import { response } from 'express';
import fs from "fs";
// Configuration
cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key:  process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePateh)=>{
        try{
            if(!localFilePateh) return null
            const response = await cloudinary.uploader.upload(localFilePateh, {
                resource_type : "auto"
            })
            // file has been uploaded sucessfully
            console.log("file is uploaded on cloudnery  sucessfully", response.url)
            console.log()
            return response;
        }catch(error){
            fs.unlink(localFilePateh)  // remove the locally saved temporary file as teh uploade operation got failed 
            return null;
            
        }
}
    
export {uploadOnCloudinary};    