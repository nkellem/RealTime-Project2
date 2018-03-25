'use strict';

const updateUser = data => {
  if (users[data.name].lastUpdate >= data.lastUpdate) {
    return;
  }

  if (data.name === user) {
    return;
  }

  const currUser = users[data.name];
  currUser.prevX = data.prevX;
  currUser.prevY = data.prevY;
  currUser.destX = data.destX;
  currUser.destY = data.destY;
  currUser.lastUpdate = data.lastUpdate;
  currUser.alpha = 0.05;
};

//handle movement updates from other users
const movementUpdate = (data, socket) => {
  users[data.name] = data;
  users[data.name].lastUpdate = new Date().getTime();

  let currUser = users[data.name];
  currUser.prevX = data.prevX;
  currUser.prevY = data.prevY;
  currUser.destX = data.destX;
  currUser.destY = data.destY;
  currUser.lastUpdate = data.lastUpdate;
  currUser.alpha = 0.05;

  socket.emit('hostUpdatedMovement', currUser);
};

const displayCanvas = () => {
  document.querySelector('#joinRoom').style.display =  'none';
  document.querySelector('#canvas').style.display = 'block';
};

//handle keyboard input from the user
const updatePosition = socket => {
  const currUser = users[user];

  currUser.prevX = currUser.x;
  currUser.prevY = currUser.prevY;

  //set up keydown event
  window.addEventListener('keydown', e => {
    if (e.keyCode === 37 && currUser.destX > 0) {
      currUser.destX -= 2;
    }

    if (e.keyCode === 39 && currUser.destX < cWidth) {
      currUser.destX += 2;
    }

    if (e.keyCode === 38 && currUser.destY > 0) {
      currUser.destY -= 2;
    }

    if (e.keyCode === 40 && currUser.destY < cHeight) {
      currUser.destY += 2;
    }

    //reset the user's alpha so they are always smoothly animating
    currUser.alpha = 0.05;

    if (isHost) {
      currUser.lastUpdate = new Date().getTime();
      socket.emit('hostUpdatedMovement', currUser);
    } else {
      socket.emit('movementUpdate', currUser);
    }
  });
};
