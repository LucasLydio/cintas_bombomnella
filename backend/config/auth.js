const jwtSecret = process.env.AUTH_JWT_SECRET;

if (!jwtSecret) {
  throw new Error("Missing AUTH_JWT_SECRET in environment variables.");
}

const jwtIssuer = process.env.AUTH_JWT_ISSUER || "cintas-bombomnella";
const jwtExpiresIn = process.env.AUTH_JWT_EXPIRES_IN || "7d";

module.exports = {
  jwtSecret,
  jwtIssuer,
  jwtExpiresIn,
};
