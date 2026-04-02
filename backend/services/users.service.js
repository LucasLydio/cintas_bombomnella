const usersRepository = require("../repositories/users.repository");
const { hashPassword } = require("../utils/hash");

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

function toPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

async function listUsers({ limit, offset, name, email, role, is_active }) {
  const result = await usersRepository.listUsers({ limit, offset, name, email, role, is_active });
  return {
    ...result,
    items: result.items.map(toPublicUser),
  };
}

async function findUserById(id) {
  validateRequiredFields({ id });
  const user = await usersRepository.getUserById(id);
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }
  return toPublicUser(user);
}

async function createUser({ name, email, phone, password, role = "common", is_active = true }) {
  validateRequiredFields({ name, email, password });

  const normalizedEmail = String(email).trim().toLowerCase();

  const existing = await usersRepository.getUserByEmailWithPassword(normalizedEmail);
  if (existing) {
    const error = new Error("Email already in use.");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await hashPassword(String(password));

  const user = await usersRepository.createUser({
    name: String(name).trim(),
    email: normalizedEmail,
    phone: phone ? String(phone).trim() : null,
    passwordHash,
    role,
  });

  if (is_active === false) {
    const updated = await usersRepository.updateUser(user.id, { is_active: false });
    return toPublicUser(updated);
  }

  return toPublicUser(user);
}

async function updateUser(id, patch) {
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
  if (patch.phone !== undefined) update.phone = patch.phone ? String(patch.phone).trim() : null;
  if (patch.email !== undefined) {
    const value = String(patch.email ?? "").trim().toLowerCase();
    if (!value) {
      const error = new Error("Email is required.");
      error.statusCode = 400;
      throw error;
    }
    update.email = value;
  }
  if (patch.role !== undefined) update.role = patch.role;
  if (patch.is_active !== undefined) update.is_active = Boolean(patch.is_active);

  if (patch.password !== undefined) {
    validateRequiredFields({ password: patch.password });
    update.password_hash = await hashPassword(String(patch.password));
  }

  if (Object.keys(update).length === 0) {
    const error = new Error("No fields to update.");
    error.statusCode = 400;
    throw error;
  }

  const updated = await usersRepository.updateUser(id, update);
  if (!updated) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  return toPublicUser(updated);
}

async function removeUser(id) {
  validateRequiredFields({ id });
  const deleted = await usersRepository.deleteUser(id);
  if (!deleted) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }
  return { id: deleted.id };
}

module.exports = {
  listUsers,
  findUserById,
  createUser,
  updateUser,
  removeUser,
};
