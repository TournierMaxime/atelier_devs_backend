//Imports
const http = require("http");
const app = require("./app.js");

//Check if the port is a number > 0
const normalizePort = (val) => {
  const port = Number(val);

  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};

//Uses of port 3000 or .env variable
const port = normalizePort(process.env.PORT_SERVER || "3000");
app.set("port", port);

//Handle errors
const errorHandler = (error) => {
  if (error.syscall !== "listen") {
    throw error;
  }
  const address = server.address();
  const bind =
    typeof address === "string" ? "pipe " + address : "port: " + port;
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges.");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use.");
      process.exit(1);
      break;
    default:
      throw error;
  }
};

//Server creation
const server = http.createServer(app);

//Handle errors + listening server
server.on("error", errorHandler);
server.on("listening", () => {
  const address = server.address();
  const bind = typeof address === "string" ? "pipe " + address : "port " + port;
  console.log("Listening on " + bind);
});

server.listen(port);
