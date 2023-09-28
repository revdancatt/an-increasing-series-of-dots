## About

This is the source code for the fxhash project: https://www.fxhash.xyz/generative/slug/an-increasing-series-of-dots

The idea was to use the new `$fx.iteration` property that's now exposed.

The relevant lines of code are...

```javascript
const maxIterations = 64
const iterations = $fx.iteration === undefined ? Math.floor(fxrand() * maxIterations) + 1 : $fx.iteration
```

Which sets the `iterations` value to `$fx.iteration` if it exists or a random value if it doesn't. `maxIterations` would be set to the maximum intended number of iterations.

## Places

* Canonical project page: https://www.fxhash.xyz/generative/27795
* High-resolution page: https://revdancatt.com/art/an_increasing_series_of_dots-27795
* "Right Click Save" edition: https://revdancatt.com/RCS/an_increasing_series_of_dots-27795

**Canonical**: where the v1 of the project was first published  
**High-res**: where the project lives on my website with high-res outputs  
**RCS edition**: where the latest updated version of the project lives

## Running

The files you need are...

```
index.html
  ╰ index.js
```

...spin up a local webserver or just opening index.html should do the trick, see instructions.md for, well, instructions.

## Code usage

I've placed the code here for educational purposes, for anyone who wants to learn from _somewhat_ badly written code. You may not sell/mint/etc. outputs from this code, you may keep, print, display them for personal use. Please see the LICENSE for more information.
