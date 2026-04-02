const { supabase } = require("../config/supabase");

async function getUserByEmailWithPassword(email) {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, phone, role, is_active, password_hash, created_at, updated_at")
    .eq("email", email)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

async function getUserById(id) {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, phone, role, is_active, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

async function createUser({ name, email, phone, passwordHash, role = "common" }) {
  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        name,
        email,
        phone: phone || null,
        password_hash: passwordHash,
        role,
      },
    ])
    .select("id, name, email, phone, role, is_active, created_at, updated_at")
    .single();

  if (error) throw error;
  return data;
}

async function listUsers({ limit = 20, offset = 0, name, email, role, is_active } = {}) {
  let query = supabase
    .from("users")
    .select("id, name, email, phone, role, is_active, created_at, updated_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (name) query = query.ilike("name", `%${name}%`);
  if (email) query = query.ilike("email", `%${email}%`);
  if (role) query = query.eq("role", role);
  if (is_active !== undefined && is_active !== null && is_active !== "") {
    const boolValue = String(is_active).toLowerCase() === "true";
    query = query.eq("is_active", boolValue);
  }

  const from = offset;
  const to = offset + limit - 1;

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return {
    items: data || [],
    total: count ?? 0,
    limit,
    offset,
  };
}

async function updateUser(id, patch) {
  const { data, error } = await supabase
    .from("users")
    .update(patch)
    .eq("id", id)
    .select("id, name, email, phone, role, is_active, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data || null;
}

async function deleteUser(id) {
  const { data, error } = await supabase.from("users").delete().eq("id", id).select("id").single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data || null;
}

module.exports = {
  getUserByEmailWithPassword,
  getUserById,
  createUser,
  listUsers,
  updateUser,
  deleteUser,
};
