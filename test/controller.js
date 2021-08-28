$(window).on('load', function() {
  var canvas = document.getElementById("foreground"),
      context = canvas.getContext("2d");
  adjustViewport(canvas);

  Backbone.Controller = Backbone.Model.extend({
    initialize: function(attributes, options) {
      options || (options = {});
      this.spriteSheets = new Backbone.SpriteSheetCollection([
        {id: 'stars', img: '#stars'},
        {id: 'mothership', img: '#mothership'},
        {id: 'miniship', img: '#miniship'},
        {id: 'planet', img: '#planet'},
        {id: 'ui', img: '#ui'}
      ]).attachToSpriteClasses();
      this.debugPanel = new Backbone.DebugPanel();
      // this.input = new Backbone.TapInput();
      this.world = new Backbone.World(_.extend({}, {
        x: 0, y: 0, tileWidth: 32, tileHeight: 32,
        width: Math.floor((canvas.width) / 32),
        height: Math.floor((canvas.height) / 32),
        backgroundColor: "rgb(29, 23, 33)",
        name: "system"
        // generate backfield
        // sprites: generateStarField(canvas.width-10, canvas.height-10)
      }, {
        // input: this.input
      }));

      this.mothership = new Backbone.MotherShip({
        x: Math.floor((canvas.width-10) / 2) - 16,
        y: Math.floor((canvas.height-10) / 2) - 16,
        zIndex: LAYER_MAP.mothership
      });
      let miniship = new Backbone.MiniShip({
        zIndex: LAYER_MAP.miniship
      });
      let planet = new Backbone.Planet({
        x: 548, y: 595, zIndex: LAYER_MAP.system
      });
      let messageBoard = new Backbone.UIContainer({
        x: 10, y: 10,
        blockWidth: 6, blockHeight: 5
      });
      let scrollBox = new Backbone.UIContainer({
        name: 'scrollbox',
        x: 10, y: 100,
        blockWidth: 6, blockHeight: 10
      }, {
        content: new Backbone.UIScrollBox({}, {
          content: [
            new Backbone.UIContent({text: 'Content 1'}),
            new Backbone.UIContent({text: 'Content 2'}),
            new Backbone.UIContent({text: 'Content 3'})
          ]
        })
      });
      console.log(this.world.buildIdFromClassCounter(miniship));
      console.log(this.world.buildIdFromClassCounter(scrollbox));
      // let btn = new Backbone.Element({
      //   x: 10, y: 600, width: 100, height: 50,
      //   text: "test", zIndex: 5
      // });
      this.mothership.add(miniship);
      this.world.messageBoard = messageBoard
      this.world.add([this.mothership, planet, messageBoard, scrollBox]);

      this.engine = new Backbone.Engine({
        tapDetectionDelay: 50
      }, {
        canvas: canvas, debugPanel: this.debugPanel
        // input: this.input
      });
      this.engine.add(_.compact([
        this.world, this.debugPanel
      ]));
    },//initialize
    buildRouting: function() {

    }
  });//Controller

  let controller = new Backbone.Controller();

  _.extend(window, {
    canvas: canvas,
    context: context,
    controller: controller
  });
})
