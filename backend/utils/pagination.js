function toInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function getPagination(query = {}) {
  const page = Math.max(1, toInt(query.page, 1));
  const limit = Math.min(100, Math.max(1, toInt(query.limit, 20)));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

module.exports = {
  getPagination,
};
