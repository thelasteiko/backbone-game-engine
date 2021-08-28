// TODO improve clock referencing
(function() {
  // use the HTML tag to store the image metadata
  Backbone.SpriteImage = Backbone.SpriteSheet.extend({
    initialize: function(attributes, options) {
      this.on("spawnImg", this.recoverImageAttr, this);
      Backbone.SpriteSheet.prototype.initialize.apply(this, arguments);
    },
    recoverImageAttr: function() {
      if (this.img instanceof HTMLImageElement) {
        this.set({
          tileWidth: this.get("tileWidth") || parseInt(this.img.getAttribute("tile-width")),
          tileHeight: this.get("tileHeight") || parseInt(this.img.getAttribute("tile-height")),
          tileColumns: this.get("tileColumns") || parseInt(this.img.getAttribute("tile-columns")),
          tileRows: this.get('tileRows') || parseInt(this.img.getAttribute("tile-rows"))
        });
        // recalculate frames
        this.buildFrames();
      }
      return this;
    }
  });
  // change type of object expected
  Backbone.SpriteSheetCollection.prototype.model = Backbone.SpriteImage;

  /*
    DONE modify the world object to use radial collisions
         accomplished through overwriting the collision check in sprite
    DONE use static image for background instead of tiles
    DONE enforce draw order
    TODO sort objects into groups; see Backbone.World.setupSpriteLayers
  */
}).call(this);
