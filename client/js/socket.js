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
      socket.emit('join', {user, room});
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
