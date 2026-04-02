const productsRepository = require("../repositories/products.repository");
const usersRepository = require("../repositories/users.repository");
const { slugify } = require("../utils/slug");

function validateRequiredFields(fields) {
  const missing = Object.entries(fields)
    .filter(([, value]) => value === undefined || value === null || String(value).trim() === "")
    .map(([key]) => key);

  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }
}

function normalizeSlug(value) {
  const s = slugify(value);
  if (!s) {
    const error = new Error("Slug is required.");
    error.statusCode = 400;
    throw error;
  }
  return s;
}

function toInt(value, fallback = 0) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function handleUniqueError(error, message) {
  if (error && String(error.code) === "23505") {
    const e = new Error(message);
    e.statusCode = 409;
    throw e;
  }
  throw error;
}

async function ensureSellerUserId(sellerId) {
  const user = await usersRepository.getUserById(sellerId);
  if (!user || user.role === "commom") {
    const error = new Error("seller_id must reference a user with role seller.");
    error.statusCode = 400;
    throw error;
  }
  return user.id;
}

async function listProducts({ limit, offset, q, category_id, seller_id, is_active }) {
  return productsRepository.listProducts({ limit, offset, q, category_id, seller_id, is_active });
}

async function findProductById(id) {
  validateRequiredFields({ id });
  const product = await productsRepository.getProductById(id);
  if (!product) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }
  return product;
}

async function createProduct({ currentUser, body }) {
  validateRequiredFields({ currentUser, body });
  validateRequiredFields({ name: body.name, category_id: body.category_id, price_cents: body.price_cents });

  const isAdmin = currentUser.role === "admin";
  const isSeller = currentUser.role === "seller";

  if (!isAdmin && !isSeller) {
    const error = new Error("Forbidden.");
    error.statusCode = 403;
    throw error;
  }

  const sellerId = isAdmin ? null : await ensureSellerUserId(body.seller_id || currentUser.id);

  const product = {
    seller_id: sellerId,
    category_id: body.category_id,
    name: String(body.name).trim(),
    slug: normalizeSlug(body.slug || body.name),
    description: body.description ? String(body.description).trim() : null,
    price_cents: toInt(body.price_cents, 0),
    currency: body.currency ? String(body.currency).trim().toUpperCase() : "BRL",
    stock: Math.max(0, toInt(body.stock, 0)),
    is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
  };

  if (product.price_cents < 0) {
    const error = new Error("price_cents must be >= 0.");
    error.statusCode = 400;
    throw error;
  }

  try {
    return await productsRepository.createProduct(product);
  } catch (error) {
    handleUniqueError(error, "Slug already in use.");
  }
}

async function updateProduct({ currentUser, id, patch }) {
  validateRequiredFields({ currentUser, id });
  if (!patch || typeof patch !== "object") {
    const error = new Error("Invalid body.");
    error.statusCode = 400;
    throw error;
  }

  const existing = await productsRepository.getProductById(id);
  if (!existing) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  const isAdmin = currentUser.role === "admin";
  const isSeller = currentUser.role === "seller";

  if (!isAdmin && !(isSeller && existing.seller_id === currentUser.id)) {
    const error = new Error("Forbidden.");
    error.statusCode = 403;
    throw error;
  }

  const update = {};

  if (patch.category_id !== undefined) update.category_id = patch.category_id;
  if (patch.name !== undefined) {
    const value = String(patch.name ?? "").trim();
    if (!value) {
      const error = new Error("Name is required.");
      error.statusCode = 400;
      throw error;
    }
    update.name = value;
  }
  if (patch.slug !== undefined) update.slug = normalizeSlug(patch.slug);
  if (patch.description !== undefined) update.description = patch.description ? String(patch.description).trim() : null;
  if (patch.price_cents !== undefined) update.price_cents = toInt(patch.price_cents, existing.price_cents);
  if (patch.currency !== undefined) update.currency = String(patch.currency || "BRL").trim().toUpperCase();
  if (patch.stock !== undefined) update.stock = Math.max(0, toInt(patch.stock, existing.stock));
  if (patch.is_active !== undefined) update.is_active = Boolean(patch.is_active);

  if (isAdmin && patch.seller_id !== undefined) {
    update.seller_id = await ensureSellerUserId(patch.seller_id);
  }

  if (Object.keys(update).length === 0) {
    const error = new Error("No fields to update.");
    error.statusCode = 400;
    throw error;
  }

  try {
    const updated = await productsRepository.updateProduct(id, update);
    if (!updated) {
      const error = new Error("Product not found.");
      error.statusCode = 404;
      throw error;
    }
    return updated;
  } catch (error) {
    handleUniqueError(error, "Slug already in use.");
  }
}

async function removeProduct({ currentUser, id }) {
  validateRequiredFields({ currentUser, id });

  const existing = await productsRepository.getProductById(id);
  if (!existing) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  const isAdmin = currentUser.role === "admin";
  const isSeller = currentUser.role === "seller";

  if (!isAdmin && !(isSeller && existing.seller_id === currentUser.id)) {
    const error = new Error("Forbidden.");
    error.statusCode = 403;
    throw error;
  }

  const deleted = await productsRepository.deleteProduct(id);
  if (!deleted) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  return { id: deleted.id };
}

module.exports = {
  listProducts,
  findProductById,
  createProduct,
  updateProduct,
  removeProduct,
};

