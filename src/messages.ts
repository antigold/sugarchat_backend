import { v4 as uuidv4, validate as isUuid } from "uuid";
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// === messages ===

// GET /rooms/:id/messages
router.get("/rooms/:id/messages", async (req, res) => {
  // get messages from a room
  const { id } = req.params; //get the :id from the url
  if (!isUuid(id)) return res.status(400).json({ error: "invalid uuid" });
  try {
    //check if uuid exists in rooms
    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) return res.status(404).json({ error: "room not found" });

    const messages = await prisma.message.findMany({ where: { roomId : id },include: { owner: true }});
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to fetch room" });
  }
});

// ! to find a message
// const num = Number(value);
// if (Number.isInteger(num)) {
//   console.log("valid integer id");
// }

// POST /rooms/:id/messages  (expects { text })
router.post("/rooms/:id/messages", async (req, res) => {
  // post a message
  const { id } = req.params; //get the :id from the url
  if (!isUuid(id)) return res.status(400).json({ error: "invalid uuid" });
  const { text, owner, room } = req.body;
  if (!text || !owner) return res.status(400).json({ error: "text or owner is required" });
  try {
    const message = await prisma.message.create({
      data: {
        text: text,
        ownerId: owner,
        roomId: room,
      },
    });

    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to create message" });
  }
});

export default router