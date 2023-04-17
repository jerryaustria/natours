//restful APIs should always be stateless
//most widely used alternative to authentication with JWTs is to just store the user's log-in state
// on theserver using sessions.

const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const catchAsync = require('../utils/catchAsync');


//5 fields:  name, email, photo, password, passswordConfirm

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:['true', 'PLease tell us your name']
    },
    email:{
        type:String,
        required:[true,'Please provide youe email'],
        unique:true,
        lowercase:true,
        validate:[validator.isEmail,'Please provide a valid email']
    },
    photo:{
        type: String, 
        default: 'default.jpg'
    },
    role:{
        type:String,
        enum:['user','quide','lead-guide','admin'],
        default:'user'
    }
    ,
    password:{
        type:String,
        required:[true,'Please provide a valid password'],
        minlength:8,
        select:false
    },
    passwordConfirm:{
        type:String,
        required:[true,'Please Confirm you password'],
        validate:{
            //This only works on CREATE and SAVE!
            validator:function(el){
                return el === this.password;
            },
            message: 'Passwords are not the same'

        }
    },
    passwordChangedAt:Date,
    passwordResetToken: String,
    passwordResetExpires:Date,
    active:{
        type:Boolean,
        default:true,
        select:false
    }
    
});

//yoou need to install Bcrypt to encrypt password ex: npm i bcryptjs
userSchema.pre('save', async function(next){

    //Only run this function if password was actually modified
    if(!this.isModified('password')) return next();

    // hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    //delete password Confir, field
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', async function(next){
    if(!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();

});

userSchema.pre(/^find/, function(next){
 // this points to the current query
    this.find({active:{$ne:false}});
    next();
});


//so this global method function will call to compare the password on the database
userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    // this.password  this is not possible because the password field is not visible.. ex. select:false
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changedPaswordAfter = function(JWTTimestamp){
    // we will pass the JWT timestamp, so basically, that timestamp which says
    // when the token was issued. let call JWTTimestamp
    // by default, we will return false from this method
    // that mean the user has not changed his password after the token was issued.
    if(this.passwordChangedAt){

        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000,10);
        //this means that the day or the time (JWTTimestamp) is less than the changed timestamp (changedTimestamp)
        return JWTTimestamp < changedTimestamp;

        // console.log(changedTimestamp, JWTTimestamp);
    }
    //False means NOT changed
    return false;
};

userSchema.methods.createPasswordResetToken = function(){
    //add the built-in cryptp module
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;

}

const User = mongoose.model('User', userSchema);

module.exports = User;