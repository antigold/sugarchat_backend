import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4, validate as isUuid } from "uuid";
import bcrypt from "bcryptjs";

const router = Router();
const prisma = new PrismaClient();

// const hashed = await bcrypt.hash(password, 10); to hash a password
// const isValid = await bcrypt.compare(enteredPassword, storedHash); to check

// === users ===

// GET /users
router.get("/users", async (req, res) => {
  // list all users
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to fetch users" });
  }
});

// PUT /users  (expects { name, password })
router.put("/users", async (req, res) => {
  // create a member
  try {
    const { username, password, displayName = username } = req.body;
    if (!username || !password) return res.status(400).json({ error: "username and password are required" });
    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        username: username,
        displayName: displayName,
        bio: "",
        profilePicture: "",
        passwordHash: hashed
      },
    });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to create user" });
  }
});

// GET /users/:id/passwordcheck
router.get("/users/:id/passwordcheck", async (req, res) => {
  // dev: check password
  const { id } = req.params; //get the :id from the url
  const { password } = req.body; //password
  if (!isUuid(id)) return res.status(400).json({ error: "invalid uuid" });
  try {
    //check if uuid exists in db
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return res.status(404).json({ error: "user not found" });
    const isValid = await bcrypt.compare(password, user.passwordHash);

    res.send(isValid);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to fetch user" });
  }
});

// GET /users/:id/name
router.get("/users/:id/name", async (req, res) => {
  const { id } = req.params; //get the :id from the url
  try {
    //check if uuid exists in db
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return res.status(404).json({ error: "user not found" });

    res.send(user.displayName);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to fetch user" });
  }
});

export default router