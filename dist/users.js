"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = require("./auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// const hashed = await bcrypt.hash(password, 10); to hash a password
// const isValid = await bcrypt.compare(enteredPassword, storedHash); to check
// === users ===
// login
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user)
        return res.status(401).json({ error: "invalid credentials" });
    const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!valid)
        return res.status(401).json({ error: "invalid credentials" });
    const token = (0, auth_1.signToken)(user.id);
    res.json({ token });
});
// register
router.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const hash = await bcryptjs_1.default.hash(password, 10);
    const user = await prisma.user.create({
        data: { username, passwordHash: hash }
    });
    const token = (0, auth_1.signToken)(user.id);
    res.json({ token });
});
router.get("/me", async (req, res) => {
    const auth = req.headers.authorization?.split(" ")[1];
    if (!auth)
        return res.status(401).json({ error: "no token" });
    const payload = (0, auth_1.verifyToken)(auth);
    if (!payload)
        return res.status(401).json({ error: "invalid token" });
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    res.json(user);
});
// GET /users
router.get("/", async (req, res) => {
    // list all users
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "failed to fetch users" });
    }
});
// PUT /users  (expects { name, password })
router.put("/", async (req, res) => {
    // create a member
    try {
        const { username, password, displayName = username } = req.body;
        if (!username || !password)
            return res.status(400).json({ error: "username and password are required" });
        const hashed = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                id: (0, uuid_1.v4)(),
                username: username,
                displayName: displayName,
                bio: "",
                profilePicture: "",
                passwordHash: hashed
            },
        });
        res.json(user);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "failed to create user" });
    }
});
// GET /users/:id/passwordcheck
router.get("/:id/passwordcheck", async (req, res) => {
    // dev: check password
    const { id } = req.params; //get the :id from the url
    const { password } = req.body; //password
    if (!(0, uuid_1.validate)(id))
        return res.status(400).json({ error: "invalid uuid" });
    try {
        //check if uuid exists in db
        const user = await prisma.user.findUnique({
            where: { id },
        });
        if (!user)
            return res.status(404).json({ error: "user not found" });
        const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        res.send(isValid);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "failed to fetch user" });
    }
});
// GET /users/:id/name
router.get("/:id/name", async (req, res) => {
    const { id } = req.params; //get the :id from the url
    try {
        //check if uuid exists in db
        const user = await prisma.user.findUnique({
            where: { id },
        });
        if (!user)
            return res.status(404).json({ error: "user not found" });
        res.send(user.displayName);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "failed to fetch user" });
    }
});
exports.default = router;
