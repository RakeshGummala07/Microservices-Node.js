require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Redis = require('ioredis');
const { RedisStore } = require('rate-limit-redis');
const { rateLimit } = require('express-rate-limit');
const proxy = require('express-http-proxy');
const logger = require('./utils/logger.js');
const errorHandler = require('./middleware/errorHandler.js');
const validateToken = require('./middleware/auth-middleware.js')

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// Redis Client
// =========================
const redisClient = new Redis(process.env.REDIS_URL);

// =========================
// Global Middlewares
// =========================
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// Rate Limiter
// =========================
const ratelimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Sensitive endpoint ratelimit exceeded for IP : ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Too many requests'
        });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
});

app.use(ratelimiter);

// =========================
// Logger Middleware
// =========================
app.use((req, res, next) => {
    logger.info(`Received ${req.method} ${req.url}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
});

// =========================
// Proxy Options
// =========================
const proxyOptions = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, '/api');
    },

    proxyErrorHandler: (err, res) => {
        logger.error(`Proxy error : ${err.message}`);

        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');

        res.end(JSON.stringify({
            success: false,
            message: 'Internal server error',
            error: err.message
        }));
    }
};

// =========================
// User Service Proxy
// =========================
app.use(
    '/v1/auth',
    proxy(process.env.USER_SERVICE_URL, {
        ...proxyOptions,

        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            proxyReqOpts.headers['Content-Type'] = 'application/json';
            return proxyReqOpts;
        },

        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
            logger.info(
                `Response received from User service : ${proxyRes.statusCode}`
            );
            return proxyResData;
        }
    })
);


// Post Service Proxy
app.use(
  '/v1/posts',
  validateToken,
  proxy(process.env.POST_SERVICE_URL, {

    ...proxyOptions,

    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {

      proxyReqOpts.headers['Content-Type'] = 'application/json';
      proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;

      return proxyReqOpts;
    },
    
    proxyReqBodyDecorator: (bodyContent, srcReq) => {

      if (srcReq.body) {
        return JSON.stringify(srcReq.body);
      }

      return bodyContent;
    },

    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {

      logger.info(
        `Response received from Post service : ${proxyRes.statusCode}`
      );

      return proxyResData;
    }

  })
);


// Media Service Proxy
app.use(
  '/v1/media',
  validateToken,
  proxy(process.env.MEDIA_SERVICE_URL, {

    ...proxyOptions,

    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {

        proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
        if(!srcReq.headers['content-type'].startsWith('multipart/form-data')){
            proxyReqOpts.headers["Content-Type"] = "application/json";
        }

      return proxyReqOpts;
    },
    
    proxyReqBodyDecorator: (bodyContent, srcReq) => {

      if (srcReq.body) {
        return JSON.stringify(srcReq.body);
      }

      return bodyContent;
    },

    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {

      logger.info(
        `Response received from Media service : ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
    parseReqBody : false

  })
);


//Search service proxy
app.use(
  '/v1/search',
  validateToken,
  proxy(process.env.SEARCH_SERVICE_URL, {

    ...proxyOptions,

    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {

        proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
        proxyReqOpts.headers["Content-Type"] = "application/json";
        

      return proxyReqOpts;
    },
    
    proxyReqBodyDecorator: (bodyContent, srcReq) => {

      if (srcReq.body) {
        return JSON.stringify(srcReq.body);
      }

      return bodyContent;
    },

    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {

      logger.info(
        `Response received from Search service : ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
    parseReqBody : false

  })
);





// =========================
// Global Error Handler
// =========================
app.use(errorHandler);

// =========================
// Server Start
// =========================
app.listen(PORT, () => {
    logger.info(`API Gateway running on port ${PORT}`);
    logger.info(`User Service URL : ${process.env.USER_SERVICE_URL}`);
    logger.info(`Post Service URL : ${process.env.POST_SERVICE_URL}`);
    logger.info(`Media Service URL : ${process.env.MEDIA_SERVICE_URL}`);
    logger.info(`Search Service URL : ${process.env.SEARCH_SERVICE_URL}`);
    logger.info(`Redis URL : ${process.env.REDIS_URL}`);
});
