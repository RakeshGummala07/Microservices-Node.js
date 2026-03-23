require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');

const postRoutes = require('./routes/post-routes.js');
const errorHandler = require('./middleware/errorHandler.js');
const logger = require('./utils/logger.js');
const { connectRabbitMQ } = require('./utils/rabbitmq.js');

const app = express();
const PORT = process.env.PORT || 3002;


// ---------------- MongoDB Connection ----------------
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info("Connected to MongoDB"))
  .catch((err) => logger.error("MongoDB connection error", err));


// ---------------- Redis Connection ----------------
const redisClient = new Redis(process.env.REDIS_URL);

redisClient.on('connect', () => {
  logger.info("Connected to Redis");
});

redisClient.on('error', (err) => {
  logger.error("Redis error", err);
});


// ---------------- Global Middleware ----------------
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ---------------- Logging Middleware ----------------
app.use((req, res, next) => {

  logger.info(`${req.method} ${req.url}`);

  if (req.method !== "GET") {
    logger.info(`Request Body: ${JSON.stringify(req.body)}`);
  }

  next();
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
app.use('/api/posts/create-post', endPoints);


// ---------------- Routes ----------------
app.use('/api/posts', (req, res, next) => {
  req.redisClient = redisClient;
  next();
}, postRoutes);


// ---------------- Error Handler ----------------
app.use(errorHandler);


async function startServer(){
  try{
    await connectRabbitMQ();
    app.listen(PORT, () => {
      logger.info(`Post service running on port ${PORT}`);
    });
  }catch(e){
    logger.error('Failed to connect to server');
    process.exit(1)
  }
}

// ---------------- Start Server ----------------
startServer()

// ---------------- Unhandled Rejection ----------------
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});