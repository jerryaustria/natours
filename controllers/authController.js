const crypto = require('crypto');
const {promisify} = require('util'); // {} using ES6 Desctructuring
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = id => {
    return  jwt.sign({id}, process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, res) =>{
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
            ),
        httpOnly:true
    };
    
    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt',token,cookieOptions);

    //remove the password from the output

    user.password = undefined;

    res.status(statusCode).json({
        status:'Success',
        token,
        data:{
            data:user
        }
    });
}

exports.signup = catchAsync(async(req,res)=>{
    const newUser = await  User.create(req.body);

    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();
    //or 
    // const newUser1 = await  User.create({
    //     name:req.body.name,
    //     email:req.body.email,
    //     password:req.body.password,
    //     passwordConfirm:req.body.passwordConfirm
    // });

    createSendToken(newUser, 201, res);

});

exports.logout = (req, res) =>{
    res.cookie('jwt', 'loggedout',{
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly:true 
    });
    res.status(200).json({
        status:'success'
    });
}

exports.login = catchAsync(async (req, res, next) =>{
    const {email, password} = req.body;  //or const email = req.body.email; const email = req.body.password; 
    
    // 1) check if email and password exist
        if(!email || !password){
           return next(new AppError('Please provide email and password', 400));
        }

    // 2) check if the user exists and password is correct
    // const user = User.findOne({email: email}) email field is equal to email (field email and the variable is also a email)
     //in ES6 we can abbreviate that simply as this const user = User.findOne({email})
     //we do need a passsword in order to check if it is correct, need to explicity select it as well

        const user = await User.findOne({email}).select('+password')
        
    // how to compare password with bcyrpt password? ans: create a instanec method in the model usermodel
    //an instance methos is basically a method that is gonna be available on all documents of a certain collection
    // look in userModel.js

        

        if(!user || !(await user.correctPassword(password, user.password))){
            return next(new AppError('Incorrect email or password', 401)); //401 is unauthorize
        }

    // 3) if everything ok, send token to client
    createSendToken(user, 200, res);
});


// nly for rendered pages, no errors
exports.isLoggedIn = async(req,res,next)=>{

    if(req.cookies.jwt){
       try {

        //1. Verification token
        const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET)
    
        //2. Cehck if User Still exists
        const currentUser = await User.findById(decoded.id);
        if(!currentUser){
            return next();
        }

        //3. Check if user changed password after the token (JWT) was issued
        //in user model, we already implemented this correctPassword static instance method (userSchema.methods.correctPassword)
        // so lets now create another one in user model
        if(currentUser.changedPaswordAfter(decoded.iat)){
            return next();
        }
        
        //Grant access to protected rooute
        //There is a logged in user
        // each and every PUG template will have access to response res.locals and whatever we put there will then ba e variable inside of theses templates
        res.locals.user  = currentUser;
        return next();
        
       } catch (error) {
        return next();
       }
        
    }
    next();
    //** the common practice is to send a token using an http header with the request: this is how to set a headers in Postman */
    //and also how we can get access to these headers in Express: first go to middleware in app.js
};

exports.protect = catchAsync(async(req,res,next)=>{
    // 1. Getting token and check of it's there
    let token;
        if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
            token = req.headers.authorization.split(' ')[1];
        }else if(req.cookies.jwt){
            token = req.cookies.jwt;
        }
       
        if(!token) return next(new AppError('You are not logged in! Plase log in to get access',401));
        
    //2. Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    console.log(decoded);
    //promisifying function, to make it return a promise so thay way 
    // we can then use async await just like any other async function that we've been using
    //in order to do that Node actually has a built-in promisify function.
    //all we need to do in order to use it is to require the built-in util module ex. const util = require('util')
    // but since we're only going to use that one method we can actually do it easier instead of doing this const util = require('util')
    //we can simply destcuture that object and take promisify directly from there const { promisify } = require('util').

    // promisify(jwt.verify) is a function that we need to call wchic will then return a promise.
    // (token, process.env.JWT_SECRET) so then here, we acrtually call the function and this will then return a promise
    //and so we can await it and store the result into a variable.  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

    //3. Cehck if User Still exists
        const currentUser = await User.findById(decoded.id);
        if(!currentUser){
            return next(new AppError(
                'The user belonging to this token does no longer exist.', 401
            ))
        }

    //4. Check if user changed password after the token (JWT) was issued
        //in user model, we already implemented this correctPassword static instance method (userSchema.methods.correctPassword)
        // so lets now create another one in user model
        if(currentUser.changedPaswordAfter(decoded.iat)){
            return next(new AppError('User recently changed password! Please log in again.',401))
        }

//Grant access to protected rooute
//put the entire user data on the request 
// req.user = freshUser;
    req.user = currentUser;
    res.locals.user  = currentUser;
    next();

    //** the common practice is to send a token using an http header with the request: this is how to set a headers in Postman */
    //and also how we can get access to these headers in Express: first go to middleware in app.js
});


//Restric certain routes
//for example deleting tours

exports.restrictTo = (...roles) =>{ 
    // since we cannot pass arguments into a middleware function, 
    //we need a way to basically passing in arguments by creating a wrapper funcion which will then return the
    //middleware function that we actually want to create
    //use the rest parameter syntax, new in ES6 (...roles), and this will then create an array of all the arguments that were specified

    return (req, res, next)=>{ 
        // this function will then basically get access to this roles parameter (...roles) because there is a closure
        // roles is an array for ex. ['admin','lead-guide']. 
        // when will we give a user access to a certain route? When its user role is inside of this roles array that we passed in ['admin','lead-guide'].
        //if user role is a user. and not on the array, then user does not have permission

        if(!roles.includes(req.user.role)){  //includes is a javascript available on all arrays
            //where is the role of the current user stored? is in the return of  exports.protect (req.user = freshUser;)
            // we store the current user in request.user and remember the protect middleware always run before restrictTo
            //.delete(
                    //authController.protect, 
                    //authController.restrictTo('admin','lead-guide'), 
                    //tourController.deleteTour
                //);
            return next(new AppError('You do not have permission to perform this action', 403))
        }
        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) =>{

    //1. Get user based on posted email
    const user = await User.findOne({email: req.body.email})

    if(!user){
        return next(new AppError('There is no user with email address', 404));
    }

    //2. Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});
    
    //3. Send it to user's email
    const resetURL  = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    try{

        await new Email(user, resetURL).sendPasswordReset();
    }catch(err){
        console.log(err);
        user.createPasswordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});

        return next(new AppError('There was an error sending the email. Try again later!'),500);
    }

    res.status(200).json({
        status:'Success',
        message:'Token sent to email'
    })
});

exports.resetPassword = catchAsync(async (req, res, next) =>{
    // 1) Get user based on the token
    
            const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

            const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gt:Date.now()}});
            
    // 2) If token has not expired, and there is user, set the new password
            if(!user){
                return next(new AppError('Token is invalid or has expired'),400);
            }
            user.password = req.body.password;
            user.passwordConfirm = req.body.passwordConfirm;
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();
    // 3) Update changedPasswordAt property for the user

    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);
    
});

exports.updatePassword = catchAsync(async(req, res, next)=>{
    //1. Get user from collection
    const user = await User.findById(req.user.id).select('+password');
        console.log(user);
    //2. Check if posted current password is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
        return next (new AppError('You current password is wrong.', 401));
    }
    //3. if SourceBuffer, uodate password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    //4. Log user in, send JWT
    createSendToken(user, 200, res);


});




//instal json web token: ex:. npm i jsonwebtoken
//for usersignin and signup

