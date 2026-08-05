import { SignJWT, jwtVerify } from "jose";

// jose works with a Uint8Array secret, not a raw string
const getSecretKey = () => new TextEncoder().encode(process.env.JWT_SECRET);

/**
 * Sign a JWT for a given user id.
 * Uses HS256 (symmetric secret) which is enough for a single-backend setup.
 */
export const signToken = async (userId) => {
  const secret = getSecretKey();

  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || "7d")
    .sign(secret);

  return token;
};

/**
 * Verify a JWT and return its payload.
 * Throws if the token is invalid, tampered with, or expired.
 */
export const verifyToken = async (token) => {
  const secret = getSecretKey();
  const { payload } = await jwtVerify(token, secret);
  return payload; // { sub: userId, iat, exp }
};
