const { WebSocketServer } = require("ws");
const uuid = require("uuid");

let clients = {};

initWebSockets = function (server) {
  const wsServer = new WebSocketServer({ server });
  //   A new client connection request received
  wsServer.on("connection", function (connection) {
    // Generate a unique code for every user
    const userId = uuid.v4();
    console.log(`Recieved a new connection.`);

    // Store the new connection and handle messages
    clients[userId] = connection;
    console.log(`${userId} connected.`);
  });
};
fireWebscoketEvent = function (type = 'general') {
  console.log("clients", clients);

  const data = JSON.stringify({ type: type });
  for (let userId in clients) {
    let client = clients[userId];
    //if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    //}
  }
  // let client = clients["uuidv4()"];
  // //if(client.readyState === WebSocket.OPEN) {

  //   client.send(JSON.stringify());
  // //}
};
const websocket = {
  fireWebscoketEvent: fireWebscoketEvent,
  initWebSockets: initWebSockets,
};
module.exports = websocket;
