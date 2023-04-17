class AppError extends Error{
    constructor(message,statusCode){
        super(message); //super is called when you call the parent constractor
        this.statusCode = statusCode;
        this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';  // startsWith is a jvascript function
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}
module.exports = AppError;