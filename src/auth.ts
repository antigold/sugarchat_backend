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

import { Request, Response, NextFunction } from "express";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "no token" });

  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "invalid token" });

  (req as any).userId = payload.userId;
  next();
}
