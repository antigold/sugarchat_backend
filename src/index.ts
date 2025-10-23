import express from "express";
import cors from "cors";
import roomsRouter from "./rooms";
import messagesRouter from "./messages";
import usersRouter from "./users";

const app = express();
app.use(cors({ origin: "http://localhost:1420" }));
app.use(express.json());

// mount routers
app.use("/rooms", roomsRouter);
app.use("/messages", messagesRouter);
app.use("/users", usersRouter);

app.listen(1300, () => console.log("server running"));



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

// app.listen(1300, () => console.log("server running"));
