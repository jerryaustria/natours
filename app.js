const express = require('express');
const csp = require('express-csp');



//Morgan is an HTTP request level Middleware. 
// It is a great tool that logs the requests along with some 
//other information depending upon its configuration and the preset used
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const AppError = require('./utils/appError');

const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

//sample
// in order to actually get access to the cookies that are in our request
// we need to install a certain middleware npm i cookie-parser, basically this packages will then parse
// all the cookies from the incoming request

const app = express();

app.use(compression());

//npm i pug
app.set('view engine', 'pug');
app.set('views',path.join(__dirname,'views'));
//Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname,'public')));


//1) Global Middleware

    //Feb 16 2023
    //install express rate limit: to limi the numbe rof attaempts in the single ip (npm i express-rate-limit)
    //install npm for security http headers (npm i helmet)

    //set Security HTTP headers
    app.use(helmet()); // Feb 16 2023

    app.use( helmet.contentSecurityPolicy({
          directives: {
            defaultSrc: ["'self'", 'https://*.mapbox.com', 'https://*.stripe.com'],
            baseUri: ["'self'"],
            fontSrc: ["'self'", 'https:', 'data:'],
            imgSrc: ["'self'", 'https://www.gstatic.com'],
            scriptSrc: [
              "'self'",
              'https://*.stripe.com',
              'https://cdnjs.cloudflare.com',
              'https://api.mapbox.com',
              'https://js.stripe.com',
              "'blob'",
            ],
            frameSrc: ["'self'", 'https://*.stripe.com'],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
          },
        })
    )


    


// install express-csp and add the below in app.js


csp.extend(app, {
  policy: {
    directives: {
      'default-src': ['self'],
      'style-src': ['self', 'unsafe-inline', 'https:'],
      'font-src': ['self', 'https://fonts.gstatic.com'],
      'script-src': [
        'self',
        'unsafe-inline',
        'data',
        'blob',
        'https://js.stripe.com',
        'https://*.mapbox.com',
        'https://*.cloudflare.com/',
        'https://bundle.js:8828',
        'ws://localhost:56558/',
      ],
      'worker-src': [
        'self',
        'unsafe-inline',
        'data:',
        'blob:',
        'https://*.stripe.com',
        'https://*.mapbox.com',
        'https://*.cloudflare.com/',
        'https://bundle.js:*',
        'ws://localhost:*/',
      ],
      'frame-src': [
        'self',
        'unsafe-inline',
        'data:',
        'blob:',
        'https://*.stripe.com',
        'https://*.mapbox.com',
        'https://*.cloudflare.com/',
        'https://bundle.js:*',
        'ws://localhost:*/',
      ],
      'img-src': [
        'self',
        'unsafe-inline',
        'data:',
        'blob:',
        'https://*.stripe.com',
        'https://*.mapbox.com',
        'https://*.cloudflare.com/',
        'https://bundle.js:*',
        'ws://localhost:*/',
      ],
      'connect-src': [
        'self',
        'unsafe-inline',
        'data:',
        'blob:',
        // 'wss://<HEROKU-SUBDOMAIN>.herokuapp.com:<PORT>/',
        'https://*.stripe.com',
        'https://*.mapbox.com',
        'https://*.cloudflare.com/',
        'https://bundle.js:*',
        'ws://localhost:*/',
      ],
    },
  },
});



    //Developemnt Login
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
    //console.log('development mode');
}

//limit request from same IP
const limiter = rateLimit({
    max:100,
    windowMs:60 * 60 * 1000,
    message: "Too many request from this IP, please try again in an hour!"
});
app.use('/api',limiter); //Feb 16 2023

//Body Parser, reading data from body into req.body
app.use(express.json({limit: '10kb'})); // parses the data form the body

app.use(cookieParser()); // parses the data from cookies

// form sends data to the server is actually called URL encoded; need this to get the data from inputs
app.use(express.urlencoded({ extended: true, limit: '10kb'})); 
//Feb 16 2023 - Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//Feb16 2023 -  Data sanitization against XSS; Finstall npm i express-mongo-sanitize and npm i xss-clean
app.use(xss());

//Feb16 2023 - install npm i hpp stand for HTTP Parameter pollution (Duplicate Duration of the url)
app.use(hpp({
    whitelistL:['duration','ratingsQuantity','ratingsAverage','maxGroupSize','difficulty','price']

}));



//Test middleware
app.use((req,res, next)=>{
    req.requestTime = new Date().toISOString();
    // console.log(req.headers); // this is ho we can get access to request in headers in Express
    // console.log(req.cookies);
    next();
})


//2. router
app.use('/',viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users',userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);


//ERROR HANDLING

app.all('*',(req,res,next)=>{

    
    // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    // err.status = 'fail';
    // err.statusCode = 404;

    // next(err);
    next(new AppError(`Can't find ${req.originalUrl} on this server!`,404))

}); // in Express we can use app.all that can run for all the verbs, all the HTTP methods
// why did this work? : basically the tourRouter code must run first, so if the route was matched in tourRouter,
// then the request would never even reach the app.all, and so this would not get executed

app.use(globalErrorHandler);

///3. SERVER
module.exports = app;