'use strict';

//variables to help with drawing and keeping track of events

let canvas;
let ctx;
let cWidth = 0;
let cHeight = 0;
let animationFrame;
let socket;
let lastFrameCalled = 0;
let dt = 0;
let currentTime = 0;
let livesPlacementX = 0;
let ring = {};

//give the "safe zone" ring its initial properties so it may be drawn
const initializeRing = () => {
  ring = {
    x: cWidth / 2,
    y: cHeight / 2,
    radius: 300,
    startAngle: 0,
    endAngle: 2 * Math.PI,
    color: 'black'
  };
};

//handles drawing bombs players drop
const drawBomb = (x, y) => {
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
};

//handles drawing explosions from bombs after a certain amount of time has passed
const drawExplosion = (x, y, radius) => {
  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
};

//draws the "safe zone" ring and keeps it updated
const drawRing = () => {
  //console.dir(ring.radius);
  ctx.strokeStyle = ring.color;
  ctx.beginPath();
  ctx.arc(ring.x, ring.y, ring.radius, ring.startAngle, ring.endAngle);
  ctx.closePath();
  ctx.stroke();
};

//draws the player HUD so they know if they have died or how many lives they have left
const drawHUD = () => {
  ctx.fillStyle = users[user].color;
  ctx.font = '50px Georgia';
  if (users[user].alive) {
    ctx.fillText(`Lives: ${users[user].lives}`, livesPlacementX, 50);
  } else {
    ctx.fillText(`You Died`, livesPlacementX - 25, 50);
  }
};

//get the canvas and drawing context so we can begin drawing
const getCanvas = () => {
  canvas = document.querySelector('#canvas');
  ctx = canvas.getContext('2d');
  cWidth = canvas.width;
  cHeight = canvas.height;
  livesPlacementX = cWidth - 200;

  //establish properties of the play spaces
  initializeRing();
};

//method that helps get the socket from the socket.js file
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

//the game loop
//keeps track of everything that should be drawn
const redraw = time => {
  //clear the canvas
  ctx.clearRect(0, 0, cWidth, cHeight);

  //redraw our player area
  drawRing();
  //detect collisions if host
  if (isHost) {
    detectCollisions(socket);
  }
  //draw our HUD
  drawHUD();

  const userNames = Object.keys(users);

  //draw each user
  userNames.forEach(userName => {
    const currUser = users[userName];

    if (currUser.alive) {
      if (!currUser.damageable) {
        currUser.immuneTimer += dt;
        if (currUser.immuneTimer >= 3000 && isHost) {
          currUser.damageable = true;
          currUser.immuneTimer = 0;
          hostResetUser(socket, userName);
        }
      }

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
    }

    //draw our bombs
    bombs.forEach(bomb => {
      if (isHost) {
        bomb.timer += dt;
        if (bomb.timer >= 3000) {
          let index = bombs.indexOf(bomb);
          bombs.splice(index, 1);
          hostTriggerExplosion(socket, bomb);
          const explosion = {
            owner: bomb.owner,
            timer: 0,
            x: bomb.x,
            y: bomb.y,
            radius: 30
          };
          explosions.push(explosion);
        }
      } else {
        if (bomb.exploding) {
          const explosion = {
            owner: bomb.owner,
            timer: 0,
            x: bomb.x,
            y: bomb.y,
            radius: 30
          };
          explosions.push(explosion);
          let index = bombs.indexOf(bomb);
          console.log(bombs);
          bombs.splice(index, 1);
          console.log(bombs);
        }
      }
      drawBomb(bomb.x, bomb.y);
    });

    //draw our explosions
    explosions.forEach(explosion => {
      explosion.timer += dt;
      if (explosion.timer >= 2000) {
        const index = explosions.indexOf(explosion);
        explosions.splice(index, 1);
      }

      drawExplosion(explosion.x, explosion.y, explosion.radius);
    });
  });

  //keep track of time since the last frame
  currentTime = performance.now();
  dt = currentTime - lastFrameCalled;
  lastFrameCalled = currentTime;
  //set our next animation frame
  animationFrame = requestAnimationFrame(redraw);
};
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
    socket.emit('hostSendUsers', { users: users, ringSize: timesRingDecreased, radius: ring.radius, bombs: bombs });

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
const clientDroppedBomb = sock => {
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
  socket.emit('hostSendUserDied', { user });
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
//keep track of which keys are being pressed
const myKeys = {
  'KEY_LEFT': 37,
  'KEY_UP': 38,
  'KEY_RIGHT': 39,
  'KEY_DOWN': 40,
  'KEY_SPACEBAR': 32
};

const keyDown = {
  'KEY_LEFT': false,
  'KEY_UP': false,
  'KEY_RIGHT': false,
  'KEY_DOWN': false
};

//set up keydown event
//updates the key daemon so we know what is being pressed
window.addEventListener('keydown', e => {
  if (e.keyCode === myKeys['KEY_LEFT']) {
    keyDown['KEY_LEFT'] = true;
  }

  if (e.keyCode === myKeys['KEY_RIGHT']) {
    keyDown['KEY_RIGHT'] = true;
  }

  if (e.keyCode === myKeys['KEY_UP']) {
    keyDown['KEY_UP'] = true;
  }

  if (e.keyCode === myKeys['KEY_DOWN']) {
    keyDown['KEY_DOWN'] = true;
  }
});

//set up keyup event
window.addEventListener('keyup', e => {
  if (e.keyCode === myKeys['KEY_LEFT']) {
    keyDown['KEY_LEFT'] = false;
  }

  if (e.keyCode === myKeys['KEY_RIGHT']) {
    keyDown['KEY_RIGHT'] = false;
  }

  if (e.keyCode === myKeys['KEY_UP']) {
    keyDown['KEY_UP'] = false;
  }

  if (e.keyCode === myKeys['KEY_DOWN']) {
    keyDown['KEY_DOWN'] = false;
  }
});
'use strict';

//initializes our app

const init = () => {
  getCanvas();
  joinRoom();
};

window.onload = init;
//reference for circle collision detection from Mozilla MDN
//https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
//detects collisions between two circles
const checkCircleCollision = (circle1, circle2) => {
  const dx = circle1.x - circle2.x;
  const dy = circle1.y - circle2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < circle1.radius + circle2.radius) {
    return true;
  }

  return false;
};

//checks to see if players are still within the ring
const checkIfInCircle = circle => {
  if (!checkCircleCollision(circle, ring)) {
    return false;
  }

  return true;
};

//host method that checks for collisions and updates the simulation
const detectCollisions = socket => {
  const userKeys = Object.keys(users);

  userKeys.forEach(userKey => {
    if (!checkIfInCircle(users[userKey], ring)) {
      //console.log(`${userKey1} has died`);
      hostSendUserDied(socket, userKey);
    }
    explosions.forEach(explosion => {
      if (userKey !== explosion.owner) {
        if (checkCircleCollision(users[userKey], explosion)) {
          //console.log(`Collision between ${userKey1} and ${userKey2} detected`);
          if (isHost) {
            if (users[userKey].damageable) {
              users[userKey].lives--;
              users[userKey].damageable = false;
              userHitByBomb(socket, userKey);
              if (users[userKey].lives <= 0) {
                hostSendUserDied(socket, userKey);
              }
            }
          }
        }
      }
    });
  });
};
'use strict';

let user = '';
let room = '';
let isHost = false;

//sets up all of the client websocket events and confirms the host
const joinRoom = () => {
  const submitJoin = document.querySelector('#roomJoin');
  submitJoin.addEventListener('click', e => {
    //override standard form submit functionality
    e.preventDefault();

    room = document.querySelector('#roomName').value;
    user = document.querySelector('#username').value;

    const socket = io.connect();
    getSocket(socket);

    //dictates what to do when connecting to the server
    socket.on('connect', () => {
      socket.emit('join', { user, room, radius: ring.radius });
      displayCanvas();
      socket.on('hostSendUserDied', data => {
        users[data.user].alive = false;
      });
    });

    //only fires if this socket is the host
    //initializes all of the host's websocket events
    socket.on('hostConfirmation', data => {
      isHost = true;
      hostConfirmation(data);
      //set up all our host methods
      hostEvents(socket);
      requestAnimationFrame(redraw);
      updatePosition(socket);
    });

    //client gets its data/game objects on initial connect
    socket.on('clientGetUsers', data => {
      users = data.users;
      console.log(users);
      timesRingDecreased = data.ringSize;
      ring.radius = data.radius;
      bombs = data.bombs;
      console.log(bombs);
      console.log(data.bombs);
      requestAnimationFrame(redraw);
      updatePosition(socket);
    });

    //updates ring size when host dictates
    socket.on('hostSendRingSize', data => {
      timesRingDecreased = data.ringSize;
      ring.radius = data.radius;
    });

    //updates player positions
    socket.on('hostUpdatedMovement', data => {
      updateUser(data);
    });

    //tells the client to decrease the size of the "safe zone" ring
    socket.on('hostUpdateRingSize', () => {
      decreaseRingSize();
    });

    //tells client when a user has died
    socket.on('hostSendUserDied', data => {
      users[data.user].alive = false;
    });

    //tells the client a bomb has been dropped
    socket.on('hostUpdateBombs', data => {
      bombs.push(data);
      console.log(bombs);
    });

    //tells the client when a bomb should explode
    socket.on('hostTriggerExplosion', data => {
      for (let i = 0; i < bombs.length; i++) {
        if (bombs[i].owner === data.owner) {
          console.log(data.owner + ' ' + bombs[i]);
          bombs[i].exploding = true;
          break;
        }
      }
    });

    //tells the client when a user has been hit by a bomb
    socket.on('hostUserHitByBomb', data => {
      users[data].lives--;
      users[data].damageable = false;
    });

    //tells the client when a user can be hit again
    socket.on('hostResetUser', data => {
      users[data].damageable = true;
      users[data].immuneTimer = 0;
    });
  });
};
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
  document.querySelector('#joinRoom').style.display = 'none';
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
          exploding: false
        };

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
