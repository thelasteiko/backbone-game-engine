
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}
let MARGIN_OF_ERROR = 3.0;
// angles must be +/- 180
function reverseAngle(theta) {
  if (theta === 0) return 180;
  let t = Math.abs(theta)
  t = -(90 + (90 - t));
  if (theta < 0) return -t;
  return t;
}
/*
  A way for sprites to travel along linear paths.
  We keep it simple for now.

  A linear path has:
    * two end points
    * distance (hypotenuse)
    * formula for position
      - y = mx + b
    * modifer given travel speed
      - in: original x,y coord + how far I want to go
      - out: x,y coord
    * angle
*/
class LinearPath {
  constructor(x1, y1, x2, y2) {
    this.points = [
      {x: parseFloat(x1), y: parseFloat(y1)},
      {x: parseFloat(x2), y: parseFloat(y2)}
    ];
    // b = y - mx
    this.intercept = parseFloat(y1) - this.slope()*parseFloat(x1);
  }
  setOrigin(x, y) {
    this.points[0].x = parseFloat(x);
    this.points[0].y = parseFloat(y);
    // b = y - mx
    this.intercept = this.points[0].y - this.slope()*this.points[0].x;
  }
  setDestination(x, y) {
    this.points[1].x = parseFloat(x);
    this.points[1].y = parseFloat(y);
    // b = y - mx
    this.intercept = this.points[0].y - this.slope()*this.points[0].x;
  }
  /*
    Shift origin and destination by the given distances.
  */
  shiftPoints(r1, r2) {
    let np1 = this.position(this.points[0].x, parseFloat(r1));
    if (!np1) return;
    this.setOrigin(np1.x, np1.y);
    let np2 = this.position(this.points[1].x, parseFloat(r2));
    if (!np1 || !np2) return;
    this.setDestination(np2.x, np2.y);
  }
  isPoint() {
    return (Math.abs(this.points[0].x - this.points[1].x) < MARGIN_OF_ERROR &&
      Math.abs(this.points[0].y - this.points[1].y) < MARGIN_OF_ERROR)
  }
  distance() {
    let dx = this.points[1].x - this.points[0].x;
    let dy = this.points[1].y - this.points[0].y;
    return Math.sqrt(dx**2 + dy**2);
  }
  slope() {
    let dx = this.points[1].x - this.points[0].x;
    let dy = this.points[1].y - this.points[0].y;
    if (dy === 0) return 0;
    return (dy/dx);
  }
  calibrate(x) {
    return this.slope()*parseFloat(x) + this.intercept;
  }
  /*
     Calculate the x,y position along the line given the
     starting x position and the distance to travel.
  */
  position(x, s) {
    let dx = s < 0 ? -1 : 1;
    let m = this.slope();
    // if the slop is negative, do opposite of whatever x is doing
    let dy = m < 0 ? -dx : dx;
    let b = this.intercept;
    let y = m*parseFloat(x) + b
    //console.log('y=' + y);
    // derived from distance and slope formulas
    let xi = (Math.sqrt(parseFloat(s)**2/(m**2 + 1)));
    let yi = (Math.sqrt(parseFloat(s)**2/((1/m**2) + 1)));
    let np = {
      x: (x + dx*xi),
      y: (y + dy*yi)
    }
    // if the new point is past the line don't continue
    let lx = this.points[0].x < this.points[1].x ? this.points[0].x : this.points[1].x;
    let ly = this.points[0].y < this.points[1].y ? this.points[0].y : this.points[1].y;
    let by = this.points[0].y > this.points[1].y ? this.points[0].y : this.points[1].y;
    let bx = this.points[0].x > this.points[1].x ? this.points[0].x : this.points[1].x;
    if (lx <= np.x && np.x <= bx && ly <= np.y && np.y <= by) {
      return np;
    }
    return false;
  }
  /*
    True if +s will go towards destination point,
    False if -s will go towards origin point.
  */
  travelDirection() {
    return this.points[0].x < this.points[1].x;
  }
  atEnd(x, s) {
    // can think of this like a 'box'
    let lx = this.points[0].x < this.points[1].x ? this.points[0].x : this.points[1].x;
    let ly = this.points[0].y < this.points[1].y ? this.points[0].y : this.points[1].y;
    let bx = this.points[0].x > this.points[1].x ? this.points[0].x : this.points[1].x;
    let by = this.points[0].y > this.points[1].y ? this.points[0].y : this.points[1].y;
    let np = this.position(x, s);
    if (lx <= np.x && np.x <= bx && ly <= np.y && np.y <= by) {
      return false;
    }
    return true;
  }
  rotationAngle() {
    // angle b/t the origin and destination, from north direction
    // +/- 180
    // shift the destination by the same amount I shift the origin
    let x1 = this.points[0].x, y1 = this.points[0].y;
    let x2 = this.points[1].x - x1, y2 = this.points[1].y - y1;
    // returns -90 to 90; from x axis
    let theta = Math.atan2(y2, x2) * 180 / Math.PI;
    // switch to y axis
    theta += 90;
    // handle overage
    if (theta > 180) {
      let d = theta - 180;
      theta = -(180 - d);
    }
    // reverse if point left of axis
    if (x2 < 0) theta = reverseAngle(theta);
    return theta;
  }
}//LinearPath

// let lp = new LinearPath(1, 1, 3, 8);
// console.log(lp);
// console.log('d=' + lp.distance());
// console.log('m=' + lp.slope());
// console.log('b=' + lp.offset)
// let pt = lp.position(3, 2);
// console.log(`p(3, 2)=${pt.x}, ${pt.y}`);
