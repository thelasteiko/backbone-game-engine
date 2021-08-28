(function() {
  Backbone.UIBase = Backbone.Sprite.extend({
    defaults: _.extend({}, Backbone.Sprite.prototype.defaults, {
      name: 'ui-base', type:'ui',
      zIndex: LAYER_MAP.ui, persist: false,
      parent: undefined
    }),
    initialize: function(attributes, options) {
      options || (options = {});
      Backbone.Sprite.prototype.initialize.apply(this, arguments);
      this.properties = options.properties
    },
    update: function(dt) {return false;},
    draw: function(context, options) {return this;}
    //children: [],
    // TODO idk if I like this
    // propagateAttach: function() {
    //   for(let i = 0; i < this.children.length: i++) {
    //     if (this.world) {
    //       this.world.add(this.children[i]);
    //     }
    //   }
    // }
  })
  /*
    A block is a piece of ui. By putting blocks together,
    different sized UI containers can be made. The default
    block is 16x16px
  */
  Backbone.UIBlock = Backbone.UIBase.extend({
    defaults: _.extend({}, Backbone.UIBase.prototype.defaults, {
      name: 'ui-block',
      static: true,
      frame: undefined,
      width: 16, height: 16
    }),
    // blocks don't do anything
    update: function(dt){return true;},
    /*
      Passing in the container's spritesheet allows
      all the blocks to be easily consistent.
    */
    draw: function(context, options) {
      options || (options = {});
      if (!options.spriteSheet) return false;
      let x = this.get("x"), y = this.get('y'),
          frame = options.spriteSheet.frames[this.get('frame')];
      if (options.spriteSheet.img) {
        context.drawImage(options.spriteSheet.img,
          frame.x, frame.y, frame.width, frame.height,
          x, y, frame.width, frame.height
        );
        return true;
      }
    }
  });
  /*
    Allows properties to be applied to a set of content.
    All context properties are listed for reference.
  */
  Backbone.UIProperties = Backbone.Model.extend({
    defaults: _.extend({}, Backbone.Model.prototype.defaults, {
      name: 'ui-properties', type:'ui',
      shapeProperties: {
        lineWidth: undefined,
        strokeStyle: 'red',
        fillStyle: 'rgba(0,0,0,0.0)'
      },
      // Done-ish
      textProperties: {
        font: {
          size: 10, family: 'Consolas, monospace',
          style: undefined, variant: undefined,
          weight: undefined, stretch: undefined,
          height: undefined
        },
        fillStyle: 'rgba(0, 12, 0, 72)',
        // hanging places the top right of the text at x,y
        // default makes text straddle x
        textBaseline: 'hanging'
      },
      // TODO use a spritesheet
      imageProperties: undefined
    }),
    setShapeProperties: function(context){
      let sp = this.get('shapeProperties');
      if (sp.lineWidth) context.lineWidth = sp.lineWidth;
      if (sp.strokeStyle) context.strokeStyle = sp.strokeStyle;
      if (sp.fillStyle) context.fillStyle = sp.fillStyle;
    },
    setImageProperties: function(context){},
    setTextProperties: function(context) {
      let tp = this.get('textProperties'), f = '';
      if (tp.font.style) f += tp.font.style;
      if (tp.font.variant) f += ' ' + tp.font.variant;
      if (tp.font.weight) f += ' ' + tp.font.weight;
      f += ' ' + tp.font.size + 'px';
      if (tp.font.stretch) f += ' ' + tp.font.stretch;
      if (tp.font.height) f += ' ' + tp.font.height;
      f += ' ' + tp.font.family;
      context.font = f;
      context.fillStyle = tp.fillStyle;
      context.textBaseline = tp.textBaseline;
    }
  });
  /*
    Content is text or images to be displayed in a UI container.
    Content is fitted to the width and height as well as possible,
    according to the properties set on the canvas context.
  */
  Backbone.UIContent = Backbone.UIBase.extend({
    defaults: _.extend({}, Backbone.UIBase.prototype.defaults, {
      name: 'ui-content',
      // UIProperties object which sets colors and such
      //properties: undefined,
      // TODO if you want to draw an outline or fill
      shape: undefined,
      text: undefined,
      image: undefined,
      // height of content changes despite bounding box
      fitContentHeight: true
    }),
    initialize: function(attributes, options) {
      options || (options = {});
      Backbone.UIBase.prototype.initialize.apply(this, arguments);
      // this.on('change:text change:width change:height change:x change:y', this.resetText);
      if (!this.properties) this.properties = new Backbone.UIProperties();
      this.textLines = undefined;
    },
    // TODO need to update this if it uses an image instead of text
    needsCallibration: function() {
      return (typeof this.textLines === 'undefined')
    },
    /*
      Height as determined by font and number of lines.
    */
    adjustedHeight: function() {
      if (this.textLines) {
        let fsize = this.properties.get("textProperties").font.size,
            tl = this.textLines.length, offset = 0;
        return (fsize * tl) + offset;
      }
      return 0;
    },
    draw: function(context, options) {
      options || (options = {});
      if (options.properties)
        this.properties = options.properties;
      let x = this.get('x'), y = this.get('y'),
        h = this.get('height'), w = this.get('width');
      context.save();
      // draw shape
      let shape = this.get('shape');
      if (shape) this.properties.setShapeProperties(context);
      switch (shape) {
        case 'circle':
          let c = this.center(), r = this.get('radius');
          if (!c || !r) break;
          context.beginPath();
          context.arc(c.x, c.y, r, 0, 2 * Math.PI);
          context.stroke();
          break;
        case 'rect':
          context.fillRect(x, y, w, h);
          context.strokeRect(x, y, w, h);
          break;
      }
      // TODO image first, then text
      if (!this.textLines) {
        this.calibrate(context);
      } else
        this.properties.setTextProperties(context);

      let lineh = 0;
      if (this.get('fitContentHeight'))
        lineh = this.properties.get("textProperties").font.size;
      else lineh = h / this.textLines.length;
      for (let i = 0; i < this.textLines.length; i++) {
        context.fillText(this.textLines[i], x, y);
        y += lineh;
      }
      context.restore();
    },
    resetText: function() {
      this.textLines = undefined;
    },
    /*
      Calibrate the width of each text line. Height is adjusted
      during draw.
    */
    calibrate(context) {
      this.properties.setTextProperties(context);
      let text = this.get('text'), w = this.get('width');
      let tm = context.measureText(text);
      if (tm.width > w) {
        // calculations based on monospace family
        // calc size of each character
        let cw = tm.width / text.length;
        // split text into words
        let words = text.split(' ');
        let lines = [''], li = 0, isFirst = true;
        for (let i = 0; i < words.length; i++) {
          // width of current word
          //ww = cw * words[i].length;
          // if line plus new word goes over width, add new line
          if ((lines[li] + words[i]).length * cw > w) {
            li += 1
            isFirst = true;
          }
          // add word
          if (isFirst) {
            isFirst = false;
            lines[li] = words[i];
          } else lines[li] += ' ' + words[i];
        }
        this.textLines = lines;
      } else {
        this.textLines = [text]
      }
    }
  });

  /*
    Buttons respond to events and prompt their parent
    UI to do something about it.
  */
  Backbone.UIButton = Backbone.UIBase.extend({
    defaults: _.extend({}, Backbone.UIBase.prototype.defaults, {
      shape: 'rect', radius: 0,
      name: 'ui-btn'
    }),
    center: function() {
      let x = this.get("x") + (this.get("width") / 2);
      let y = this.get("y") + (this.get("height") / 2);
      return {x: x, y: y};
    },
    // initialize: function(attributes, options) {
    //   Backbone.UIBase.prototype.initialize.apply(this, arguments);
    // },
    onAttach: function() {
      this.listenTo(this.world, 'tap', this.onTap);
    },
    onDetach: function() {
      this.stopListening();
    },
    onTap: function(event) {
      // let x = this.get('x'), y = this.get('y')
      //   w = this.get('width'), h = this.get('height'),
      //   ex = event.worldX, ey = event.worldY;
      // if (x < ex && ex < x+w && y < ey && ey < y+h)
      if (this.overlaps(event.worldX, event.worldY))
        this.trigger('pressed', this);
    }
  });
  /*
    Scroll horizontally or vertically. On scroll, the box
    displays the next content, it does not clip around
    content.
  */
  Backbone.UIScrollBox = Backbone.UIBase.extend({
    defaults: _.extend({}, Backbone.UIBase.prototype.defaults, {
      name: 'ui-scrollbox',
      scrollHorizontal: false,
      scrollVertical: true,
      // align items at the bottom of the view
      // new content 'pushes' old content up
      reverse: true,
      spacing: 3,
      // index range of values in view
      viewStartIndex: 0,
      viewEndIndex: 0,
      fullHeight: 0,
      reset: true
    }),
    initialize: function(attributes, options) {
      options || (options = {});
      Backbone.Model.prototype.initialize.apply(this, arguments);
      // place onAttach...
      // this.up = new Backbone.UIButton({name: 'btn-up'});
      // this.down = new Backbone.UIButton({name: 'btn-down'});
      this.content = options.content;
    },
    onAttach: function() {
      // this.world.add(this.up, this.down);
      // this.up.on('pressed', this.onScroll, this.up);
      // this.down.on('pressed', this.onScroll, this.down);
      this.on('change:width change:height change:x change:y', this.resetState);
    },
    onScroll: function(btn){
      //TODO
    },
    resetState: function() {
      this.set('reset', true);
    },
    add: function(content) {
      if (!this.content) this.content = [];
      if (this.get('reverse')) this.content.unshift(content);
      else this.content.push(content);
      this.set('reset', true);
    },
    /*
      Reset content positions and recalibrate.
    */
    calibrate: function(context) {
      let x = this.get('x'), y = this.get('y'),
        h = this.get('height'), w = this.get('width'),
        s = this.get('spacing');
      let fullHeight = 0;
      for (let i = 0; i < this.content.length; i++) {
        // set location info
        this.content[i].set({
          x: x, y: y, width: w,
          fitContentHeight: true
        });
        // have to do this to get correct height
        this.content[i].calibrate(context);
        fullHeight += this.content[i].adjustedHeight() + s;
      }
      this.set('fullHeight', fullHeight - s);
    },
    /*
      Scroll to a specific item so it appears first in
      the list.
    */
    scrollTo: function(index) {
      // we have the true height, now we need only enough
      // content to fill the visible space
      let x = this.get('x'), y = this.get('y'),
        h = this.get('height'), s = this.get('spacing'),
        vs = (index && index > 0 && index < this.content.length ? index : 0),
        ve = this.get('viewEndIndex'),
        r = 1, viewHeight = 0;
      // check alignment
      if (this.get('reverse')) {
        // TODO switch x on scrollHorizontal
        y += (h - this.content[vs].adjustedHeight());
        // subtract to get next top-left
        r = -1;
      }
      // set content invisible
      for (let i = 0; i < this.content.length; i++) {
        this.content[i].set('visible', false);
      }
      // set start point
      this.set('viewStartIndex', vs);
      ve = vs;
      for (; vs < this.content.length; vs++) {
        // check height
        viewHeight += this.content[vs].adjustedHeight();
        if (viewHeight > h) {
          break;
        }
        this.content[vs].set({
          x: x, y: y,
          visible: true
        });
        y += r * (this.content[vs].adjustedHeight() + s);
        ve = vs;
      }
      // set end of view
      this.set('viewEndIndex', ve);
    },
    update: function(dt) {
      if (this.get('reset')) {
        let vs = this.get('viewStartIndex');
        this.calibrate(context);
        this.scrollTo(vs);
        this.set('reset', false);
      }
      return true;
    },
    draw: function(context, options) {
      let vs = this.get('viewStartIndex');
      let ve = this.get('viewEndIndex');
      for (; vs < this.content.length && vs <= ve; vs++) {
        if (this.content[vs].get('visible')){
          this.content[vs].draw(context, options);
        }
      }
      return this;
    }
  });
  /*
    UIContainers are created according to the blocks they
    are made of. They get the width and height of the blocks
    from the default values of the block model.
  */
  Backbone.UIContainer = Backbone.Sprite.extend({
    defaults: _.extend({}, Backbone.Sprite.prototype.defaults, {
      name: 'ui-container', type:'ui',
      spriteSheet: 'ui',
      // Generally, the UI blocks should be divided
      // into a 3x3 grid on the spritesheet.
      frameMap: {
        topLeft: 0, top: 1, topRight: 2,
        midLeft: 3, mid: 4, midRight: 5,
        botLeft: 6, bot: 7, botRight: 8
      },
      // width and height as measured in blocks
      blockWidth: 0, blockHeight: 0,
      blockModel: Backbone.UIBlock,
      // additional space b/t the container and inner content
      padding: 3,
      zIndex: LAYER_MAP.ui,
      redraw: true
    }),
    initialize: function(attributes, options) {
      options || (options = {});
      Backbone.Sprite.prototype.initialize.apply(this, arguments);
      // TODO this is dumb
      // this.on('change:redraw', this.onRedraw);
      // containers are made of blocks
      this.blocks = [];
      this.build();
      if(options.content) this.setContent(options.content);
    },
    build: function() {
      // initialize blocks
      let w = this.get("blockWidth"), h = this.get("blockHeight"),
          minX = this.get("x"), minY = this.get("y"),
          frameMap = this.get('frameMap'),
          blockModel = this.get('blockModel');
      // actual dimensions determined by UIBlock type
      let blw = blockModel.prototype.defaults.width,
          blh = blockModel.prototype.defaults.height;
      let maxX = (minX + (blw * w)), maxY = (minY + (blh * h)),
        x = minX, y = minY;

      // starting at x,y add a block for every #
      for (y = minY; y <= maxY; y += blh) {
        for (x = minX; x <= maxX; x += blw) {
          let frameIndex = 0;
          // nine cases
          if (x === minX) {
            if (y === minY) frameIndex = frameMap.topLeft;
            else if (minY < y && y < maxY) frameIndex = frameMap.midLeft;
            else if (y === maxY) frameIndex = frameMap.botLeft;
          } else if (minX < x && x < maxX) {
            if (y === minY) frameIndex = frameMap.top;
            else if (minY < y && y < maxY) frameIndex = frameMap.mid;
            else if (y === maxY) frameIndex = frameMap.bot;
          } else if (x === maxX) {
            if (y === minY) frameIndex = frameMap.topRight;
            else if (minY < y && y < maxY) frameIndex = frameMap.midRight;
            else if (y === maxY) frameIndex = frameMap.botRight;
          }
          this.blocks.push(new blockModel({
            x: x, y: y, frame: frameIndex
          }));
        }
      }
      // x = maxX + blw; y = maxY + blh
      // set total width and height
      this.set({
        width: x - minX, height: y - minY
      });
      let p = this.get('padding');
      // define inner dimensions for drawing contents
      this.innerDimensions = {
        x: minX + blw + p, y: minY + blh + p,
        // width: (x - minX) - (2 * blw) - im,
        width: (maxX - p) - (minX + blw + p),
        // height: (y - minY) - (2 * blh) - im
        height: (maxY - p) - (minY + blh + p)
      }
    },
    onAttach: function() {
      this.on('message', this.onMessage, this);
    },
    onRedraw: function() {
      this.set('redraw', true);
      this.world.requestBackgroundRedraw = true
    },
    onMessage: function(msg) {
      this.setContent(new Backbone.UIContent({
        text: msg, shape: 'rect'
      }));
      this.trigger('redraw', this);
    },
    setContent: function(content) {
      // define content bounds
      content.set({
        x: this.innerDimensions.x,
        y: this.innerDimensions.y,
        width: this.innerDimensions.width,
        height: this.innerDimensions.height
      }, {properties: new Backbone.UIProperties()});
      this.content = content;
    },
    update: function(dt) {
      if (this.content)
        if (this.content.update(dt)) this.set({redraw: true});
      return true;
    },
    draw: function(context, options) {
      if (this.get('redraw')) {
        // draw each block, then the contents
        for (let i = 0; i < this.blocks.length; i++) {
          this.blocks[i].draw(context, {
            spriteSheet: this.spriteSheet
          });
        }
        if (this.content) this.content.draw(context, options);
        // this.set('redraw', false);
      }
      return this;
    }
  });
}).call(this);
