const { WebSocketServer } = require("ws");
const uuid = require("uuid");
const cron = require("node-cron");

let clients = {};

let webSocketsList = [];

cron.schedule("*/15 * * * * *", function () {
  //console.log("---------------------");
  console.log("running a task every 15 seconds");
  //clients = {};
  //console.log("axxx",clients)
});

initWebSockets = function (server) {
  const wsServer = new WebSocketServer({ server });
  //   A new client connection request received
  wsServer.on("connection", function (connection, req) {
    // Generate a unique code for every user
    const userId = uuid.v4();
    console.log(`Recieved a new req.`, req);
    console.log(`Recieved a new connection.`, connection);
    if(req.url.length > 1){
      clients[req.url.split('=')[1]]=connection;
    }

    // Store the new connection and handle messages
   // clients[req.client.localAddress] = connection;
    // const founde = webSocketsList.find((socket)=> socket.closeCode === connection.closeCode);
    // console.log("founde",req.client.localAddress)
    // if(!founde){
    //   webSocketsList.push(connection)
    // }
    // console.log("webSocketsList", webSocketsList.length);
    console.log("clientsINIT", clients);

    // console.log(`${userId} connected.`);
  });
};
fireWebscoketEvent = function (type = 'general', data = {}) {
  console.log("clients", clients);

  const message = JSON.stringify({ type: type, data: data });
  for (let userId in clients) {
    let client = clients[userId];
    //if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    //}
  }
//   webSocketsList.forEach(userSocket => {
//  //if (userSocket.readyState === WebSocket.OPEN) {
//     userSocket.send(message);
//   //}

  // });
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
