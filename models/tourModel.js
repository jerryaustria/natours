const mongoose = require('mongoose');
const { doc } = require('prettier');
const slugify = require('slugify');
const validator = require('validator');

// const User = require('./userModel'); //we can comment this out when using referecing;  please look for guides fields

const tourSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'A tour must have a name'],
        unique:true,
        trim:true,
        maxLength:[40, 'A tour name must have less or equal than 40 characters'],
        minLength:[10, 'A tour name must have more or equal than 10 characters'],
        // validate:[validator.isAlpha,'Tour name must only contain characters'],
    },
    slug:String,
    price:{
        type:Number,
        required:[true, 'A tour must have a price']
    },
    priceDiscount:{
        type:Number,
        validate: {
            validator:function(val){
                // this only points to current doc on NEW document creation
                //  get validators in github ex. validator.js
                // npm i validator

                return val < this.price;
            },
            message:'Discount price ({VALUE}) should be below regular price'
        }
        
        
    },
    difficulty:{
        type:String,
        required:[true, 'A tour must have a difficulty'],
        enum:{ //enumarator
            values:['easy','medium','difficult'],
            message:'Difficulty is either: easy, medium, difficult'
        }
    },
    duration:{
        type:Number,
        required:[true, 'A tour must have a duration']
    },
    maxGroupSize:{
        type:Number,
        required:[true, 'A tour must have a group size']
    },
    rating:{
        type:Number,
        default:4.5
    },
    ratingsAverage:{
        type:Number,
        default:4.5,
        min:[1, 'Rating must be above 1.0'], //min and max validation can also use in dates
        max:[5, 'Rating must be below 5.0'],
        set:val => Math.round(val * 10) / 10 // the (val * 10) math round result is 4.6666 = 5 and we multiple to 10 to become 46.666 then devide to 10 again will result to 4.7
    },
    ratingsQuantity:{
        type:Number,
        default:0
    },
    summary:{
        type:String,
        trim:true,
        required:[true,'A tour must have a summary']
    },
    description:{
        type:String,
        trim:true,
        // required:[true,'A tour must have a description']
    },
    imageCover:{
        type:String,
        trim:true,
        required:[true,'A tour must have a cover photo']
    },
    images:[String],
    createdAt:{
        type:Date,
        default:Date.now()
        // if you dont want to selec tthe date on the query
        // select:false
    },
    startDates:[Date],
    secretTour:{
        type:Boolean,
        default:false
    },
    startLocation:{
        //GeoJSON
        type:{
            type:String,
            default:'Point',
            enum:['Point']
        },
        coordinates:[Number],
        address:String,
        description:String
    },
    locations:[
        {
            type:{
                type:String,
                default:'Point',
                enum:['Point']
            },
            coordinates:[Number],
            address:String,
            description:String,
            day:Number
        }
    ],
    //Embedding 
    // guides:Array

    //referencing
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
    //Populating tour Guides
    // in order to actually get access to the referenced
    // tour guides whenever we query for a certain tour.
    
    
},{
    toJSON:{virtuals:true},
    toJbject:{virtuals:true},
});

// tourSchema.index({price: 1});
tourSchema.index({price: 1, ratingsAverage: -1}); // 1 is ascending order, -1 is adiscending order
tourSchema.index({slug:1});
// tourSchema.index({startLocation:'2dsphere'});


// virtual property
tourSchema.virtual('durationWeeks').get(function(){
    return this.duration / 7;
});

//virtual populate
tourSchema.virtual('reviews', {
    ref: 'Review', //name of the model
    foreignField: 'tour', // look for the reviewModel.js field
    localField: '_id' // id of this model
});

//document middleware: runs Before save() and.create() 
tourSchema.pre('save',function(next){
    this.slug = slugify(this.name,{lower:true});
    next();
});

//embedding the tour guides example; resposing for performing embedding
// tourSchema.pre('save',async function(next){
//     const guidesPromises = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromises);
//     next();
// });

// tourSchema.pre('save',function(next){
//     console.log('Will save Document....');
//     next();
// });

// tourSchema.post('save',function(doc, next){
//     console.log(doc);
//     next();
// });

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function(next){
// tourSchema.pre('find', function(next){

    // let make a clock to measure how long it takes to execute the current query.
    // Simply set a property onto this object
    // because this query object is really just a regular object.

    this.start = Date.now();

    this.find({secretTour:{$ne:true}})
    next();
});

tourSchema.pre(/^find/, function(next){
    this.populate({
        path:'guides',
        select: '-__v -passwordChangedAt'
    });
    next();
})

// this middleware is gonna run after the query is already executed, 
// therefore it cannot acccess to the documents that will return, 
// because that query has already finished at this point
tourSchema.post(/^find/, function(docs, next){
    // console.log(`Query took ${Date.now() - this.start} milliseconds`);

    next();
});

// AGGREGATION MIDDLEWARE
// Aggregation Middleware allows us to add hooks before or after an aggregation happens

// tourSchema.pre('aggregate', function(next){
//     this.pipeline().unshift({ $match: {secretTour: {$ne:true}} });
    
// next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

//there are 4 types of middleware in mongoose
//1. document, 2. query, 3. aggregate, 4. model middleware
//use or install slugify package ex: npm i slugify