class ApiResponse {
  static success(res, { statusCode = 200, message = 'Success', data = null, meta = null }) {
    const payload = {
      success: true,
      message,
      data,
    };
    if (meta !== null) {
      payload.meta = meta;
    }
    return res.status(statusCode).json(payload);
  }

  static created(res, { message = 'Created successfully', data = null, meta = null }) {
    return ApiResponse.success(res, {
      statusCode: 201,
      message,
      data,
      meta,
    });
  }
}

module.exports = ApiResponse;
