roll
===

Roll is an unbelievably simple parallax scrolling library.  It's tiny (~5kb minified), relies on no dependencies, is very performant, and is uniquely extensible.

## Installation  

```html
<script src="/roll.min.js"></script>
```

```javascript
require(['roll'], function (Roll) {
  var roll = new Roll();
});
```

## Example

```javascript
var roll = new Roll();

var scene1 = new Roll.Scene();
scene1
  .animate('#foo', 'transform', {
    0: 'translateY(0px) scale(0)',
    50: 'translateY(50px) scale(0.5)',
    200: 'translateY(100px) scale(1)'
  });

var scene2 = new Roll.Scene();
scene2
  .animate('#bar', {
    transform: {
      0: 'translateY(0px) scale(0)',
      50: 'translateY(50px) scale(0.5)'
      200: 'translateY(100px) scale(1)'
    },
    opacity: {
      0: 0
      200: 1
    }
  });

roll
  .add('foo', scene1)
  .add('bar', scene2)
  .at(100, 'scene1')
  .at(1000, 'scene2');

// When the document is ready:
roll.init();
```

## API

Roll returns two classes: `Roll` and `Roll.Scene`.  An instance of `Roll` is a controller class for `Roll.Scene` instances.  All methods in `Roll` and `Roll.Scene` return the instance and thus are chainable.

### Controller

```javascript
var roll = new Roll();
```

##### `roll.add(name, scene)`

Adds `scene` (a `Roll.Scene` instance) to the controller as `name`.

##### `roll.at(Y, name)`

Asks the controller to play a scene named `name` beginning at `Y`, an integer representing a point on the window's Y-axis.

##### `roll.init()`

Sets up Roll with the scenes added to the controller and attaches the requisite event listeners to the window; call `roll.init()` once the document has loaded.

##### `roll.remove()`

Removes all style property values and event listeners.

##### `roll.bind()`

Attaches the requisite event listeners; called in `roll.init()`

##### `roll.unbind()`

Removes all event listeners.

```javascript
var scene = new Roll.Scene();
```

### Scene

##### `scene.animate(selector, object)`

Add an animation to the scene for an element.

- `selector`: the DOM selector of the element(s) to animate.
- `{points}`: a key-value object of properties with nested objects which indicate the points on the window's Y-axis and the property values to animate to.  For example:

  ```javascript
  {
    transform: {
      0: 'translateY(0px) scale(0)',
      50: 'translateY(50px) scale(0.5)'
      200: 'translateY(100px) scale(1)'
    },
    opacity: {
      0: 0
      200: 1
    }
  }
  ```

If you'd like to animate one property, optionally pass a property as the second argument and the points as the third argument, like so:

```javascript
var scene = new RollScene();
scene.animate('#foo', 'translateY', {
  0: 'translateY(0px) scale(0)',
  50: 'translateY(50px) scale(0.5)'
  200: 'translateY(100px) scale(1)'
});
```

##### `scene.style(selector, object)`

Manipulate style properties at certain points; works just like `roll.animate()`.

##### `scene.action(fn, selector, object)`

Manipulate a selector with a custom function at `fn`.  A custom function is passed a component as the first and only argument in the constructor function, which includes:

- `property`: the property to manipulate
- `points`: the points and their respective property values
- `max`: the highest Y-value; simply for convenience.

For example, this is the function used for `roll.style()`:

```javascript
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
```

## License & Contributing

- Details on the license [can be found here](LICENSE)
- Details on running tests and contributing [can be found here](CONTRIBUTING.md)
