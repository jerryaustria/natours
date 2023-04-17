const express = require('express');
const authController = require('../controllers/authController');

const ploterController = require('../controllers/ploterController');


const router = express.Router();

router.post('/lot',ploterController.login);