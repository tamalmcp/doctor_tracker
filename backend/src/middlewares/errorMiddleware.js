const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const { env } = require('../config/env');

function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || null;

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    message = errors[0]?.message || 'Database validation error';
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err && err.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    message = `A record with this ${duplicateField} already exists`;
    errors = [{ field: duplicateField, message }];
  }

  if (statusCode >= 500) {
    console.error('[Error]', err);
  }

  const responseBody = {
    success: false,
    message,
  };

  if (errors) {
    responseBody.errors = errors;
  }

  if (!env.isProduction && statusCode >= 500 && err.stack) {
    responseBody.stack = err.stack;
  }

  return res.status(statusCode).json(responseBody);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
