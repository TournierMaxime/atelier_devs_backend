//constation de http et de app
const http = require("http");
const app = require("./app.js");

//Fonction qui vérifie si le port est un nombre et supérieur à 0
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

//Utilisation d'un port spécifique ou du port 3000 par défaut si il n'est pas disponible
const port = normalizePort(process.env.PORT_SERVER || "3000");
app.set("port", port);

//Gestion des erreurs
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

//Crétion du serveur
const server = http.createServer(app);

//Gestion des erreurs + écoute du port
server.on("error", errorHandler);
server.on("listening", () => {
  const address = server.address();
  const bind = typeof address === "string" ? "pipe " + address : "port " + port;
  console.log("Listening on " + bind);
});

server.listen(port);
