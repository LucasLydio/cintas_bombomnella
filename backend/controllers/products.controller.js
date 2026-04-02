const productsService = require("../services/products.service");
const authService = require("../services/auth.service");
const { parseJsonBody, getBearerToken } = require("../utils/http");
const { getPagination } = require("../utils/pagination");
const { sendSuccess, badRequest, unauthorized, forbidden, sendError } = require("../utils/response");

async function tryGetUser(event) {
  const token = getBearerToken(event.headers || {});
  if (!token) return null;
  const session = await authService.getSessionUser({ token });
  return session.user;
}

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
    const id = query.id;

    if (method === "GET") {
      if (id) {
        const user = await tryGetUser(event);
        const product = await productsService.findProductById(id);

        if (!product.is_active) {
          const allowed =
            user && (user.role === "admin" || (user.role === "seller" && product.seller_id === user.id));
          if (!allowed) {
            const error = new Error("Product not found.");
            error.statusCode = 404;
            throw error;
          }
        }

        return sendSuccess(product, "Product fetched successfully.");
      }

      const user = await tryGetUser(event);
      const pagination = getPagination(query);

      const isActiveDefault = user ? query.is_active : query.is_active ?? "true";

      const products = await productsService.listProducts({
        ...pagination,
        q: query.q,
        category_id: query.category_id,
        seller_id: query.seller_id,
        is_active: isActiveDefault,
      });

      return sendSuccess(products, "Products fetched successfully.");
    }

    if (method === "POST") {
      const currentUser = await requireAuthUser(event);
      const body = parseJsonBody(event.body);
      if (!body) return badRequest("Invalid JSON body.");

      const product = await productsService.createProduct({ currentUser, body });
      return sendSuccess(product, "Product created successfully.", 201);
    }

    if (method === "PUT") {
      if (!id) return badRequest("Product id is required in query params.");
      const currentUser = await requireAuthUser(event);
      const body = parseJsonBody(event.body);
      if (!body) return badRequest("Invalid JSON body.");

      const product = await productsService.updateProduct({ currentUser, id, patch: body });
      return sendSuccess(product, "Product updated successfully.");
    }

    if (method === "DELETE") {
      if (!id) return badRequest("Product id is required in query params.");
      const currentUser = await requireAuthUser(event);

      const result = await productsService.removeProduct({ currentUser, id });
      return sendSuccess(result, "Product deleted successfully.");
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
