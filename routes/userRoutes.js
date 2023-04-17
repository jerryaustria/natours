const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');


// const reviewController = require('../controllers/reviewController');



const router = express.Router();

router.post('/signup',authController.signup);
router.post('/login',authController.login);
router.get('/logout',authController.logout);
router.post('/forgotPassword',authController.forgotPassword);
router.patch('/resetPassword/:token',authController.resetPassword);

// Protect all rooutes after this middleware
router.use(authController.protect); // this will do is to protect all the routes that come after this point,
                                    // that's because middleware runs in secquence.
                                    //this means all of the below routes are all middleswares that come ater this one are now protected

router.patch('/updateMyPassword/',
            // authController.protect,  // we remove this beause we do a router.use(authController.protect) on above
            authController.updatePassword);

router.get('/me', 
            // authController.protect,  // we remove this beause we do a router.use(authController.protect
            userController.getMe, 
            userController.getUser);
router.patch('/updateMe', 
            // authController.protect,  // we remove this beause we do a router.use(authController.protect
           userController.uploadUserPhoto,
           userController.resizeUserPhoto,
            userController.updateMe);
router.delete('/deleteMe', 
            authController.protect, // we remove this beause we do a router.use(authController.protect
            userController.deleteMe);

//only admin can delete edit on this
router.use(authController.restrictTo('admin'));

router.route('/')
.get(userController.getAllUsers)
.post(userController.createUser);

router.route('/:id')
.get(userController.getUser)
.patch(userController.updateUser)
.delete(userController.deleteUser);

module.exports = router;