roll
===
A simple parallax scrolling library written in pure JavaScript.

## Installation

roll has no dependencies; simply include the library.

```html
<script src="/roll.js"></script>
```

## Usage

```javascript
var roll = new Roll();

roll
  .animate('#foo', 200, { rotate: 0 }, 500: { rotate: 180 } )
  .animate('#bar', 500, { backgroundColor: '#ff0000' }, 1000, { backgroundColor: 'rgba(0, 0, 0)' })
  .style('#foo', 'textAlign', 'center', 200, 500)
  .fixed('#bar', 500, 1000)
  .bind();
```

### API

Write-up coming soon.

## License & Contributing

- Details on the license [can be found here](LICENSE)
- Details on running tests and contributing [can be found here](CONTRIBUTING.md)
