function getEnv(key, { required = false, defaultValue } = {}) {
  const value = process.env[key];

  if ((value === undefined || value === "") && required) {
    throw new Error(`Missing required env var: ${key}`);
  }

  if (value === undefined || value === "") {
    return defaultValue;
  }

  return value;
}

module.exports = {
  getEnv,
};

