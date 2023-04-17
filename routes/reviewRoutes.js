const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController'); 

const router = express.Router({mergeParams:true}); // (nested routes with Express -  from Annex A (tourRoutes.js))
                                //all we need to to is to set mergeParams to true
                                // why we need this? because by default each router only have access tothe 
                                // parameters of their specific routes,

router.use(authController.protect); //this mean no one can access except authenticated

router.route('/')
    .get(reviewController.getAllReviews)
    .post(
        // authController.protect,  // we remove this because we have router.use(authController.protect)
        authController.restrictTo('user'),
        reviewController.setTourUserIds, //middleware function
        reviewController.createReview
        );
        
router.route('/:id')
    .get(reviewController.getReview)
    .patch(
        authController.restrictTo('user','admin'),
        reviewController.updateReview
        )
    .delete(
        authController.restrictTo('user','admin'),
        reviewController.deleteReview
        );

module.exports = router;