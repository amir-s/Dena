Dena
============


Dena is a dead simple scheduler to queue and run async javascript functions.

It turns your async functions into async functions that schedule themselves to use limited resources, so at any given time, only limited number of async tasks are being executed.


Example
============
Assume you are downloading some URLs, but you need a token to access them. You have limited number of tokens and you can only download one page at a time with one token.

```javascript
let simulatedDownload = function (delay) {
  return new Promise((acc, rej) => setTimeout(acc, delay))
}

let download = async function (token, path, delay) {
  console.log(`[ ] Started downloading ${path}?token=${token}`);
  
  await simulatedDownload(delay);

  console.log(`[x] Finished downloading ${path}?token=${token}`);
}
```

You can use Dena, to convert your `download` function into a smarter `download`. Dena dynamically assigns a token to your function from a pool of tokens and call your function.
Dena assumes the first argument of your function is always the configuration object that needs to be selected from the pool.

```javascript
let simulatedDownload = function (delay) {
  return new Promise((acc, rej) => setTimeout(acc, delay))
}

let download = async function (token, path, delay) {
  console.log(`[ ] Started downloading ${path}?token=${token}`);
  
  await simulatedDownload(delay);

  console.log(`[x] Finished downloading ${path}?token=${token}`);
}


let tokens = ['1_1a2b3c', '2_4d5e6f', '3_7g8h9i'];
let denaDownload = Dena(tokens, download);

// notice how the first argument is not needed.
// Dena assings a free token to your function dynamically
denaDownload('/one', 1000);
denaDownload('/two', 500);
denaDownload('/three', 2000);
denaDownload('/four', 500); // this waits until /two is downloaded
denaDownload('/five', 100); // this waits until /one is downloaded

/*
  [ ] Started downloading /one?token=1_1a2b3c
  [ ] Started downloading /two?token=2_4d5e6f
  [ ] Started downloading /three?token=3_7g8h9i
  [x] Finished downloading /two?token=2_4d5e6f
  [ ] Started downloading /four?token=2_4d5e6f
  [x] Finished downloading /one?token=1_1a2b3c
  [ ] Started downloading /five?token=1_1a2b3c
  [x] Finished downloading /four?token=2_4d5e6f
  [x] Finished downloading /five?token=1_1a2b3c
  [x] Finished downloading /three?token=3_7g8h9i
*/
```

Also, each `denaDownload` return a `Promise` which gets resolved to `download`'s return value once that instance is executed.

API
=====
```
Dena(configurationPool, fn);
```

`configurationPool`: `Array` of objects, each element will be fed into `fn` as its first argument.

`fn`: `async function`. `fn` has to return a `Promise`, so Dena knows when the execution is done.


Return Value:
`async fn`: Async function that executes `fn` with dynamically assigned configuration from `configurationPool`.



