//this class is used to create a custom error object that can be thrown in the application. It extends the built-in Error class and adds additional properties such as statusCode, data, message, success, and errors. The constructor takes in these properties and assigns them to the instance of the ApiError class. If a stack trace is provided, it will be used; otherwise, the default stack trace will be captured.
//it is the standardization of the api error for the frontend to handle the error uniformly across the application. The frontend can expect a consistent structure for all API errors, making it easier to handle error cases uniformly.

class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message);
        this.statusCode = statusCode
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if(stack){
            this.stack = stack;
        }else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
export {ApiError};