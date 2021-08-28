(function() {

  /*
    Ships are made of ship parts. For now these are only
    the shadows of ideas.
    Backbone.Hull
    Backbone.Engine
    Backbone.Scanner
  */

  Backbone.Incubator = Backbone.DataSprite.extend({
    defaults: _.extend({}, Backbone.DataSprite.prototype.defaults, {
      incubationPeriod: 3000,
      survivalRate: 0.7
    }),
    initialize: function(attributes, options) {
      Backbone.DataSprite.prototype.initialize.apply(this, arguments);
    },

  })

  // Backbone.SpawnBucket = Backbone.DataSprite.extend({
  //   defaults: _.extend({}, Backbone.DataSprite.prototype.defaults, {
  //
  //   })
  // });

  /*
    The mothership has little ships, and should be
    in the center of the canvas.
    The mothership is a manager, not a doer
  */
  Backbone.MotherShip = Backbone.SolidBody.extend({
    defaults: _.extend({}, Backbone.SolidBody.prototype.defaults, {
      name: 'mothership',
      spriteSheet: 'mothership',
      state: 'idle',
      width: 32, height: 32,
      radius: 16, zIndex: 1,
      drawCollisionLine: true
    }),
    initialize: function(attributes, options) {
      Backbone.SolidBody.prototype.initialize.apply(this, arguments);
      this.miniships = [];
    },
    animations: {
      idle: {
        sequences: [0, 1, 2, 1],
        delay: 200
      }
    },
    update: function(dt) {
      return Backbone.SolidBody.prototype.update.apply(this, arguments);
    },
    draw: function(context, options) {
      return Backbone.SolidBody.prototype.draw.apply(this, arguments);
    },
    onAttach: function() {
      Backbone.SolidBody.prototype.onAttach.apply(this);
      Backbone.on('request:unlock', this.onRequest, this);
      // TODO add any miniships to world
      if (this.world) {
        for (let i = 0; i < this.miniships.length; i++) {
          if (!this.miniships[i].world)
            this.world.add(this.miniships[i]);
        }
      }
    },
    onDetach: function() {
      Backbone.SolidBody.prototype.onDetach.apply(this);
      this.stopListening();
    },
    onRequest(planet) {
      // console.log(planet);
      if (this.deploy(planet)) {
        planet.trigger('unlock', this);
        this.world.messageBoard.trigger('message', "Unlocked Planet");
      }
    },
    add: function(miniship) {
      let x = this.get('x');
      let y = this.get('y');
      miniship.setOrigin(this);
      // TODO create listener on 'change' event for miniships
      // so that the route is setup properly? or handle
      // everything through mothership?
      miniship.set({
        x: x, y: y,
        state: 'idle',
        deployed: false
      });
      this.miniships.push(miniship);
    },
    deploy: function(planet) {
      // let x = event.worldX, y = event.worldY
      let availableMiniship = undefined;
      for (let i = 0; i < this.miniships.length; i++) {
        if (!this.miniships[i].get("deployed")) {
          availableMiniship = this.miniships[i];
          break;
        }
      }
      if (availableMiniship) {
        availableMiniship.setDestination(planet);
        return true;
      }
      return false;
    },
  });
  /*
    Mini ships serve the motherships in various ways.
    Miniships follow routes. When they reach the end of the route,
    they turn around.
    TODO set the origin and destination to be offset from the radius.
  */
  Backbone.MiniShip = Backbone.SolidBody.extend({
    defaults: _.extend({}, Backbone.SolidBody.prototype.defaults, {
      name: 'miniship',
      spriteSheet: 'miniship',
      state: 'accelerate',
      radius: 8, zIndex: 1,
      speed: 0.8,
      deployed: false,
      width: 32, height: 32,
      drawCollisionLine: true,
      collision: false // don't check collisions until deployed
    }),
    initialize: function(attributes, options) {
      Backbone.SolidBody.prototype.initialize.apply(this, arguments);
      this.route = new LinearPath(this.get('x'), this.get('y'), 0, 0);
    },
    animations: {
      idle: {sequences: [0]},
      travel: {sequences: [2, 3], delay: 200},
      accelerate: {
        sequences: [1, 2, 3],
        nextState: 'travel',
        delay: 200
      },
      deccelerate: {
        sequences: [3, 2, 1],
        delay: 200,
        nextState: 'idle'
      }
    },
    onAttach: function(attributes, options) {
      Backbone.SolidBody.prototype.onAttach.apply(this, arguments);
    },
    draw: function(context, options) {
      return Backbone.SolidBody.prototype.draw.apply(this, arguments);
    },
    update: function(dt) {
      return Backbone.SolidBody.prototype.update.apply(this, arguments);
    },
    onUpdate: function(dt) {
      // update the position based on route and speed
      let state = this.get('state');
      if (state === 'idle') return false;

      let speed = this.get('speed');
      let x = this.get('x');
      let p = this.route.position(x, speed);
      if (!p) { // position is outside line; reverse
        let r = this.get('angle');
        this.set({speed: -speed, angle: reverseAngle(r)});
        //p = this.route.position
      } else {
        this.set({x: p.x, y: p.y})
      }
      return true;
    },
    setOrigin: function(obj) {
      this.origin = obj;
      this.route.setOrigin(obj.get('x'), obj.get('y'));
      this.set({
        state: 'idle',
        deployed: false,
        collision: false,
        x: this.origin.get('x'),
        y: this.origin.get('y')
      });
    },
    // set the destination for the route and update terminal points
    setDestination: function(destination) {
      this.destination = destination;
      if (typeof destination === 'undefined') {
        // reset position to origin and idle
        // TODO have the ship complete it's route before idling
        this.set({
          deployed: false,
          collision: false,
          state: 'deccelerate',
          x: this.origin.get('x'),
          y: this.origin.get('y'),
          angle: 0
        });
        return;
      }
      // let dc = destination.center();
      this.route.setDestination(destination.get('x'), destination.get('y'));
      // reset route terminals to account for radius
      let rship = this.get('radius');
      let rorigin = this.origin.get('radius') + rship,
          rdest = destination.get('radius') + rship,
          tdir = this.route.travelDirection();
      if (tdir) {
        // add origin radius plus ship radius
        // subtract destination radius plus ship radius
        this.route.shiftPoints(rorigin, -rdest);
      } else this.route.shiftPoints(-rorigin, rdest);

      // travel to point, recalibrating position to align with route
      // set to deployed and rotate ship to align with route
      // turn collision back on
      let x = this.route.points[0].x, y = this.route.points[0].y
      this.set({
        state: 'accelerate',
        x: x, y: y,
        deployed: true,
        collision: true,
        angle: this.route.rotationAngle()
      });
    }
  })
}).call(this);
