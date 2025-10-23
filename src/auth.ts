import jwt from "jsonwebtoken";

const SECRET = "supersecretkey"; // TODO put this in env

export function signToken(userId: string) {
  return jwt.sign({ userId }, SECRET, { expiresIn: "1h" });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET) as { userId: string };
  } catch {
    return null;
  }
}
