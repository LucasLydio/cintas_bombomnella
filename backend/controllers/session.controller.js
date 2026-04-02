const authService = require("../services/auth.service");
const { getBearerToken } = require("../utils/http");
const { sendSuccess, badRequest, unauthorized, sendError } = require("../utils/response");

async function handle(event) {
  try {
    if (event.httpMethod !== "GET") {
      return badRequest(`Unsupported method: ${event.httpMethod}`);
    }

    const token = getBearerToken(event.headers || {});
    if (!token) return unauthorized("Missing Bearer token.");

    const result = await authService.getSessionUser({ token });
    return sendSuccess(result, "Session fetched successfully.");
  } catch (error) {
    return sendError(error, error.statusCode || 500);
  }
}

module.exports = {
  handle,
};

