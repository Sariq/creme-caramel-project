const { WebSocketServer } = require("ws");
const uuid = require("uuid");
const cron = require("node-cron");

let clients = {};

let webSocketsList = [];

cron.schedule("0 4 * * *", function () {
  console.log("---------------------");
  console.log("running a task At 04:00");
  //clients = {};
  console.log("clients", clients)
  for (let userId in clients) {
    let client = clients[userId];
    if(client.readyState != 1){
      delete clients[userId];
    }
  }
  console.log("clients after delete", clients)
});

initWebSockets = function (server) {
  const wsServer = new WebSocketServer({ server });
  //   A new client connection request received
  wsServer.on("connection", function (connection, req) {
    // Generate a unique code for every user
    const queryParam = req.url?.split('=')[1];
    let customerId = null;
    if(queryParam && queryParam != 'undefined'){
      customerId = req.url?.split('=')[1];
    }
    const userId = customerId || uuid.v4();
    clients[userId]=connection;
    // Store the new connection and handle messages
    // console.log(`${userId} connected.`);
  });
};
fireWebscoketEvent = function (type = 'general', data = {}, customersIds = null) {
  const message = JSON.stringify({ type: type, data: data });

  if(customersIds){
    customersIds.forEach((customerId)=>{
      let client = clients[customerId];
      //if (client.readyState === WebSocket.OPEN) {
        if(client){
          client.send(message);
        }
      //}
    })
  }else{
    for (let userId in clients) {
      let client = clients[userId];
      //if (client.readyState === WebSocket.OPEN) {
        if(client){
          client.send(message);
        }
      //}
    }
  }


};
const websocket = {
  fireWebscoketEvent: fireWebscoketEvent,
  initWebSockets: initWebSockets,
};
module.exports = websocket;
