import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4, validate as isUuid } from "uuid";

const router = Router();
const prisma = new PrismaClient();


// === rooms ===

// GET /rooms
router.get("/rooms", async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany();
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to fetch rooms" });
  }
});

// GET /rooms/:id
router.get("/rooms/:id", async (req: Request, res: Response) => {
  const { id } = req.params; //get the :id from the url
  if (!isUuid(id)) return res.status(400).json({ error: "invalid uuid" });
  try {
    //check if uuid exists in rooms
    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) return res.status(404).json({ error: "room not found" });

    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to fetch room" });
  }
});


// curl -X PUT http://127.0.0.1:1300/rooms -H "Content-Type: routerlication/json" -d '{"roomName":"general"}'
// PUT /rooms  (expects { roomName })
router.put("/rooms", async (req: Request, res: Response) => {
  //create room
  try {
    const { roomName, roomImage } = req.body;
    if (!roomName) return res.status(400).json({ error: "roomName is required" });

    const room = await prisma.room.create({
      data: {
        id: uuidv4(),
        roomName,
        roomImage,
      },
    });

    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to create room" });
  }
});

// GET /rooms/:id/users
router.get("/rooms/:id/users", async (req, res) => {
  // list users of a room
  const { id } = req.params; //get the :id from the url

  if (!isUuid(id)) return res.status(400).json({ error: "invalid uuid" });

  try {
    //check if uuid exists in rooms
    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) return res.status(404).json({ error: "room not found" });

    const users = await prisma.roomMember.findMany({ where: { roomId : id }})

    res.json(users);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "database error" });
  }

});

// POST /rooms/:id/join
router.post("/rooms/:id/join", async (req, res) => {
  // join a room
  const { id } = req.params; //get the :id from the url
  const { userId } = req.body; //user 
  if (!isUuid(id)) return res.status(400).json({ error: "invalid uuid" });
  try {
    //check if uuid exists in rooms
    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) return res.status(404).json({ error: "room not found" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "user not found" });

    // check if already a member
    const existing = await prisma.roomMember.findFirst({
      where: { roomId: id, userId },
    });
    if (existing) return res.status(400).json({ error: "already a member" });

    // add to room
    const member = await prisma.roomMember.create({
      data: { roomId: id, userId },
    });

    res.json(member);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "database error" });
  }
});

export default router;