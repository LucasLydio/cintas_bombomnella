const productsRepository = require("../repositories/products.repository");
const productImagesRepository = require("../repositories/product-images.repository");

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

function toInt(value, fallback = 0) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

async function assertCanManageProduct({ currentUser, productId }) {
  const product = await productsRepository.getProductById(productId);
  if (!product) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  const isAdmin = currentUser.role === "admin";
  const isSellerOwner = currentUser.role === "seller" && product.seller_id === currentUser.id;

  if (!isAdmin && !isSellerOwner) {
    const error = new Error("Forbidden.");
    error.statusCode = 403;
    throw error;
  }

  return product;
}

async function listByProductId(productId) {
  validateRequiredFields({ productId });
  return productImagesRepository.listImagesByProductId(productId);
}

async function createImage({ currentUser, body }) {
  validateRequiredFields({ currentUser, body });
  validateRequiredFields({ product_id: body.product_id, storage_path: body.storage_path });

  await assertCanManageProduct({ currentUser, productId: body.product_id });

  const isCover = Boolean(body.is_cover);
  if (isCover) {
    await productImagesRepository.unsetCover(body.product_id);
  }

  return productImagesRepository.createImage({
    product_id: body.product_id,
    storage_path: String(body.storage_path).trim(),
    alt_text: body.alt_text ? String(body.alt_text).trim() : null,
    is_cover: isCover,
    sort_order: Math.max(0, toInt(body.sort_order, 0)),
  });
}

async function updateImage({ currentUser, id, patch }) {
  validateRequiredFields({ currentUser, id });
  if (!patch || typeof patch !== "object") {
    const error = new Error("Invalid body.");
    error.statusCode = 400;
    throw error;
  }

  const existing = await productImagesRepository.getImageById(id);
  if (!existing) {
    const error = new Error("Product image not found.");
    error.statusCode = 404;
    throw error;
  }

  await assertCanManageProduct({ currentUser, productId: existing.product_id });

  const update = {};
  if (patch.storage_path !== undefined) update.storage_path = String(patch.storage_path ?? "").trim();
  if (patch.alt_text !== undefined) update.alt_text = patch.alt_text ? String(patch.alt_text).trim() : null;
  if (patch.sort_order !== undefined) update.sort_order = Math.max(0, toInt(patch.sort_order, existing.sort_order));

  if (patch.is_cover !== undefined) {
    const isCover = Boolean(patch.is_cover);
    if (isCover) await productImagesRepository.unsetCover(existing.product_id);
    update.is_cover = isCover;
  }

  if (Object.keys(update).length === 0) {
    const error = new Error("No fields to update.");
    error.statusCode = 400;
    throw error;
  }

  const updated = await productImagesRepository.updateImage(id, update);
  if (!updated) {
    const error = new Error("Product image not found.");
    error.statusCode = 404;
    throw error;
  }
  return updated;
}

async function removeImage({ currentUser, id }) {
  validateRequiredFields({ currentUser, id });

  const existing = await productImagesRepository.getImageById(id);
  if (!existing) {
    const error = new Error("Product image not found.");
    error.statusCode = 404;
    throw error;
  }

  await assertCanManageProduct({ currentUser, productId: existing.product_id });

  const deleted = await productImagesRepository.deleteImage(id);
  if (!deleted) {
    const error = new Error("Product image not found.");
    error.statusCode = 404;
    throw error;
  }

  return { id: deleted.id };
}

module.exports = {
  listByProductId,
  createImage,
  updateImage,
  removeImage,
};

