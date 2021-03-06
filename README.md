roll
===

Roll is an unbelievably simple parallax scrolling library.  It's tiny (~5kb minified), relies on no dependencies, is very performant, and is uniquely extensible.

## Installation

As mentioned above, roll relies on no dependencies.  

```html
<script src="/roll.min.js"></script>
```

```javascript
require(['roll'], function (Roll) {
  var roll = new Roll();
});
```

## Usage

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

```javascript
var roll = new Roll();
```

##### `roll.add(name, scene)`

Adds `scene` to the controller.

##### `roll.at(Y, name)`

Asks the controller to play a scene named `name` beginning at `Y`, an integer representing a point on the window's Y-axis.

##### `roll.init()`

Creates a "storyboard" with the specifications previously applied to the controller and applies the necessary event listeners.

##### `roll.remove()`

Removes all style property values and event listeners.

##### `roll.bind()`

Applies the necessary event listeners.

##### `roll.unbind()`

Removes all event listeners.

```javascript
var scene = new Roll.Scene();
```

##### `scene.animate($, property, [points])`

Add an animation to the scene.

##### `scene.style($, property, [points])`

Add a style property to the scene.

##### `scene.action(klass, $, property, [points])`

Add any class as an action for the scene.

## License & Contributing

- Details on the license [can be found here](LICENSE)
- Details on running tests and contributing [can be found here](CONTRIBUTING.md)
