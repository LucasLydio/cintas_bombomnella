function parseJsonBody(body) {
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function getBearerToken(headers = {}) {
  const raw = headers.authorization || headers.Authorization || "";
  if (!raw) return null;
  const [scheme, token] = raw.split(" ");
  if ((scheme || "").toLowerCase() !== "bearer") return null;
  return token || null;
}

module.exports = {
  parseJsonBody,
  getBearerToken,
};

