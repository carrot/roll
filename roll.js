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

(function (W, D) {

  function __() {

    function ParseTransformValue (value) {
      var regexp = /([a-zA-Z]+)\(([-a-zA-Z0-9\.\,\s%]+)\)/g
        , match
        , parse = {}
        , valuesArray
        , num
        , unit
      while (match = regexp.exec(value)) {
        parse[match[1]] = (function (values) {
          valuesArray = []
          for (var i=0; i<values.length; i++) {
            num = parseFloat(values[i]);
            if (unit = values[i].match(/([a-zA-Z%]+)/)) unit = unit[1];
            valuesArray.push({
              num: num,
              unit: unit
            });
          }
          return valuesArray;
        }(match[2].split(/,\s?/)));
      }
      return parse;
    }

    function ParseDefaultValue(value) {
      var match = (new String(value)).match(/([-0-9\.]+)([a-zA-Z%]{1,3})?/);
      return {
        num: parseFloat(match[1])
        , unit: match[2]
      };
    }

    var Tweener = {};

    Tweener.transform = function (fromValue, toValue) {
      this.fromValue = ParseTransformValue(fromValue);
      this.toValue = ParseTransformValue(toValue);
    }

    Tweener.transform.prototype = {
      tween: function (pct) {
        var fromValue = this.fromValue
          , toValue = this.toValue
          , values = []
          , from, to, prop, i, num, nums;
        for (var prop in fromValue) {
          from = fromValue[prop];
          to = toValue[prop] || from;
          nums = [];
          for (i=0; i<from.length; i++) {
            num = (from[i].num + ((to[i].num - from[i].num) * pct));
            if (from[i].unit) num = num + from[i].unit;
            nums.push(num);
          }
          nums = nums.join(',');
          values.push(prop + '(' + nums + ')');
        }
        return values.join(' ');
      }
    }

    Tweener.default = function (fromValue, toValue) {
      this.fromValue = ParseDefaultValue(fromValue);
      this.toValue = ParseDefaultValue(toValue);
    }

    Tweener.default.prototype = {
      tween: function (pct) {
        var fromNum = this.fromValue.num
          , toNum = this.toValue.num
          , value = new String(fromNum + ((toNum - fromNum) * pct));
        if (this.fromValue.unit) value += this.fromValue.unit;
        return value;
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

    var Point = function (Y, value) {
      this.Y = Y;
      this.value = value;
    }

    var Points = function (object) {
      var keys = [], _points = [];
      for (var key in object) keys.push(parseInt(key));
      keys.sort(function(a, b){return a-b;});
      for (var i=0; i<keys.length; i++) _points.push(new Point(keys[i], object[keys[i]]));
      return _points;
    }

    var Component = function ($el, Klass, property, points) {
      this.$el = $el;
      this.property = property;
      this.points = Points(points);
      this.child = new Klass(this);
    }

    Component.prototype = {
      set: function (Y) {
        var $el = this.$el;
        if ($el.nodeName) {
          $el = [$el];
        } else if ('string' === typeof $el) {
          $el = D.querySelectorAll($el);
        }
        for (var i=0; i<$el.length; i++) {
          $el[i].style[this.property] = this.child.current(Y);
        }
      }
    }

    var Animation = function (component) {
      var tweens = []
        , points = component.points
        , current, next;
      for (var i=0; i<points.length; i++) {
        current = points[i];
        next = points[i+1];
        tweens.push(new Tween(property, current, next));
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
          if ( (Y >= tween.fromY && Y <= tween.toY)
            || (Y <= tween.fromY && i == 0)
            || (Y >= tween.toY && i == len - 1) ) {
            break;
          }
        }
        return tween.current(Y);
      }
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

    var Roll = function (options) {
      this.options = options || {};
      this.components = [];
      this.max = 0;
    }

    Roll.prototype = {
      animate: function ($el, property, points) {
        return CreateComponent(this, Animation, arguments);
      },
      style: function ($el, property, points) {
        return CreateComponent(this, Style, arguments);
      },
      bind: function () {
        var scrollFn = OnScrollFunction(this)
          , resizeFn = OnResizeFunction(this);
        W.addEventListener('scroll', scrollFn);
        W.addEventListener('resize', resizeFn);
        scrollFn();
        resizeFn();
      }
    }

    function CreateComponent (roll, fn, args) {
      var $el = args[0]
        , properties, component, points, last;
      if (args.length == 2) {
        properties = args[1];
      } else {
        (properties = {})[args[1]] = args[2];
      }
      for (property in properties) {
        component = new Component($el, fn, property, properties[property]);
        roll.components.push(component);
        points = component.points;
        last = points[points.length - 1];
        if (last.Y > roll.max) roll.max = last.Y;
      }
      return roll;
    }

    function OnScrollFunction (R) {
      return function () {
        var Y = W.pageYOffset
          , component;
        for (var i=0; i<R.components.length; i++) {
          component = R.components[i];
          component.set(Y);
        }
      }
    }

    function OnResizeFunction (R) {
      return function () {
        D.body.style.minHeight = (R.max + W.innerHeight) + 'px';
      }
    }

    return Roll;

  }

  if ('function' === typeof define && define.amd) {
    define(__);
  } else {
    W.Roll = __();
  };

}(window, document));
