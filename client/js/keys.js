//keep track of which keys are being pressed
const myKeys = {
  'KEY_LEFT': 37,
  'KEY_UP': 38,
  'KEY_RIGHT': 39,
  'KEY_DOWN': 40,
  'KEY_SPACEBAR': 32,
};

const keyDown = {
  'KEY_LEFT': false,
  'KEY_UP': false,
  'KEY_RIGHT': false,
  'KEY_DOWN': false,
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
