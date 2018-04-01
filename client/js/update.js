'use strict';
//keep track of how many times the ring has been decreased
let timesRingDecreased = 0;

//update the player's position
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

//when the player has picked a room, show the canvas
const displayCanvas = () => {
  document.querySelector('#joinRoom').style.display =  'none';
  document.querySelector('#canvas').style.display = 'block';
};

//handle keyboard input from the user
const updatePosition = socket => {
  const currUser = users[user];

  //set up keydown event
  window.addEventListener('keydown', e => {
    if (users[user].alive) {
      currUser.prevX = currUser.x;
      currUser.prevY = currUser.y;

      if (keyDown['KEY_LEFT'] && currUser.destX > 0) {
        currUser.destX -= 5;
      }

      if (keyDown['KEY_RIGHT'] && currUser.destX < cWidth) {
        currUser.destX += 5;
      }

      if (keyDown['KEY_UP'] && currUser.destY > 0) {
        currUser.destY -= 5;
      }

      if (keyDown['KEY_DOWN'] && currUser.destY < cHeight) {
        currUser.destY += 5;
      }

      //reset the user's alpha so they are always smoothly animating
      currUser.alpha = 0.05;

      if (isHost) {
        currUser.lastUpdate = new Date().getTime();
        socket.emit('hostUpdatedMovement', currUser);
      } else {
        socket.emit('movementUpdate', currUser);
      }
    }
  });

  window.addEventListener('keyup', e => {
    if (e.keyCode === myKeys['KEY_SPACEBAR']) {
      if (users[user].alive) {
        const bomb = {
          x: currUser.x,
          y: currUser.y,
          timer: 0,
          owner: user,
          exploding: false,
        }

        if (isHost) {
          socket.emit('hostUpdateBombs', bomb);
          bombs.push(bomb);
        } else {
          socket.emit('droppedBomb', bomb);
        }
      }
    }
  });
};

//decrease our ring size
const decreaseRingSize = () => {
  if (timesRingDecreased < 15) {
    timesRingDecreased++;
    ring.radius -= 15;
  }
};
