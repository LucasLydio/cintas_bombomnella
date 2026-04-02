const categoriesRepository = require("../repositories/categories.repository");
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

function handleUniqueError(error, message) {
  if (error && String(error.code) === "23505") {
    const e = new Error(message);
    e.statusCode = 409;
    throw e;
  }
  throw error;
}

async function listCategories({ limit, offset, name, is_active }) {
  return categoriesRepository.listCategories({ limit, offset, name, is_active });
}

async function findCategoryById(id) {
  validateRequiredFields({ id });
  const category = await categoriesRepository.getCategoryById(id);
  if (!category) {
    const error = new Error("Category not found.");
    error.statusCode = 404;
    throw error;
  }
  return category;
}

async function createCategory({ name, slug, description, is_active = true, sort_order = 0 }) {
  validateRequiredFields({ name });

  const finalSlug = normalizeSlug(slug || name);

  try {
    return await categoriesRepository.createCategory({
      name: String(name).trim(),
      slug: finalSlug,
      description: description ? String(description).trim() : null,
      is_active: Boolean(is_active),
      sort_order: Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0,
    });
  } catch (error) {
    handleUniqueError(error, "Slug already in use.");
  }
}

async function updateCategory(id, patch) {
  validateRequiredFields({ id });
  if (!patch || typeof patch !== "object") {
    const error = new Error("Invalid body.");
    error.statusCode = 400;
    throw error;
  }

  const update = {};

  if (patch.name !== undefined) {
    const value = String(patch.name ?? "").trim();
    if (!value) {
      const error = new Error("Name is required.");
      error.statusCode = 400;
      throw error;
    }
    update.name = value;
  }

  if (patch.slug !== undefined) {
    update.slug = normalizeSlug(patch.slug);
  }

  if (patch.description !== undefined) {
    update.description = patch.description ? String(patch.description).trim() : null;
  }

  if (patch.is_active !== undefined) update.is_active = Boolean(patch.is_active);
  if (patch.sort_order !== undefined) update.sort_order = Number.isFinite(Number(patch.sort_order)) ? Number(patch.sort_order) : 0;

  if (Object.keys(update).length === 0) {
    const error = new Error("No fields to update.");
    error.statusCode = 400;
    throw error;
  }

  try {
    const updated = await categoriesRepository.updateCategory(id, update);
    if (!updated) {
      const error = new Error("Category not found.");
      error.statusCode = 404;
      throw error;
    }
    return updated;
  } catch (error) {
    handleUniqueError(error, "Slug already in use.");
  }
}

async function removeCategory(id) {
  validateRequiredFields({ id });
  const deleted = await categoriesRepository.deleteCategory(id);
  if (!deleted) {
    const error = new Error("Category not found.");
    error.statusCode = 404;
    throw error;
  }
  return { id: deleted.id };
}

module.exports = {
  listCategories,
  findCategoryById,
  createCategory,
  updateCategory,
  removeCategory,
};
