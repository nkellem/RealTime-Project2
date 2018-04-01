//reference for circle collision detection from Mozilla MDN
//https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
//detects collisions between two circles
const checkCircleCollision = (circle1, circle2) => {
  const dx = circle1.x - circle2.x;
  const dy = circle1.y - circle2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < (circle1.radius + circle2.radius)) {
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
