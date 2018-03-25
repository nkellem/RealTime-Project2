'use strict';

let canvas;
let ctx;
let cWidth = 0;
let cHeight = 0;
let animationFrame;
let socket;

//get the canvas and drawing context so we can begin drawing
const getCanvas = () => {
  canvas = document.querySelector('#canvas');
  ctx = canvas.getContext('2d');
  cWidth = canvas.width;
  cHeight = canvas.height;
};

//
const getSocket = sock => {
  socket = sock;
};

//function to lerp (linear interpolation)
//Takes position one, position two and the
//percentage of the movement between them (0-1)
//taken from class example
const lerp = (v0, v1, alpha) => {
  return (1 - alpha) * v0 + alpha * v1;
};

const redraw = time => {
  //update the user's positions
  updatePosition(socket);

  //clear the canvas
  ctx.clearRect(0, 0, cWidth, cHeight);

  const userNames = Object.keys(users);

  //draw each user
  userNames.forEach(userName => {
    const currUser = users[userName];

    //if alpha is less than 1, increase it by 0.05
    if (currUser.alpha < 1) {
      currUser.alpha += 0.05;
    }

    currUser.x = lerp(currUser.prevX, currUser.destX, currUser.alpha);
    currUser.y = lerp(currUser.prevY, currUser.destY, currUser.alpha);

    ctx.fillStyle = currUser.color;
    ctx.beginPath();
    ctx.arc(currUser.x, currUser.y, currUser.radius, currUser.startAngle, currUser.endAngle);
    ctx.closePath();
    ctx.fill();
  });

  //set our next animation frame
  animationFrame = requestAnimationFrame(redraw);
};
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
};

//holds all our host socket events
const hostEvents = sock => {
  userJoined(sock);
  userUpdatedMovement(sock);
};
'use strict';

const init = () => {
  getCanvas();
  joinRoom();
};

window.onload = init;
'use strict';

let user = '';
let room = '';
let isHost = false;

const joinRoom = () => {
  const submitJoin = document.querySelector('#roomJoin');
  submitJoin.addEventListener('click', e => {
    //override standard form submit functionality
    e.preventDefault();

    room = document.querySelector('#roomName').value;
    user = document.querySelector('#username').value;

    const socket = io.connect();
    getSocket(socket);

    socket.on('connect', () => {
      socket.emit('join', { user, room });
      displayCanvas();
    });

    //only fires if this socket is the host
    socket.on('hostConfirmation', data => {
      isHost = true;
      hostConfirmation(data);
      //set up all our host methods
      hostEvents(socket);
      requestAnimationFrame(redraw);
    });

    socket.on('clientGetUsers', data => {
      users = data;
      console.log(users);
      requestAnimationFrame(redraw);
    });

    socket.on('hostUpdatedMovement', data => {
      updateUser(data);
    });
  });
};
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
  document.querySelector('#joinRoom').style.display = 'none';
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
