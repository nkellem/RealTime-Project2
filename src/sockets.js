//pull in dependencies
const Player = require('./Player.js');
//io server instance
let io;

//TODO: need to delegate physics calculations to a host and have them hold the user info

//TODO: placeholder for keeping track of socket rooms
const userRooms = {};

const confirmHost = sock => {
  const socket = sock;

  socket.isHost = true;
  socket.hostSocket = socket;

  socket.emit('hostConfirmation', {Player: socket.Player});

  //handle host events
  console.log(`The host is user ${socket.name}`);
};

//Set up socketio events
const designateHost = sock => {
  const socket = sock;

  const socketRoom = io.sockets.adapter.rooms[socket.belongsTo];

  if (!socketRoom || socketRoom.length === 0) {
    confirmHost(socket);
  } else {
    socket.isHost = false;
    const socketKeys = Object.keys(socketRoom.sockets);

    let hostFound = false;

    for (let i = 0; i < socketKeys.length; i++) {
      //grab the socket object from the overall socket list
      //based on the socket ids in the room
      const socketUser = io.sockets.connected[socketKeys[i]];

      //if this socket is the host and matches our room name
      if (socketUser.isHost) {
        //set the host socket reference as this socket's hostSocket (custom property)
        socket.hostSocket = socketUser;
        //TODO: call the host socket and let them know a new character has joined
        socket.hostSocket.emit('hostAcknowledge', {Player: socket.Player});
        console.log(`Host for ${socket.belongsTo} is ${socket.hostSocket.name}`);
        hostFound = true; //flag we did find a host (in case host left)
        break; //stop searching for a host
      }
    }

    if (!hostFound) {
      confirmHost(socket);
    }
  }
};
//assign user to a room
const onJoined = sock => {
  const socket = sock;

  socket.on('join', data => {
    socket.join(data.room);
    socket.name = data.user;
    socket.belongsTo = data.room;
    socket.Player = new Player(socket.name);
    console.log(`User ${data.user} just joined room ${data.room}`);
    designateHost(socket);
  });
};

const onMovementUpdate = sock => {
  const socket = sock;

  socket.on('movementUpdate', data => {
    socket.hostSocket.emit('movementUpdate', data);
    console.log('client sent movement update');
  });
};

//host events
const onHostSendUsers = sock => {
  const socket = sock;

  socket.on('hostSendUsers', data => {
    socket.hostSocket.broadcast.emit('clientGetUsers', data);
  });
};

const onHostUpdatedMovement = sock => {
  const socket = sock;

  socket.on('hostUpdatedMovement', data => {
    socket.hostSocket.broadcast.emit('hostUpdatedMovement', data);
  });
};

//sets up sockets
const setupSockets = ioServer => {
  //get server reference
  io = ioServer;

  io.on('connection', sock => {
    const socket = sock;

    onJoined(socket);
    onHostSendUsers(socket);
    onHostUpdatedMovement(socket);
    onMovementUpdate(socket);
  });
}

module.exports = {
  setupSockets,
};
