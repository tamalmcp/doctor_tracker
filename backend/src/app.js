const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { env } = require('./config/env');
const v1Routes = require('./routes/v1');
const {
  notFoundHandler,
  errorHandler,
} = require('./middlewares/errorMiddleware');

const app = express();

const allowedOrigins = env.frontendUrl
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

if (env.nodeEnv !== 'test') {
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Doctor Tracker API is running',
    version: 'v1',
    health: '/api/v1/health',
  });
});

app.use('/api/v1', v1Routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
