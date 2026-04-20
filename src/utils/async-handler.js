const asyncHandler = (requestHandler)=>{
    return (req,res,next)=>{
        Promise
        .resolve(requestHandler(req,res,next))
        .catch(error=>next(error))
    }
}
export {asyncHandler};

// This utility function, asyncHandler, is designed to wrap asynchronous request handlers in an Express application. It ensures that any errors thrown within the asynchronous code are properly caught and passed to the next middleware (which is typically an error handler). This helps to prevent unhandled promise rejections and allows for cleaner error handling in the application.