const Review = require('../models/reviewModel');
// const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');
const factory = require('./handlerFactory');


exports.getAllReviews  = factory.getAll(Review);

// exports.getAllReviews = catchAsync(async (req, res, next)=>{

//     let filter= {};
//     if (req.params.tourId) filter= {tour: req.params.tourId};

//     const reviews = await Review.find(filter);

//     res.status(200).json({
//         status:'success',
//         results:reviews.length,
//         data:{
//                 reviews
//         }
//     })
// });

exports.setTourUserIds = (req, res, next) =>{
        //allow nested routes
    if(!req.body.tour) req.body.tour = req.params.tourId;
    if(!req.body.user) req.body.user = req.user.id; // we get the req.user.id from the protect middleware
    next();
};

// exports.createReview = catchAsync(async (req,res,next)=>{
//     const newReview = await Review.create(req.body);
//     res.status(202).json({
//         stats: 'success',
//         data:{ 
//             review:newReview
//         }
//     })
// });

exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.createReview = factory.createOne(Review);
exports.getReview = factory.getOne(Review);

//  BUILDING HANDLER FACTORY FUNCTIONS: DELETE
//a factory function is a function that return another function, and in this case our handler function
// so for deleting, for creating, for updating and reading resources
