//////// this is of promise type 

const asyncHandler = (requestHandler)=>{
     
    (req, res, next)=>{
        Promise.resolve(requestHandler(req, res, next)).catch((err)=>{next(err)})
    }

return 
}


export {asyncHandler};
// // // THIS IS OF TRY CATCH TYPE
// // const asyncHandler = ()=>{}
// // const asyncHandler = (func)=>{()=>{}}    
// // const asyncHandler = (func)=>()=>{}
// // const asyncHandler = (func)=>async()=>{}
    
// const asyncHandler=(func)=>async (req, res, next)=>{
//     try{
//   await func(req, res, next)
//     }catch(err){
//         res.status(err.code || 500).json({
//             sucess : false,
//             message : err.message
//         })
//     }
// }    