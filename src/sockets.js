// pull in dependencies
const Player = require('./Player.js');
// io server instance
let io;

// lets the host know that it is the host
const confirmHost = (sock) => {
  const socket = sock;

  socket.isHost = true;
  socket.hostSocket = socket;

  socket.emit('hostConfirmation', { Player: socket.Player });

  // handle host events
  console.log(`The host is user ${socket.name}`);
};

// Set up socketio events
const designateHost = (sock) => {
  const socket = sock;

  const socketRoom = io.sockets.adapter.rooms[socket.belongsTo];

  if (!socketRoom || socketRoom.length === 0) {
    confirmHost(socket);
  } else {
    socket.isHost = false;
    const socketKeys = Object.keys(socketRoom.sockets);

    let hostFound = false;

    for (let i = 0; i < socketKeys.length; i++) {
      // grab the socket object from the overall socket list
      // based on the socket ids in the room
      const socketUser = io.sockets.connected[socketKeys[i]];

      // if this socket is the host and matches our room name
      if (socketUser.isHost) {
        // set the host socket reference as this socket's hostSocket (custom property)
        socket.hostSocket = socketUser;
        socket.hostSocket.emit('hostAcknowledge', { Player: socket.Player });
        console.log(`Host for ${socket.belongsTo} is ${socket.hostSocket.name}`);
        hostFound = true; // flag we did find a host (in case host left)
        break; // stop searching for a host
      }
    }

    if (!hostFound) {
      confirmHost(socket);
    }
  }
};
// assign user to a room
const onJoined = (sock) => {
  const socket = sock;

  socket.on('join', (data) => {
    socket.join(data.room);
    socket.name = data.user;
    socket.belongsTo = data.room;
    socket.Player = new Player(socket.name, data.radius);
    console.log(`User ${data.user} just joined room ${data.room}`);
    designateHost(socket);
  });
};

// route a client movement uopdate back to the host
const onMovementUpdate = (sock) => {
  const socket = sock;

  socket.on('movementUpdate', (data) => {
    socket.hostSocket.emit('movementUpdate', data);
    console.log('client sent movement update');
  });
};

// route a bomb update from client to host
const onDroppedBomb = (sock) => {
  const socket = sock;

  socket.on('droppedBomb', (data) => {
    console.log('client dropped bomb');
    socket.hostSocket.emit('clientDroppedBomb', data);
  });
};

// host events (routed from host to client)
// updates clients' users objects when a new player joins
const onHostSendUsers = (sock) => {
  const socket = sock;

  socket.on('hostSendUsers', (data) => {
    socket.hostSocket.broadcast.emit('clientGetUsers', data);
  });
};

// lets the client know what the current ring size is
const onHostSendRingSize = (sock) => {
  const socket = sock;

  socket.on('hostSendRingSize', (data) => {
    socket.hostSocket.broadcast.emit('hostSendRingSize', data);
  });
};

// lets clients know the host player has updated its position
const onHostUpdatedMovement = (sock) => {
  const socket = sock;

  socket.on('hostUpdatedMovement', (data) => {
    socket.hostSocket.broadcast.emit('hostUpdatedMovement', data);
  });
};

// tells clients to decrease their ring size
const onHostUpdateRingSize = (sock) => {
  const socket = sock;

  socket.on('hostUpdateRingSize', () => {
    socket.hostSocket.broadcast.emit('hostUpdateRingSize');
  });
};

// tells clients when a user has died
const onHostSendUserDied = (sock) => {
  const socket = sock;

  socket.on('hostSendUserDied', (data) => {
    socket.hostSocket.broadcast.emit('hostSendUserDied', data);
  });
};

// updates the clients' bombs list
const onHostUpdateBombs = (sock) => {
  const socket = sock;

  socket.on('hostUpdateBombs', (data) => {
    socket.hostSocket.broadcast.emit('hostUpdateBombs', data);
  });
};

// lets the client know when a bomb should explode
const onHostTriggerExplosion = (sock) => {
  const socket = sock;

  socket.on('hostTriggerExplosion', (data) => {
    console.log('host triggered explosion');
    socket.hostSocket.broadcast.emit('hostTriggerExplosion', data);
  });
};

// lets clients know when a player has been hit
const onHostUserHitByBomb = (sock) => {
  const socket = sock;

  socket.on('hostUserHitByBomb', (data) => {
    socket.hostSocket.broadcast.emit('hostUserHitByBomb', data);
  });
};

// tells the clients to reset a user
const onHostResetUser = (sock) => {
  const socket = sock;

  socket.on('hostResetUser', (data) => {
    socket.hostSocket.broadcast.emit('hostResetUser', data);
  });
};

// sets up sockets
const setupSockets = (ioServer) => {
  // get server reference
  io = ioServer;

  io.on('connection', (sock) => {
    const socket = sock;

    onJoined(socket);
    onHostSendRingSize(socket);
    onDroppedBomb(socket);
    onHostSendUsers(socket);
    onHostUpdatedMovement(socket);
    onMovementUpdate(socket);
    onHostUpdateRingSize(socket);
    onHostSendUserDied(socket);
    onHostUpdateBombs(socket);
    onHostTriggerExplosion(socket);
    onHostUserHitByBomb(socket);
    onHostResetUser(socket);
  });
};

module.exports = {
  setupSockets,
};
