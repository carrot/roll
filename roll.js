/*!
* Copyright (c) 2015 Carrot Creative
*
* Permission is hereby granted, free of charge, to any person obtaining
* a copy of this software and associated documentation files (the
* "Software"), to deal in the Software without restriction, including
* without limitation the rights to use, copy, modify, merge, publish,
* distribute, sublicense, and/or sell copies of the Software, and to
* permit persons to whom the Software is furnished to do so, subject to
* the following conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
* MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
* LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
* OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
* WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

(function (win, doc) {

  function __() {

    var RegexpValue = /[\-+]?[\d]*\.?[\d]+/g
      , ParseWildcard = '{?}'
      , ParseWildcardRegexp = /\{\?\}/g;

    var Animation = function (component) {
      var tweens = []
        , points = component.points
        , current, next;
      for (var i=0; i<points.length; i++) {
        current = points[i];
        next = points[i+1];
        tweens.push(new Tween(component.property, current, next));
      }
      this.tweens = tweens;
    }

    Animation.prototype = {
      current: function (Y) {
        var tweens = this.tweens
          , len = tweens.length
          , tween
          , current;
        for (var i=0; i<len; i++) {
          tween = tweens[i];
          if (Y >= tween.fromY || (Y <= tween.fromY && i == 0)){
            current = tween.current(Y);
          }
        }
        return current;
      }
    }

    var Tweener = {};

    Tweener.default = function (fromValue, toValue) {
      this.fromValue = ParseValue(fromValue);
      this.toValue = ParseValue(toValue);
    }

    Tweener.default.prototype = {
      tween: function (pct) {
        var fromValue = this.fromValue
          , toValue = this.toValue;
        return CompileValues(fromValue, toValue, pct);
      }
    }

    var Tween = function (property, fromPoint, toPoint) {
      if (!toPoint) toPoint = fromPoint;
      this.tweener = new (Tweener[property] || Tweener.default)(fromPoint.value, toPoint.value);
      this.fromY = fromPoint.Y;
      this.toY = toPoint.Y;
    }

    Tween.prototype = {
      current: function (Y) {
        var pct = 0
          , fromY = this.fromY
          , toY = this.toY;
        if (Y >= fromY && Y <= toY) {
          pct = (Y - fromY) / (toY - fromY);
        } else if (Y > toY) {
          pct = 1;
        }
        return this.tweener.tween(pct);
      }
    }

    function ParseValue (value) {
      var nums = [];
      value = new String(value).replace(RegexpValue, function (num) {
        nums.push(parseFloat(num));
        return ParseWildcard;
      });
      return [value, nums]
    }

    function CompileValues (fromValue, toValue, pct) {
      var i = 0
        , fromNum
        , toNum;
      return fromValue[0].replace(ParseWildcardRegexp, function () {
        from = fromValue[1][i];
        to = toValue[1][i];
        i++;
        return (from + ((to - from) * pct));
      });
    }

    var Style = function (component) {
      this.points = component.points;
    }

    Style.prototype = {
      current: function (Y) {
        var points = this.points
          , current = new String();
        for (var i=0; i<points.length; i++) {
          point = points[i];
          if (Y >= point.Y) current = point.value;
        }
        return current;
      }
    }

    var Point = function (Y, value) {
      this.Y = Y;
      this.value = value;
    }

    var Collection = function (object) {
      object = object || {};
      this.points = [];
      for (var Y in object) {
        this.add(Y, object[Y]);
      }
    }

    Collection.prototype = {
      add: function (Y, value) {
        var points = this.points.slice(0)
          , point = new Point(parseInt(Y), value)
          , isAdded = false;
        for (var i=0; i<this.points.length; i++) {
          if (this.points[i].Y > point.Y) {
            points.splice(i, 0, point);
            isAdded = true;
          }
        }
        if (!isAdded) points.push(point);
        this.points = points;
        return this;
      },
      merge: function (at, collection) {
        var points = collection.points
          , value;
        for (var i=0; i<points.length; i++) {
          action = points[i];
          this.add((at + action.Y), action.value);
        }
        return this;
      }
    }

    var Action = function (Klass, property, points) {
      var points = this.points = (new Collection(points)).points;
      this.max = points[points.length - 1].Y;
      this.property = property;
      this.klass = new Klass(this);
    }

    Action.prototype = {
      current: function (Y) {
        return this.klass.current(Y);
      }
    }

    function SetElementStyle (object, property, value) {
      if (object instanceof NodeList || object instanceof Array) {
        for (var i=0; i<object.length; i++) SetElementStyle(object[i], property, value);
      } else {
        object.style[property] = value;
      }
    }

    var Element = function (selector) {
      this.selector = selector;
      this.actions = {};
    }

    Element.prototype = {
      $: function () {
        var $ = this.selector;
        if ($.nodeName) {
          $ = [$];
        } else if ('string' === typeof $) {
          $ = doc.querySelectorAll($);
        }
        return $;
      },
      add: function (Y, action) {
        var property = action.property
          , collection;
        if (!(collection = this.actions[property])) collection = new Collection();
        collection.add(Y, action);
        this.actions[property] = collection;
        return this;
      },
      set: function (wY) {
        var $ = this.$()
          , actions = this.actions
          , collection, points
          , point, action, Y;
        for (var property in actions) {
          collection = actions[property];
          points = collection.points;
          for (var x=0; x<points.length; x++) {
            point = points[x];
            action = point.value;
            Y = (wY - point.Y);
            if ( (Y > 0) || (Y < 0 && x == 0) ) {
              SetElementStyle($, property, action.current(Y));
            }
          }
        }
        return this;
      },
      unset: function () {
        var actions = this.actions
          , $ = this.$();
        for (var property in actions) {
          for (var i=0; i<$.length; i++) $[i].style[property] = '';
        }
        return this;
      }
    }

    var Storyboard = function () {
      this.elements = [];
      this.max = 0;
    }

    Storyboard.prototype = {
      add: function (Y, selector, action) {
        var elements = this.elements
          , element
          , max;
        for (var i=0; i<elements.length; i++) {
          if (elements[i].selector == selector) {
            element = elements[i];
            break;
          }
        }
        if (!element) {
          element = new Element(selector);
          elements.push(element);
        }
        if (action) {
          element.add(Y, action);
          max = Y + action.max;
          if (max > this.max) this.max = max;
        }
        this.elements = elements;
        return this;
      },
      merge: function (at, storyboard) {
        var elements = storyboard.elements
          , element, actions, collection
          , points, point;
        for (var x=0; x<elements.length; x++) {
          element = elements[x];
          actions = element.actions;
          for (var property in actions) {
            collection = actions[property];
            points = collection.points;
            for (var i=0; i<points.length; i++) {
              point = points[i];
              this.add((parseInt(at) + point.Y), element.selector, point.value);
            }
          }
        }
        return this;
      },
      set: function (Y) {
        var elements = this.elements
          , element;
        for (var i=0; i<elements.length; i++) {
          element = elements[i];
          element.set(Y);
        }
      },
      unset: function () {
        var elements = this.elements
          , element;
        for (var i=0; i<elements.length; i++) {
          element = elements[i];
          element.unset();
        }
      }
    }

    function SetStoryboardFunction (storyboard) {
      return function () {
        var wY = win.pageYOffset;
        storyboard.set(wY);
      }
    }

    function SetBodyMinHeightFunction (storyboard) {
      return function () {
        SetElementStyle(doc.body, 'minHeight', ((storyboard.max + win.innerHeight) + 'px'));
      }
    }

    function AddEvent (roll, string, callback) {
      var events = string.split(' ')
        , ev;
      for (var i=0; i<events.length; i++) {
        ev = events[i];
        if (!roll.events[ev]) roll.events[ev] = [];
        roll.events[ev].push(callback);
        win.addEventListener(ev, callback);
      }
      callback();
    }

    function RemoveEvents (roll, string) {
      var events = string.split(' ')
        , ev, callbacks, callback;
      for (var x=0; x<events.length; x++) {
        ev = events[x];
        callbacks = roll.events[ev];
        for (var y=0; x<callbacks.length; x++) {
          callback = callbacks[y];
          win.removeEventListener(ev, callback);
        }
        roll.events[ev] = [];
      }
    }

    function RemoveAllEvents (roll) {
      for (var ev in roll.events) RemoveEvents(roll, ev);
      roll.events = {};
    }

    var Roll = function () {
      this.scenes = {};
      this.ats = {};
      this.events = {};
    }

    Roll.prototype = {
      add: function (name, scene) {
        if ('function' === typeof scene) {
          var fn = scene;
          scene = new Scene();
          fn(scene);
        }
        this.scenes[name] = scene;
        return this;
      },
      at: function (Y, name) {
        var ats = this.ats[Y] || [];
        ats.push(name);
        this.ats[Y] = ats;
        return this;
      },
      init: function () {
        var storyboard, names, scene;
        storyboard = this.storyboard = new Storyboard();
        for (var Y in this.ats) {
          names = this.ats[Y];
          for (var i=0; i<names.length; i++) {
            scene = this.scenes[names[i]];
            storyboard.merge(Y, scene.storyboard);
          }
        }
        this.bind();
        return this;
      },
      remove: function () {
        var storyboard;
        if (storyboard = this.storyboard) {
          storyboard.unset();
          this.storyboard = null;
        }
        SetElementStyle(doc.body, 'minHeight', '');
        this.unbind();
        return this;
      },
      bind: function () {
        if (this.storyboard) {
          AddEvent(this, 'scroll resize', SetStoryboardFunction(this.storyboard));
          AddEvent(this, 'resize', SetBodyMinHeightFunction(this.storyboard));
        }
        return this;
      },
      unbind: function () {
        RemoveAllEvents(this);
        return this;
      }
    }

    var Scene = Roll.Scene = function () {
      this.storyboard = new Storyboard();
    }

    Scene.prototype = {
      animate: function ($el, property, points) {
        return this.action(Animation, $el, property, points);
      },
      style: function ($el, property, points) {
        return this.action(Style, $el, property, points);
      },
      action: function (Klass, $el, property, points) {
        var properties;
        if ('undefined' === typeof points) {
          properties = property;
        } else {
          (properties = {})[property] = points;
        }
        for (property in properties) {
          action = new Action(Klass, property, properties[property]);
          this.storyboard.add(0, $el, action);
        }
        return this;
      }
    }

    return Roll;

  }

  if ('function' === typeof define && define.amd) {
    define(__);
  } else {
    win.Roll = __();
  };

}(window, document));
