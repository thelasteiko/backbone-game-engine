(function() {
  Backbone.Planet = Backbone.SolidBody.extend({
    defaults: _.extend({}, Backbone.SolidBody.prototype.defaults, {
      name: 'planet',
      spriteSheet: 'planet',
      state: 'locked',
      width: 64, height: 64,
      radius: 32, zIndex: LAYER_MAP.system
    }),
    animations: {
      locked: {
        sequences: [3]
      },
      unlocked: {
        sequences: [0, 1, 2], delay: 800
      }
    },
    initialize: function(attributes, options) {
      Backbone.SolidBody.prototype.initialize.apply(this, arguments);
    },
    draw: function(context, options) {
      return Backbone.SolidBody.prototype.draw.apply(this, arguments);
    },
    onAttach: function() {
      Backbone.SolidBody.prototype.onAttach.apply(this);
      this.listenTo(this.world, 'tap', this.onTap);
      this.listenTo(this, 'unlock', this.unlock);
    },
    onDetach: function() {
      Backbone.SolidBody.prototype.onDetach.apply(this);
      this.stopListening();
    },
    onTap: function(event) {
      // calculate from center
      let c = this.center(), r = this.get('radius');
      let ln = new LinearPath(event.worldX, event.worldY, c.x, c.y);
      if (ln.distance() <= r) {
        // hit within radius of planet; broadcast request
        if (this.get('state') === 'locked')
          Backbone.trigger('request:unlock', this);
        else this.openMenu();
      }
    },
    unlock: function(mothership) {
      this.set("state", 'unlocked');
    },
    openMenu: function() {
      //TODO
      console.log("open menu")
    }
  });
}).call(this);
