import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4, validate as isUuid } from "uuid";
import bcrypt from "bcryptjs";
import cors from 'cors';

const prisma = new PrismaClient();
const app = express();
app.use(cors({ origin: "http://localhost:1420"}));
app.use(express.json());


// const hashed = await bcrypt.hash(password, 10); to hash a password
// const isValid = await bcrypt.compare(enteredPassword, storedHash); to check

// === rooms ===

// GET /rooms
app.get("/rooms", async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany();
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to fetch rooms" });
  }
});

// GET /rooms/:id
app.get("/rooms/:id", async (req: Request, res: Response) => {
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


// curl -X PUT http://127.0.0.1:1300/rooms -H "Content-Type: application/json" -d '{"roomName":"general"}'
// PUT /rooms  (expects { roomName })
app.put("/rooms", async (req: Request, res: Response) => {
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
app.get("/rooms/:id/users", async (req, res) => {
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
app.post("/rooms/:id/join", async (req, res) => {
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




// === users ===

// GET /users
app.get("/users", async (req, res) => {
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
app.put("/users", async (req, res) => {
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
app.get("/users/:id/passwordcheck", async (req, res) => {
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
app.get("/users/:id/name", async (req, res) => {
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


// === messages ===

// GET /rooms/:id/messages
app.get("/rooms/:id/messages", async (req, res) => {
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
app.post("/rooms/:id/messages", async (req, res) => {
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

//WEBSOCKET
// import WebSocket, { WebSocketServer } from 'ws';
// const wss = new WebSocketServer({ port: 8080 });

// wss.on('connection', ws => {
//   ws.on('message', message => {
//     // save message to DB here
//     // then broadcast
//     wss.clients.forEach(client => {
//       if (client.readyState === WebSocket.OPEN) client.send(message);
//     });
//   });
// });

app.listen(1300, () => console.log("server running"));
