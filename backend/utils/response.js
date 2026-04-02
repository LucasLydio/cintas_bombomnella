function buildResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };
}

function sendSuccess(data = null, message = "Success", statusCode = 200) {
  return buildResponse(statusCode, {
    success: true,
    message,
    data,
  });
}

function badRequest(message = "Bad request", errors = null) {
  return buildResponse(400, {
    success: false,
    message,
    errors,
  });
}

function unauthorized(message = "Unauthorized") {
  return buildResponse(401, {
    success: false,
    message,
  });
}

function forbidden(message = "Forbidden") {
  return buildResponse(403, {
    success: false,
    message,
  });
}

function sendError(error, statusCode = 500) {
  return buildResponse(statusCode, {
    success: false,
    message: error.message || "Internal server error",
  });
}

module.exports = {
  sendSuccess,
  badRequest,
  unauthorized,
  forbidden,
  sendError,
};
