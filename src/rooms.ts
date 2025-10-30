import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4, validate as isUuid } from "uuid";
import { authMiddleware } from "./auth";


const router = Router();
const prisma = new PrismaClient();


// === rooms ===

// GET /rooms
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  try {
    const rooms = await prisma.room.findMany({
      where: {
        members: {
          some: { userId }  //only rooms that have this user
        }
      },
      include: {
        members: {
          include: { user: true }
        }
      }
    });


    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to fetch rooms" });
  }
});


// GET /rooms/:id
router.get("/:id", async (req: Request, res: Response) => {
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
router.put("/", async (req: Request, res: Response) => {
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
router.get("/:id/users", async (req, res) => {
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
router.post("/:id/join", async (req, res) => {
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

// GET /rooms/:id/messages
router.get("/:id/messages", async (req, res) => {
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
router.post("/:id/messages", async (req, res) => {
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

router.post("/join/:roomId", authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { roomId } = req.params;

  try {
    // check if already joined
    const existing = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: { roomId, userId }
      }
    });

    if (existing) return res.status(400).json({ error: "already a member" });

    const membership = await prisma.roomMember.create({
      data: { roomId, userId },
      include: { user: true, room: true }
    });

    res.json(membership);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to join room" });
  }
});


export default router;