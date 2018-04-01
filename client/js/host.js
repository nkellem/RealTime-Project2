'use strict';

//keep track of all our game related objects
let users = {};
let bombs = [];
let explosions = [];

//add player to the hosts' users object
const addPlayerToUsers = data => {
  users[data.Player.name] = data.Player;
  console.log(users);
};

//once the host is confirmed, add player to the users object
const hostConfirmation = data => {
  addPlayerToUsers(data);
};

//lets the host ackknowledge when users join
const userJoined = sock => {
  const socket = sock;

  socket.on('hostAcknowledge', data => {
    addPlayerToUsers(data);
    socket.emit('hostSendUsers', {users: users, ringSize: timesRingDecreased, radius: ring.radius, bombs: bombs});

    if (Object.keys(users).length === 2) {
      updateRingSize(socket);
    }
  });
};

//lets the host know when a user has moved so it can update the simulation
const userUpdatedMovement = sock => {
  const socket = sock;

  socket.on('movementUpdate', data => {
    movementUpdate(data, socket);
  });
};

//lets the host know when a user drops a bomb and updates the simulation
const clientDroppedBomb = (sock) => {
  const socket = sock;

  socket.on('clientDroppedBomb', data => {
    bombs.push(data);
    socket.emit('hostUpdateBombs', data);
  });
};


//send update to clients to update the ring size
const updateRingSize = sock => {
  const socket = sock;

  setInterval(() => {
    decreaseRingSize();
    socket.emit('hostUpdateRingSize');
  }, 10000);
};

//let the clients know a user has died
const hostSendUserDied = (sock, user) => {
  const socket = sock;

  users[user].alive = false;
  socket.emit('hostSendUserDied', {user});
};

//tell the client to trigger an explosion
const hostTriggerExplosion = (sock, data) => {
  const socket = sock;

  socket.emit('hostTriggerExplosion', data);
};

//update clients with who's been hit
const userHitByBomb = (sock, data) => {
  const socket = sock;

  socket.emit('hostUserHitByBomb', data);
};

//reset the user and allow them to take damage again
const hostResetUser = (sock, data) => {
  const socket = sock;

  socket.emit('hostResetUser', data);
};

//holds all our host socket events
const hostEvents = sock => {
  userJoined(sock);
  userUpdatedMovement(sock);
  clientDroppedBomb(sock);
};
