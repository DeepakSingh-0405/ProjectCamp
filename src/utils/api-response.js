// This class is used to standardize the API response format across the application.
//the frontend can expect a consistent structure for all API responses, making it easier to handle success and error cases uniformly.

class ApiResponse{
    constructor(statusCode, data, message = "Success"){
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }
}
export {ApiResponse};