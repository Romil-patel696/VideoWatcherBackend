// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";


dotenv.config({path : './.env'})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(` server is listening on ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("Mongooes db Connection fails !!! ", err);
})




// import express from "express";
// const app= express()

// IEFEE function

// ;(async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error", (error)=>{
//             console.log("ERROR : ", error);
//             throw error

//         })
//         app.listen(process.env.PORT, ()=>{
//             console.log(`App is listening on port ${process.env.PORT}`);
//         })
//     }
//     catch(error){
//         console.error("ERROR: ", error)
//         throw error
//     }
// })()