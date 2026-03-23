require('dotenv').config()

const express = require('express');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');

const errorHandler = require('./middleware/errorHandler.js');
const logger = require('./utils/logger.js');
const {connectRabbitMQ, consumeEvent} = require('./utils/rabbitmq.js');
const searchRoutes = require('./routes/search-route.js');
const { handlePostCreated, handlePostDeleted } = require('./eventHandler/search-event-handler.js');

const app = express();
const PORT = process.env.PORT || 3004;

mongoose
    .connect(process.env.MONGODB_URI)
    .then(()=>logger.info("Connected t mongodb"))
    .catch((e) => logger.error("Mongo connection error", e));

const redisClient = new Redis(process.env.REDIS_URL);
redisClient.on('connect', () => {
  logger.info("Connected to Redis");
});

redisClient.on('error', (err) => {
  logger.error("Redis error", err);
});

// ---------------- Rate Limiter ----------------
const endPoints = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);

    res.status(429).json({
      success: false,
      message: "Too many requests"
    });
  },

  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  })
});

// Apply rate limit to create-post
app.use('/api/posts/search', endPoints);


//Global Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body ${req.body}`);
    next();
});

//Routes
app.use("/api/search", searchRoutes);


app.use(errorHandler);


async function startServer(){
  try{
    await connectRabbitMQ();

    //consume the events / subscribe to the events
    await consumeEvent('post.created', handlePostCreated);
    await consumeEvent('post.deleted', handlePostDeleted);

    app.listen(PORT, ()=> {
      logger.info(`Searchh servive is running on  ${PORT}`)
    })
  }catch(e){
    logger.error('Failed to start search service');
    process.exit(1);
  }
}

// ---------------- Start Server ----------------
startServer()

// ---------------- Unhandled Rejection ----------------
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});