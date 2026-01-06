import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "./app";
import { gameSocket } from "./sockets/game";

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  gameSocket(io, socket);
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
