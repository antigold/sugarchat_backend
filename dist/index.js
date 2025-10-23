"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const rooms_1 = __importDefault(require("./rooms"));
const messages_1 = __importDefault(require("./messages"));
const users_1 = __importDefault(require("./users"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: "http://localhost:1420" }));
app.use(express_1.default.json());
// mount routers
app.use("/rooms", rooms_1.default);
app.use("/messages", messages_1.default);
app.use("/users", users_1.default);
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
