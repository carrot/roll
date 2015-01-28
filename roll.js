(function (_window_, _document_) {

  function __() {

    var Animations = {

      backgroundColor: function (pct, fromValue, toValue) {
        return {
          key: 'background',
          value: colorAnimation(pct, fromValue, toValue)
        }
      },

      color: function () {
        return {
          key: 'color',
          value: colorAnimation(pct, fromValue, toValue)
        }
      },

      opacity: function (pct, fromValue, toValue) {
        var num = fromValue + ((toValue - fromValue) * pct);
        return {
          key: 'opacity',
          value: num
        }
      },

      rotate: function (pct, fromValue, toValue) {
        var deg = fromValue + ((toValue - fromValue) * pct);
        return {
          key: 'transform',
          value: 'rotate(' + deg + 'deg)'
        }
      },

      rotateX: function (pct, fromValue, toValue) {
        var deg = fromValue + ((toValue - fromValue) * pct);
        return {
          key: 'transform',
          value: 'rotateX(' + deg + 'deg)'
        }
      },

      rotateY: function (pct, fromValue, toValue) {
        var deg = fromValue + ((toValue - fromValue) * pct);
        return {
          key: 'transform',
          value: 'rotateY(' + deg + 'deg)'
        }
      },

      scale: function (pct, fromValue, toValue) {
        var num = fromValue + ((toValue - fromValue) * pct);
        return {
          key: 'transform',
          value: 'scale(' + num + ')'
        }
      }

    };

    var StylePropertyHandler = {

      transform: function (values) {
        return values.join(' ');
      }

    };

    function colorAnimation (pct, fromValue, toValue) {
      var rgba = {}
        , r
        , g
        , b
        , a;

      var values = {
        fromValue: fromValue,
        toValue: toValue
      }

      for (var key in values) {
        rgba[key] = (function(value){
          var match;
          if (match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/.exec(value)) {
            return {
              r: parseInt(match[1]),
              g: parseInt(match[2]),
              b: parseInt(match[3])
            }
          } else if (match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/.exec(value)) {
            return {
              r: parseInt(match[1], 16),
              g: parseInt(match[2], 16),
              b: parseInt(match[3], 16)
            }
          }
        })(values[key]);
      }
      if (rgba.fromValue && rgba.toValue) {
        r = parseInt((1-pct) * rgba.fromValue.r + pct * rgba.toValue.r);
        g = parseInt((1-pct) * rgba.fromValue.g + pct * rgba.toValue.g);
        b = parseInt((1-pct) * rgba.fromValue.b + pct * rgba.toValue.b);
        if (rgba.fromValue.a && rgba.toValue.a) a = parseInt((1-pct) * rgba.fromValue.a + pct * rgba.toValue.a);
        return a ? 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')' : 'rgb(' + r + ', ' + g + ', ' + b + ')';
      }
    }

    var Property = function (key, value) {
      this.key = key;
      this.value = value;
    }

    var Animation = function (action, fromY, from, toY, to) {
      if ('function' === typeof action) {
        this.action = action;
      } else {
        this.action = Animations[action];
      }
      this.fromY = fromY;
      this.from = from;
      this.toY = toY;
      this.to = to;
    }

    Animation.prototype = {

      current: function (y) {
        var pct = (y - this.fromY) / (this.toY - this.fromY)
          , action;
        if (pct < 0) pct = 0;
        if (pct > 1) pct = 1;
        action = this.action(pct, this.from, this.to);
        return new Property(action.key, action.value);
      }

    };

    var Style = function (key, value, fromY, toY) {
      this.key = key;
      this.value = value;
      this.fromY = fromY;
      this.toY = toY;
    }

    Style.prototype = {

      current: function (y) {
        var pct = (y - this.fromY) / (this.toY - this.fromY);
        return new Property(this.key, (pct > 0 && pct < 1) ? this.value : '');
      }

    }

    var Roll = function () {
      this.components = [];
    };

    Roll.prototype = {

      animate: function (el, fromY, fromProps, toY, toProps) {
        if (!this.components[el]) this.components[el] = [];
        var from, to;
        for (var action in fromProps) {
          from = fromProps[action];
          to = toProps[action];
          this.components[el].push(new Animation(action, fromY, from, toY, to));
        }
        return this;
      },

      fixed: function (el, fromY, toY) {
        return this.position(el, 'fixed', fromY, toY);
      },

      relative: function (el, fromY, toY) {
        return this.position(el, 'relative', fromY, toY);
      },

      static: function (el, fromY, toY) {
        return this.position(el, 'static', fromY, toY);
      },

      absolute: function (el, fromY, toY) {
        return this.position(el, 'absolute', fromY, toY);
      },

      position: function (el, type, fromY, toY) {
        return this.style(el, 'position', type, fromY, toY)
      },

      style: function (el, key, value, fromY, toY) {
        if (!this.components[el]) this.components[el] = [];

        var attrs;
        if (arguments.length == 4) {
          attrs = key;
        } else {
          (attrs = {})[key] = value;
        }

        for (var key in attrs) {
          this.components[el].push(new Style(key, attrs[key], fromY, toY));
        }

        return this;
      },

      bind: function () {
        var styles = {}
          , $els = {}
          , components
          , component;
        for (var el in this.components) {
          $els[el] = _document_.querySelectorAll(el);
          components = this.components[el];
          for (var key in components) {
            component = components[key];
            if (!styles[el]) styles[el] = [];
            styles[el].push(component.current.bind(component));
          }
        }
        return _window_.onscroll = (function (styles, $els) {
          return function () {
            var y = _window_.pageYOffset
              , props = {}
              , prop
              , key
              , val
            for (var el in styles) {
              for (var i=0; i<styles[el].length; i++) {
                prop = styles[el][i](y);
                key = prop.key;
                if (!props[key]) props[key] = [];
                props[key].push(prop.value);
              }
              for (var key in props) {
                val = props[key].length > 1 ? StylePropertyHandler[key](props[key]) : props[key][0];
                for (var i=0; i<$els[el].length; i++) {
                  $els[el][i].style[key] = val;
                }
              }
            }
          }
        }(styles, $els));
      }

    }

    return Roll;

  };

  if ('function' === typeof define && define.amd) {
    define(__);
  } else {
    _window_.Roll = __();
  };

})(window, document);
