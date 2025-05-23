const { WebSocketServer } = require("ws");

const clients = new Map();

const getUserIdFromRequest = (req) => {
  const params = new URLSearchParams(req.url.split('?')[1]);

// Get the customerId value
const customerId = params.get('customerId');
  return customerId; // || uuid.v4();
};

initWebSockets = function (server) {
  const wsServer = new WebSocketServer({ server });

  wsServer.on("connection", function (connection, req) {
    const userId = getUserIdFromRequest(req);
    if(!userId){
      return;
    }
    clients.set(userId, connection);
    connection.on("close", () => {
      if(!userId){
        return;
      }
      clients.delete(userId);
    });

    connection.on("error", () => {
      if(!userId){
        return;
      }
      clients.delete(userId);
    });
  });
};

fireWebscoketEvent = function (
  type = "general",
  data = {},
  customersIds = null
) {
  const message = JSON.stringify({ type: type, data: data });

  if (customersIds) {
    customersIds.forEach((customerId) => {
      let client = clients.getId(customerId);
      //if (client.readyState === WebSocket.OPEN) {
      if (client) {
        client.send(message);
      }
      //}
    });
  } else {
    clients.forEach((value, key) => {
      if (value) {
        value.send(message);
      }
    });
  }
};

setInterval(() => {
  clients.forEach((ws, key) => {
    if (ws.readyState === ws.OPEN) {
      ws.ping();
    }
  });
}, 30000);

const websocket = {
  fireWebscoketEvent: fireWebscoketEvent,
  initWebSockets: initWebSockets,
};
module.exports = websocket;
