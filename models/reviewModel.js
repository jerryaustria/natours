const mongoose = require('mongoose');
const { doc } = require('prettier');
const slugify = require('slugify');
const validator = require('validator');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
    review:{
        type:String,
        required: [true, 'Review can not be empty'],
    },
    rating:{
        type:Number,
        min:1,
        max:5
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    tour:{
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required:[true,'Review must belong to a tour.']
    },
    user:{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required:[true,'Review must belong to a user.']
    }


},
{
    toJSON:{virtuals:true},
    toJbject:{virtuals:true},
});

reviewSchema.index({tour: 1, user: 1},{ unique:true});

reviewSchema.pre(/^find/, function(next){
    // this.populate({
    //     path:'tour',
    //     select: 'name'
    // }).populate({
    //     path:'user',
    //     select: 'name photo'
    // });
    // next();
    this.populate({
        path:'user',
        select: 'name photo'
    });
    next();
});

reviewSchema.statics.calAverageRatings = async function(tourId){
    // What is the Aggregation Framework? The aggregation framework allows you to analyze your data in real time. 
    // Using the framework, you can create an aggregation pipeline that consists of one or more stages. 
    // Each stage transforms the documents and passes the output to the next stage
    const stats = await this.aggregate([ 
        {
            $match: {tour: tourId}
        },
        {
            $group:{
                _id:'$tour',
                nRating:{$sum:1},
                avgRating:{$avg:'$rating'}
            }
        }
    ]);

    // console.log(stats);
    
    if(stats.length > 0){
        await Tour.findByIdAndUpdate(tourId,{
            ratingsQuantity:stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        });
    }else{
        await Tour.findByIdAndUpdate(tourId,{
            ratingsQuantity:0,
            ratingsAverage: 4.5
        });
    }
};

reviewSchema.post('save',function(){

    // PRORBLEM: how we can access the Review model if the Review iis not yet processed

    // Review.calAverageRatings(this.tour); instead of this use
    this.constructor.calAverageRatings(this.tour);

});

reviewSchema.pre(/^findOneAnd/,async function(next){
    this.r = await this.findOne().clone();
    // console.log(this.r);
    next();
});


reviewSchema.post(/^findOneAnd/, async function(){
    // this.r = await this.findOne(); doe not work here, query has already executed
    await this.r.constructor.calAverageRatings(this.r.tour); //since this is a static method and so we need to call it on the model
});



const Review = mongoose.model('Review', reviewSchema); // Review model

module.exports = Review;