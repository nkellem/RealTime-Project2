class Player {
  constructor(name) {
    this.name = name;
    this.x = 50;
    this.y = 50;
    this.prevX = 50;
    this.prevY = 50;
    this.destX = 50;
    this.destY = 50;
    this.radius = 50;
    this.startAngle = 0;
    this.endAngle = 2 * Math.PI;
    this.alpha = 0;
    this.color = this.generateRandomColor();
    this.lastUpdate = new Date().getTime();
  }

  //help for this function from stackoverflow
  //https://stackoverflow.com/questions/1484506/random-color-generator
  generateRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random()*16)];
    }

    return color;
  }
}

module.exports = Player;
