"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET = "supersecretkey"; // TODO put this in env
function signToken(userId) {
    return jsonwebtoken_1.default.sign({ userId }, SECRET, { expiresIn: "1h" });
}
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, SECRET);
    }
    catch {
        return null;
    }
}
function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
        return res.status(401).json({ error: "no token" });
    const payload = verifyToken(token);
    if (!payload)
        return res.status(401).json({ error: "invalid token" });
    req.userId = payload.userId;
    next();
}
