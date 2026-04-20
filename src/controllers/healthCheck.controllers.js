import { ApiResponse } from "../utils/api-response.js";
// This controller is responsible for handling health check requests. It provides a simple endpoint to verify that the server is running and responsive.

/*
const healthCheck = (req,res,next)=>{
    try {
        res.status(200).json(
            new ApiResponse(200,{message: "server is running!"})
        )
    } catch (error) {
        next(error) //built in error handler of express will handle this error and send a response to the client.
    }
}
*/

//we can also write the above code using asyncHandler utility function to handle errors in a cleaner way without try-catch block.

import { asyncHandler } from "../utils/async-handler.js";
const healthCheck = asyncHandler((req, res, next) => {
    res.status(200).json(
        new ApiResponse(200, {message: "server is running"})
    )
})

export {healthCheck};