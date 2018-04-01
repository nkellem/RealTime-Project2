// creates our Player object and holds all our important properties
class Player {
  constructor(name, rad) {
    this.name = name;
    this.angle = Player.generateRandomAngle();
    this.x = Player.generateRandomPoint(true, rad, this.angle);
    this.y = Player.generateRandomPoint(false, rad, this.angle);
    this.prevX = this.x;
    this.prevY = this.y;
    this.destX = this.x;
    this.destY = this.y;
    this.radius = 25;
    this.startAngle = 0;
    this.endAngle = 2 * Math.PI;
    this.alpha = 0;
    this.color = this.generateRandomColor();
    this.lastUpdate = new Date().getTime();
    this.alive = true;
    this.lives = 3;
    this.damageable = true;
    this.immuneTimer = 0;
  }

  // help for this function from stackoverflow
  // https://stackoverflow.com/questions/1484506/random-color-generator
  // generates a random color for our player to be drawn in
  generateRandomColor() {
    this.letters = '0123456789ABCDEF';
    this.newColor = '#';
    for (let i = 0; i < 6; i++) {
      this.newColor += this.letters[Math.floor(Math.random() * 16)];
    }

    return this.newColor;
  }

  // help for this function from stackoverflow
  // https://stackoverflow.com/questions/9879258/how-can-i-generate-random-points-on-a-circles-circumference-in-javascript
  // generates a random spawn coordinate
  static generateRandomPoint(isX, rad, angle) {
    if (isX) {
      return Math.abs(Math.cos(angle) * rad) + rad;
    }
    return Math.abs(Math.sin(angle) * rad) + rad;
  }
  // generates a random angle from the "Safe zone" ring
  static generateRandomAngle() {
    return Math.random() * Math.PI * 2;
  }
}

module.exports = Player;
