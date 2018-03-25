'use strict';

let users = {};

const addPlayerToUsers = data => {
  users[data.Player.name] = data.Player;
  console.log(users);
};

const hostConfirmation = data => {
  addPlayerToUsers(data);
};

const userJoined = sock => {
  const socket = sock;

  socket.on('hostAcknowledge', data => {
    addPlayerToUsers(data);
    socket.emit('hostSendUsers', users);
  });
};

const userUpdatedMovement = sock => {
  const socket = sock;

  socket.on('movementUpdate', data => {
    movementUpdate(data, socket);
    console.log('host received update');
  });
}

//holds all our host socket events
const hostEvents = sock => {
  userJoined(sock);
  userUpdatedMovement(sock);
};
