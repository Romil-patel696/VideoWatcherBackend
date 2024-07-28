class ApiResponse {
    constructor(statuseCode, data, message="Success"){
        this.statuseCode=statuseCode
        this.data=data
        this.message=message  
        this.sucess=statuseCode<400
    }
}

export {ApiResponse};