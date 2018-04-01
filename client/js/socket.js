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
      socket.emit('join', {user, room, radius: ring.radius});
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
