const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController'); 
const reviewRouter = require('../routes/reviewRoutes');
// const reviewController = require('../controllers/reviewController');


const router = express.Router();



//Parameter middleware
// router.param('id',tourController.checkID);

//create a checkbody middleware
//check if body containts the name and price property
//if not, send back 400 (bad request)
// add it to the post handler stack
router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router.route('/monthly-plan/:year').get(authController.protect, 
                                        authController.restrictTo('admin','lead-guide','guide'),
                                        tourController.getMonthlyPlan);

router.route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit')
    .get(tourController.getDistances);

router.route('/')
.get(tourController.getAllTours)
// .post(tourController.checkBody, tourController.createTour);
.post(
    authController.protect, 
    authController.restrictTo('admin','lead-guide'), 
    tourController.createTour
    );

router.route('/:id')
.get(tourController.getTour)
.patch(authController.protect, 
    authController.restrictTo('admin','lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
    )
.delete(
    authController.protect, 
    authController.restrictTo('admin','lead-guide'), 
    tourController.deleteTour
    );
// add middleware on delete authController.protect = to check if user is actually logged in
//second middleware is authController.restrictTo('admin') = pass some user roles


// saying this tour router should use the review router
// in case it ever encounter a route like this
router.use('/:tourId/reviews', reviewRouter);  // there has a problem, this router dont get access to this tour id parameter
                                            // We need to enable the review router to actually get access to this parameter
                                            // on the reviewRoute.js (nested routes with Express - to Annex A)


// router.route('/:tourId/reviews')
// .post(
//     authController.protect, 
//     authController.restrictTo('user'),
//     reviewController.createReview
// )


module.exports = router;