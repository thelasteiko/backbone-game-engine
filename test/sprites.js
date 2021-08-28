(function() {

  /*
    Provides chaining of animations, calcuation of the center
    point, and rotating on draw.
  */
  Backbone.AnimatedSprite = Backbone.Sprite.extend({
    defaults: _.extend({}, Backbone.Sprite.prototype.defaults, {
      // in degrees; positive to the right, negative to the left
      angle: 0
    }),
    // retrieved the next animation if at the end of the current
    getAnimation: function(state) {
      let anim = this.animations[state || this.attributes.state];
      if (typeof anim !== 'undefined' && anim.nextState) {
        let sequenceIndex = this.get('sequenceIndex') || 0;
        if (sequenceIndex === anim.sequences.length - 1) {
          this.set({
            state: anim.nextState,
            sequenceIndex: (sequenceIndex < anim.sequences.length-1 ? sequenceIndex+1 : 0)
          });
          anim = this.animations[anim.nextState];
        }
      }
      return anim
    },
    center: function() {
      let x = this.get("x") + (this.get("width") / 2);
      let y = this.get("y") + (this.get("height") / 2);
      return {x: x, y: y};
    },
    draw: function(context, options) {
      // if we are rotating, move x, y coord to center
      let x = this.get('x'), y = this.get('y'), r = this.get("angle");
      if ((r > 0 && r <= 180) || (r < 0 && r >= -180)) {
        let c = this.center();
        this.set({x: c.x, y: c.y});
      }
      Backbone.Sprite.prototype.draw.apply(this, arguments);
      // reset if rotated
      if ((r > 0 && r <= 180) || (r < 0 && r >= -180)) {
        this.set({x: x, y: y});
      }
      return this;
    }
  });

  /*
    Solid bodies can check for and respond to collisions.
    Since this uses a circle instead of a square for collision,
    detection is much simpler.

    NOTE: overwrites the overlaps function
  */
  Backbone.SolidBody = Backbone.AnimatedSprite.extend({
    defaults: _.extend({}, Backbone.AnimatedSprite.prototype.defaults, {
      collision: true,
      drawCollisionLine: false,
      // width / 2 OR 0
      radius: (Backbone.AnimatedSprite.prototype.defaults['width'] ? Backbone.AnimatedSprite.prototype.defaults['width'] : 0) / 2
    }),
    overlaps: function(obj) {
      let r = this.get("radius");
      let o = obj;
      if (o instanceof Event) o = {
        attributes: {
          x: obj.worldX, y: obj.worldY,
          width: 5, height: 5
        }
      }

      if(typeof r !== 'undefined') {
        // use circle to check if inside
        let c1 = this.center(), c2 = obj.center(),
          r2 = obj.get('radius');
        c2 || (c2 = o);
        r2 || (r2 = 0);
        let ln = new LinearPath(c1.x, c1.y, c2.x, c2.y);
        if (ln.distance() <= r + r2) return true;
        else return false;
      } else {
        // call sprite's overlap
        return Backbone.Sprite.prototype.overlaps.call(this, o);
      }
    },
    draw: function(context, options) {
      // call original
      Backbone.AnimatedSprite.prototype.draw.apply(this, arguments);
      // draw debug circle if applicable
      if (this.get("drawCollisionLine")) {
        let c = this.center(), r = this.get("radius");
        context.save();
        context.strokeStyle = 'red';
        context.beginPath();
        context.arc(c.x, c.y, r, 0, 2 * Math.PI);
        context.stroke();
        context.restore();
      }
      return this;
    }
  });
  /*
    Holds a value that can be attached to the engine for updates.
    The data value is always positive.
  */
  Backbone.DataSprite = Backbone.Model.extend({
    defaults: _.extend({}, Backbone.Model.prototype.defaults, {
      name: 'data-basic',
      value: 0
    }),
    update: function(dt) {return true;},
    draw: function(context, options) {return this;},
    /*
      Removes the specified amount from the value and returns it.
      If the amount is less than the value, it returns the value.
    */
    subtract: function(amount) {
      let v = this.get('value');
      if (v >= amount) {
        this.set('value', v - amount);
        return amount;
      } else {
        this.set('value', 0);
        return v;
      }
    },
    /*
      Splits into a new object.
      If an object is provided, this will subtract the amount
      from this value, and add it to the object's value.
      Otherwise returns a new object of the same type with
      the specified amount.
    */
    split: function(amount, obj) {
      let v = this.get('value');
      if (typeof obj === 'object') {
        let a = obj.get('value');
        if (v >= amount) {
          this.set('value', v - amount);
          obj.set('value', amount + a);
        } else {
          this.set('value', 0);
          obj.set('value', a + v);
        }
      } else {
        if (v >= amount) {
          this.set('value', v - amount);
          let obj = new this.prototype.constructor({
            value: amount
          });
          return obj;
        } else {
          this.set('value', 0);
          let obj = new this.prototype.constructor({
            value: v
          });
          return obj;
        }
      }
    },
    /*
      Adds the amount to the value and returns the result,
      or 0 if amount < 0
    */
    add: function(amount) {
      let v = this.get('value');
      if (amount > 0) {
        this.set('value', v + amount);
        return v + amount;
      }
      return 0;
    },
    /*
      Adds up a list of numbers and/or data objects and sets
      the value of this object.
    */
    merge: function(...objs) {
      let v = this.get('value');
      objs.forEach((item, i) => {
        if (typeof item === 'object') v += item.get('value');
        else v += item;
      });
      this.set('value', v);
    }
  });
}).call(this);
