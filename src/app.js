import express from 'express'
import cors from "cors"
import cookieParser from 'cookie-parser';
import { escape } from 'mysql';
const app=express()

app.use(cors(
    {
        origin : process.env.CORS_ORININ,
         credentials : true
    }
))
// config for json type data inputed ==> apply limit to data input etc
app.use(express.json({limit : "16kb"}))
// for url data to understan , its a encoder 
app.use(express.urlencoded({extended: true, limit : "16kb"}))
//
app.use(express.static("public")) 
app.use(cookieParser())
export {app};