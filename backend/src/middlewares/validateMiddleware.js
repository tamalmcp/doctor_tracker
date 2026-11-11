const ApiError = require('../utils/ApiError');

function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const formattedErrors = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      }));
      return next(
        ApiError.badRequest(
          formattedErrors[0]?.message || 'Validation failed',
          formattedErrors
        )
      );
    }

    req[source] = result.data;
    return next();
  };
}

module.exports = validate;
