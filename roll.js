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

    var RegexpValue = /[\-+]?[\d]*\.?[\d]+/g
      , ParseWildcard = '{?}'
      , ParseWildcardRegexp = /\{\?\}/g;

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

    function CreateComponent (R, fn, args) {
      var $el = args[0]
        , properties, component, points, last;
      if (args.length == 2) {
        properties = args[1];
      } else {
        (properties = {})[args[1]] = args[2];
      }
      for (property in properties) {
        component = new Component($el, fn, property, properties[property]);
        R.components.push(component);
        points = component.points;
        last = points[points.length - 1];
        if (last.Y > R.max) R.max = last.Y;
      }
      return R;
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
