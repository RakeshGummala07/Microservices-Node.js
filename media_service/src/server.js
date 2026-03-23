require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');
const mediaRoutes = require("./routes/media-routes.js");
const logger = require('./utils/logger.js');
const errorHandler = require('./middleware/errorHandler.js');
const { connectRabbitMQ, consumeEvent } = require('./utils/rabbitmq.js');
const handlePostDelete = require('./eventHandlers/media-event-handler.js');

const app = express();
const PORT = process.env.PORT || 3003;

// ---------------- Redis Connection ----------------
const redisClient = new Redis(process.env.REDIS_URL);

redisClient.on('connect', () => {
  logger.info("Connected to Redis");
});

redisClient.on('error', (err) => {
  logger.error("Redis error", err);
});

// ---------------- MongoDB ----------------
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info("Connected to MongoDB"))
  .catch((e) => logger.error('Mongo connection error', e));

// ---------------- Middlewares ----------------
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
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
  }),
});

// Apply rate limit
app.use('/api/media/upload', endPoints);

// ---------------- Routes ----------------
app.use('/api/media', mediaRoutes);

// ---------------- Error Handler ----------------
app.use(errorHandler);

// ---------------- Server ----------------
async function startServer(){
  try{
    await connectRabbitMQ();

    //Consume all the events
    await consumeEvent('post.deleted', handlePostDelete)
    app.listen(PORT, () => {
        logger.info(`Media service running on port ${PORT}`);
    });
  }catch(e){
    logger.error("Failed to connect to server", e);
    process.exit(1);
  }
}

startServer();

// ---------------- Unhandled Rejection ----------------
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});