// lib/worker-shim.ts

// A Web Worker's global scope is `self`. Browsers' global scope is `window`.
// This trick makes libraries that expect `window` to exist think they are in a browser,
// even though they are in a worker. `globalThis` is the modern way to refer to the
// global object in any environment.
if (typeof window === "undefined") {
  globalThis.window = globalThis;
}
