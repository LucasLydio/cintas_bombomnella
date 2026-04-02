const productImagesService = require("../services/product-images.service");
const authService = require("../services/auth.service");
const { parseJsonBody, getBearerToken } = require("../utils/http");
const { sendSuccess, badRequest, unauthorized, forbidden, sendError } = require("../utils/response");

async function requireAuthUser(event) {
  const token = getBearerToken(event.headers || {});
  if (!token) {
    const error = new Error("Missing Bearer token.");
    error.statusCode = 401;
    throw error;
  }
  const session = await authService.getSessionUser({ token });
  return session.user;
}

async function handle(event) {
  try {
    const method = event.httpMethod;
    const query = event.queryStringParameters || {};

    if (method === "GET") {
      const productId = query.product_id;
      if (!productId) return badRequest("product_id is required in query params.");

      const images = await productImagesService.listByProductId(productId);
      return sendSuccess(images, "Product images fetched successfully.");
    }

    if (method === "POST") {
      const currentUser = await requireAuthUser(event);
      const body = parseJsonBody(event.body);
      if (!body) return badRequest("Invalid JSON body.");

      const image = await productImagesService.createImage({ currentUser, body });
      return sendSuccess(image, "Product image created successfully.", 201);
    }

    if (method === "PUT") {
      const id = query.id;
      if (!id) return badRequest("Image id is required in query params.");
      const currentUser = await requireAuthUser(event);
      const body = parseJsonBody(event.body);
      if (!body) return badRequest("Invalid JSON body.");

      const image = await productImagesService.updateImage({ currentUser, id, patch: body });
      return sendSuccess(image, "Product image updated successfully.");
    }

    if (method === "DELETE") {
      const id = query.id;
      if (!id) return badRequest("Image id is required in query params.");
      const currentUser = await requireAuthUser(event);

      const result = await productImagesService.removeImage({ currentUser, id });
      return sendSuccess(result, "Product image deleted successfully.");
    }

    return badRequest(`Unsupported method: ${method}`);
  } catch (error) {
    if (error.statusCode === 401) return unauthorized(error.message);
    if (error.statusCode === 403) return forbidden(error.message);
    return sendError(error, error.statusCode || 500);
  }
}

module.exports = {
  handle,
};

