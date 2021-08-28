(function() {
  /*
    Custom input handler for touches or clicks on the canvas.
    This does not provide buttons or menu items.
    Some of this is pulled from Backbone.Input, but stripped
    of the extras.
  */
  Backbone.TapInput = Backbone.Model.extend({
    defaults: {
      touchEnabled: false
    },
    initialize: function(attributes, options) {
      options || (options = {});
      this._ongoingTouches = [];

      // Handle touch events
      var touchEnabled =
        "onorientationchange" in window ||
        window.navigator.msMaxTouchPoints ||
        window.navigator.isCocoonJS;
      this.set({touchEnabled: touchEnabled});

      // Debug panel
      var debugPanel = this.debugPanel = options.debugPanel;
      if (debugPanel) {
        this.on("change:pressed", function() {
          debugPanel.set({pressed: this.get("pressed")});
        });
        this.on("change:touched", function() {
          debugPanel.set({touched: this.get("touched")});
        });
        this.on("change:clicked", function() {
          debugPanel.set({clicked: this.get("clicked")});
        });
      }
      if (touchEnabled) {
        // Prevent touch scroll
        $(document).bind("touchmove.InputTouchScroll", function(e) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        });

        // Prevent links from opening popup after a while
        document.documentElement.style.webkitTouchCallout = "none";
      }
      this.on("attach", this.onAttach, this);
      this.on("detach", this.onDetach, this);
    },//init
    onAttach: function() {
      this.onDetach();
      // Handle keyboard input
      $(document).on("keydown.Input", this.onKeydown.bind(this));
      $(document).on("keyup.Input", this.onKeyup.bind(this));

      if (this.hasTouchpad()) {
        if (this.get("touchEnabled")) {
          if (window.navigator.msMaxTouchPoints) {
            $(document).on("pointerdown.InputTouchpad", this.onTapStart.bind(this));
            //$(document).on("pointermove.InputTouchpad", this.onTouchMove.bind(this));
            $(document).on("pointerup.InputTouchpad", this.onTapEnd.bind(this));
            $(document).on("pointercancel.InputTouchpad", this.onTapEnd.bind(this));
          } else {
            $(document).on("touchstart.InputTouchpad", this.onTapStart.bind(this));
            //$(document).on("touchmove.InputTouchpad", this.onTouchMove.bind(this));
            $(document).on("touchend.InputTouchpad", this.onTapEnd.bind(this));
            $(document).on("touchleave.InputTouchpad", this.onTapEnd.bind(this));
            $(document).on("touchcancel.InputTouchpad", this.onTapEnd.bind(this));
          }
        } else {
          // Fallback to handling mouse events
          $(document).on("mousedown.InputTouchpad", this.onTapStart.bind(this));
          $(document).on("mousemove.InputTouchpad", this.onTapStart.bind(this));
          $(document).on("mouseup.InputTouchpad", this.onTapEnd.bind(this));
        }
      }
    },
    onDetach: function() {
      $(document).off(".Input");
      this._ongoingTouches = [];
      if (this.hasTouchpad()) {
        $(document).off(".InputTouchpad");
      }
    },
    hasTouchpad: function() {
      var drawTouchpad = this.get("drawTouchpad");
      if (_.isBoolean(drawTouchpad)) return drawTouchpad;
      if (drawTouchpad == "auto" && this.get("touchEnabled")) return true;
      return false;
    },
    onKeydown: function(e) {
      this.trigger('keydown', e);
    },
    onKeyup: function(e) {
      this.trigger('keyup', e);
    },
    onTapStart: function(e) {
      // e.preventDefault();
      console.log(e);
      this.trigger('tapstart', {x: e.canvasX, y: e.canvasY});
    },
    onTapEnd: function(e) {
      // this is only hitting once so I think we are good
      console.log(e)
      this.trigger('tapend', {x: e.canvasX, y: e.canvasY});
    }
  });

  // Backbone.TappableSprite = Backbone.Sprite.extend({
  //   initialize: function(attributes, options) {
  //     Backbone.Sprite.prototype.initialize.apply(this, arguments);
  //     this.on('attach', this.onAttach, this);
  // });
}).call(this);
