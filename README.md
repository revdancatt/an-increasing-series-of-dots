# an-increasing-series-of-dots

This is the source code for the fxhash project: https://www.fxhash.xyz/generative/slug/an-increasing-series-of-dots

The idea was to use the new `$fx.iteration` property that's now exposed.

The relevant lines of code are...

```javascript
const maxIterations = 64
const iterations = $fx.iteration === undefined ? Math.floor(fxrand() * maxIterations) + 1 : $fx.iteration
```

Which sets the `iterations` value to `$fx.iteration` if it exists or a random value if it doesn't. `maxIterations` would be set to the maximum intended number of iterations.
