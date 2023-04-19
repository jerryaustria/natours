const mongoose = require('mongoose');

const dotenv = require('dotenv');
//DotEnv is a lightweight npm package that automatically loads environment variables 
//from a . env file into the process. env object

process.on('uncaughtException', err=>{
    console.log('UNCAUGHT EXCEPTION');
   // console.log(err);
    process.exit(1);
    // console.log(err.name, err.message);
    
})

dotenv.config({path: './config.env'});

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>',process.env.DATABSE_PASSWORD);

mongoose.set('strictQuery',false);
mongoose.connect(DB,{
    useNewUrlParser:true,
    // useCreateIndex:true,
    // useFindAndModify:false,
    useUnifiedTopology: true
}).then(() => console.log('DB Connection Successful'));


const port = process.env.PORT || 3000;
const server = app.listen(port,()=>{
    console.log(`Youre running at port ${port}...`);
} )

process.on('unhandledRejection', err=>{
    console.log('UNHANDLE REJECTION');
    //console.log(err);
    server.close(()=>{
        process.exit(1);
    }) 
})

process.on('SIGNMA',()=>{
    console.log('SIGMA RECEIVED. Shutting down gracefully');
    server.close(()=>{
        console.log('Process terminated!');
    });
})
