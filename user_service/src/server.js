require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const logger = require("./utils/logger.js");
const helmet = require('helmet');
const cors = require('cors');
const {RateLimiterRedis} =require('rate-limiter-flexible');
const Redis = require('ioredis');
const {rateLimit} = require('express-rate-limit');
const {RedisStore} = require('rate-limit-redis');
const routes = require('./routes/user-service.js');
const errorHandler = require('./middleware/errorHandler.js');


const app = express();
const PORT = process.env.PORT || 3001;

mongoose.connect(process.env.MONGODB_URI)
    .then(()=> logger.info('Connected to MongoDb'))
    .catch(e => logger.error('Mongo connection error', e))


const redisClient = new Redis(process.env.REDIS_URL);

//Global Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());

app.use((req, res, next)=>{
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body ${req.body}`);
    next();
});



//DDos protection and rate limiting
const rateLimiter = new RateLimiterRedis({
    storeClient : redisClient,
    keyPrefix : 'middleware',
    points : 10,
    duration : 60
})


app.use((req, res, next)=>{
    rateLimiter.consume(req.ip)
    .then(()=> next())
    .catch((err)=>{
        logger.warn(`Rate limit exceeded for IP : ${req.ip}`);
        res.status(429).json({
            success : false,
            message : 'Too many requests'
        })
    })
})

//Ip based rate limiting forsensitive end points
const endPoints = rateLimit({
    windowMs : 15 * 60 * 1000,
    max : 50,
    standardHeaders : true,
    legacyHeaders : false,
    handler : (req, res) => {
        logger.warn(`Sensitive endpoint ratelimit exceeded for IP : ${req.ip}`);
        res.status(429).json({
            success : false,
            message : 'Too many requests'
        })
    },
    store : new RedisStore({
        sendCommand : (...args) => redisClient.call(...args),
    }),
});


app.use('/api/auth/register', endPoints);


//Routes
app.use('/api/auth', routes);

//Error Handler
app.use(errorHandler);


app.listen(PORT, ()=>{
    logger.info(`User service is running on port ${PORT}`);
});


//unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at ${promise} reason : ${reason}`);
})