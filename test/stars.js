(function() {
Backbone.Star = Backbone.AnimatedSprite.extend({
  defaults: _.extend({}, Backbone.AnimatedSprite.prototype.defaults, {
    name: 'star',
    spriteSheet: 'stars',
    state: 'twinkle1',
    width: 16, height: 16, zIndex: 0
  }),
  animations: {
    twinkle1: {
      sequences: [0, 1, 2, 3],
      delay: 100
    },
    twinkle2: {
      sequences: [4, 5, 6, 7],
      delay: 200
    },
    twinkle3: {
      sequences: [8, 9, 10, 11],
      delay: 70
    },
    twinkle4: {
      sequences: [12, 13, 14, 15],
      delay: 200
    }
  },
  initialize: function(attributes, options) {
    Backbone.AnimatedSprite.prototype.initialize.apply(this, arguments);
    let twinkleNumber = randInt(1, 5);
    this.set({state: 'twinkle' + twinkleNumber});
  },
  placeRandomly: function() {
    let cw = this.engine.canvas.width, ch = this.engine.canvas.height
    let rx = randInt(0+10, cw-10), ry = randInt(0+10, ch-10)
    this.set({x: rx, y: ry});
  }
});
}).call(this);
