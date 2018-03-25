// pull in dependencies
const http = require('http');
const socketio = require('socket.io');
const nodeStatic = require('node-static');
const sockets = require('./sockets.js');
// instantiates the node-static object to serve files
const fileServer = new nodeStatic.Server(`${__dirname}/../client`, {
  cache: false,
  gzip: true,
});

// assign port
const PORT = process.env.PORT || process.env.NODE_PORT || 3000;

// serves files up request from the client
const onRequest = (req, res) => {
  fileServer.serve(req, res, (err) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.write('notFound', {
        data: 'The page you are looking for was not found.',
        id: 'notFound',
      });
      res.end();
    }
  });
};

// start the Server
const app = http.createServer(onRequest);

// pass in the http server into socketio and grab the websocket server as io
const io = socketio(app);

// hook up our socket events on the Server
sockets.setupSockets(io);

app.listen(PORT, (err) => {
  if (err) {
    throw err;
  }
  console.log(`Listening on localhost:${PORT}`);
});
