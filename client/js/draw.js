'use strict';

let canvas;
let ctx;
let cWidth = 0;
let cHeight=  0;
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
