(function (_window_, _document_) {

  function __() {

    var Animations = {

      backgroundColor: {
        key: 'background',
        value: ColorAnimation
      },

      color: {
        key: 'color',
        value: ColorAnimation
      },

      rotate: {
        key: 'transform',
        value: function (pct, fromValue, toValue) {
          return 'rotate(' + (fromValue + ((toValue - fromValue) * pct)) + 'deg)';
        }
      },

      rotateX: {
        key: 'transform',
        value: function (pct, fromValue, toValue) {
          return 'rotate(' + (fromValue + ((toValue - fromValue) * pct)) + 'deg)';
        }
      },

      rotateY: {
        key: 'transform',
        value: function (pct, fromValue, toValue) {
          return 'rotate(' + (fromValue + ((toValue - fromValue) * pct)) + 'deg)';
        }
      },

      scale: {
        key: 'transform',
        value: function (pct, fromValue, toValue) {
          return 'scale(' + (fromValue + ((toValue - fromValue) * pct)) + ')';
        }
      }

    };

    function PropertyAnimation (property) {
      var pctRegexp = /^([0-9]{1,3})\%$/
        , isPct
        , match
        , num;
      return {
        key: property,
        value: function (pct, fromValue, toValue) {
          if (match = pctRegexp.exec(fromValue)) {
            isPct = true;
            fromValue = match[1];
            toValue = pctRegexp.exec(toValue)[1];
          }
          num = fromValue + ((toValue - fromValue) * pct);
          if (isPct) num = num + '%';
          return num;
        }
      }
    };

    var StylePropertyHandler = {

      transform: function (values) {
        return values.join(' ');
      }

    };

    function ColorAnimation (pct, fromValue, toValue) {
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
    };

    var Property = function (key, value) {
      this.key = key;
      this.value = value;
    }

    var Animation = function (action, fromY, from, toY, to) {
      if (!('object' === typeof action)) {
        if (Animations[action]) {
          action = Animations[action];
        } else {
          action = PropertyAnimation(action);
        }
      }
      this.property = new Property(action.key, action.value);
      this.fromY = fromY;
      this.from = from;
      this.toY = toY;
      this.to = to;
    };

    Animation.prototype = {

      current: function (y) {
        var pct = (y - this.fromY) / (this.toY - this.fromY)
          , action;
        if (pct < 0) pct = 0;
        if (pct > 1) pct = 1;
        return this.property.value(pct, this.from, this.to);
      }

    };

    var Style = function (key, value, fromY, toY) {
      this.property = new Property(key, value);
      this.value = value;
      this.fromY = fromY;
      this.toY = toY;
    };

    Style.prototype = {

      current: function (y) {
        var pct = this.toY ? (y - this.fromY) / (this.toY - this.fromY) : 1;
        return pct > 0 ? this.property.value : '';
      }

    };

    var Roll = function () {
      this.components = [];
      this.max = 0;
    };

    Roll.prototype = {

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
        return this.style(el, 'position', type, fromY, toY);
      },

      animate: function (el, fromY, fromProps, toY, toProps) {
        var animation;
        for (var action in fromProps) {
          animation = new Animation(action, fromY, fromProps[action], toY, toProps[action]);
          AddComponent(this, el, animation);
        }
        return this;
      },

      style: function (el, key, value, fromY, toY) {
        var attrs, style;
        if (arguments.length == 4) {
          attrs = key;
        } else {
          (attrs = {})[key] = value;
        }
        for (var key in attrs) {
          style = new Style(key, attrs[key], fromY, toY);
          AddComponent(this, el, style);
        }
        return this;
      },

      bind: function () {
        var setFn, minHeightFn;
        _window_.onscroll = setFn = SetElements(this);
        _window_.onresize = minHeightFn = SetBodyMinHeight(this);
        setFn(); minHeightFn();
      }

    };

    function AddComponent (roll, el, component) {
      var key = component.property.key;
      if (!roll.components[el]) roll.components[el] = {};
      if (!roll.components[el][key]) roll.components[el][key] = [];
      roll.components[el][key].push(component.current.bind(component));
      if (roll.max < (component.toY || 0)) roll.max = component.toY;
    }

    function SetBodyMinHeight(roll) {
      var body = _document_.querySelector('body');
      return function () {
        body.style.minHeight = roll.max + _window_.innerHeight + 'px';
      }
    }

    function SetElements (roll) {
      var $els = {};
      for (var el in roll.components) $els[el] = _document_.querySelectorAll(el);
      return function () {
        var y = _window_.pageYOffset
          , props
          , values
          , output
          , value;
        for (var el in roll.components) {
          props = roll.components[el];
          for (var key in roll.components[el]) {
            values = roll.components[el][key];
            output = [];
            for (var i=0; i<values.length; i++) output.push(values[i](y));
            value = StylePropertyHandler[key] ? StylePropertyHandler[key](output) : output[output.length - 1];
            for (var i=0; i<$els[el].length; i++) $els[el][i].style[key] = value;
          }
        }
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
