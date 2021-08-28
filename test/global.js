let LAYER_MAP = {
  background: 0,
  system: 1,
  mothership: 2,
  miniship: 3,
  hud: 4,
  ui: 5
}

function generateStarField(width, height) {
  let starNumber = randInt(50, 100);
  let starAry = []
  for (let i = 0; i < starNumber; i++) {
    let rx = randInt(0, width), ry = randInt(0, height);
    starAry.push({name: 'star', x: rx, y: ry});
  }
  return starAry
}
