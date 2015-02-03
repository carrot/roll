roll
===
A simple parallax scrolling library written in pure JavaScript.

## Installation

roll has no dependencies; simply include the library.

```html
<script src="/roll.min.js"></script>
```

## Usage

```javascript
var roll = new Roll();

roll
  .animate('#foo', { transform: { 0: 'rotateX(0deg) scale(0)', 500: 'rotateX(20deg) scale(1)' } })
  .animate('#bar', { opacity: { 500: 1, 1000: 2 } })
  .style('#foo', { position: { 500: 'fixed', 1000: 'relative' } })
  .bind();
```

### API

Write-up coming soon.

## License & Contributing

- Details on the license [can be found here](LICENSE)
- Details on running tests and contributing [can be found here](CONTRIBUTING.md)
