const AppError = require("./../utils/appError");

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`
    return new AppError(message,400);
}

const handleDuplicateFieldsDB = err =>{

    const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
    const message = `Duplicate field value: ${value}, Please use another value!`;
    return new AppError(message, 400);
}

const handleValidationErrorDB = err =>{
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data.  ${errors.join('. ')}`;
    return new AppError(message, 400);
}

const handleJWTError = () => new AppError('Invalid Token. PLease log in again!',401);

const handleJWTExpiredError = () => new AppError('You Token has expired! Please log in again!',401);

const sendErrorDev = (err,req,res)=>{
    //A. API
    if(req.originalUrl.startsWith('/api')){
    
        return res.status(err.statusCode).json({
            status:err.status,
            error:err,
            message:err.message,
            stack:err.stack
        });
    
    }
        // B. Rendered Website
       return res.status(err.statusCode).render('error',{
            title:'Something went wrong!',
            msg: err.message
        })
    
}


const sendErrorProd = (err,req,res)=>{
    //A) API
    if(req.originalUrl.startsWith('/api')){
    //Operational, trusted error: send message to client
    //Operation error is an error that user make: like duplicate name, limited chracter
        if(err.isOperational){
            return res.status(err.statusCode).json({
                status:err.status,
                message:err.message,
            });

        }
        console.error('ERROR ', err);
        return res.status(500).json({
            status:'error',
            message:'Something went wrong - you in PRODUCTION!'
        })
        
    }

        //B) RENDERED Website
        if(err.isOperational){
            return res.status(err.statusCode).render('error',{
                title:'Something went wrong!',
                msg: err.message
            })
        }

            //1 log error
            console.error('ERROR ', err);

            // 2. send a generic message
            return res.status(err.statusCode).render('error',{
                title:'Something went wrong!',
                msg: 'Please try again later.'
            })
}

module.exports = (err,req,res,next)=>{ //by specifying four parameters, Express automatically knows that this entire
    //function is an error handling middleware

    // console.log(err.stack);

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development'){
        sendErrorDev(err,req,res);
    }else if (process.env.NODE_ENV === 'production'){
        let error = { ...err };
        // console.log('Jerry: ' + JSON.stringify(err));
        error.message = err.message
        
        if(err.name === 'CastError')  error = handleCastErrorDB(err);
        if(err.code === 11000) error = handleDuplicateFieldsDB(err);
        if(err.name === 'ValidationError') error = handleValidationErrorDB(err);
        if(err.name === 'JsonWebTokenError') error = handleJWTError();
        if(err.name === 'TokenExpiredError') error = handleJWTExpiredError();
        
            
        sendErrorProd(error,req, res);
    }

    
}