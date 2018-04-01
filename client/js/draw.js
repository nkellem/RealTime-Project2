'use strict';

//variables to help with drawing and keeping track of events
let canvas;
let ctx;
let cWidth = 0;
let cHeight =  0;
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
    x: cWidth/2,
    y: cHeight/2,
    radius: 300,
    startAngle: 0,
    endAngle: 2 * Math.PI,
    color: 'black',
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
}

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
        if(currUser.immuneTimer >= 3000 && isHost) {
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
            radius: 30,
          }
          explosions.push(explosion);
        }
      } else {
        if (bomb.exploding) {
          const explosion = {
            owner: bomb.owner,
            timer: 0,
            x: bomb.x,
            y: bomb.y,
            radius: 30,
          }
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
