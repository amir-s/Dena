# Dena

A tiny async task scheduler for JavaScript/TypeScript. Queue async functions against a pool of limited resources — Dena ensures only as many tasks run concurrently as there are resources available.

## Install

```
npm install dena
```

## Quick Start

```js
const Dena = require("dena");

// You have 3 tokens, but 5 downloads to make.
// Dena manages the queue so only 3 run at a time.

const tokens = ["token_a", "token_b", "token_c"];

const download = async (token, url) => {
  const res = await fetch(`${url}?token=${token}`);
  return res.json();
};

const scheduledDownload = Dena(tokens, download);

// Dena assigns a free token automatically — just pass the remaining args:
const result = await scheduledDownload("/api/users");
```

## How It Works

1. You provide a **resource pool** (an array of configs/tokens/connections — anything).
2. You provide an **async worker function** whose first argument is a resource from the pool.
3. Dena returns a new function with the same signature _minus_ the first argument. When you call it, Dena waits for a free resource, injects it, and runs your worker.

```
Dena(pool, worker) → scheduledWorker
```

- If a resource is free, the task runs immediately.
- If all resources are busy, the task is queued and runs as soon as one frees up.
- Each call returns a `Promise` that resolves with the worker's return value.

## Example

```js
const Dena = require("dena");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const download = async (token, path, ms) => {
  console.log(`[ ] downloading ${path} (token=${token})`);
  await delay(ms);
  console.log(`[x] finished   ${path} (token=${token})`);
};

const tokens = ["t1", "t2", "t3"];
const scheduledDownload = Dena(tokens, download);

scheduledDownload("/one", 1000);
scheduledDownload("/two", 500);
scheduledDownload("/three", 2000);
scheduledDownload("/four", 500); // queued — waits for a free token
scheduledDownload("/five", 100); // queued

/*
  [ ] downloading /one   (token=t1)
  [ ] downloading /two   (token=t2)
  [ ] downloading /three (token=t3)
  [x] finished   /two   (token=t2)
  [ ] downloading /four  (token=t2)
  [x] finished   /one   (token=t1)
  [ ] downloading /five  (token=t1)
  [x] finished   /four  (token=t2)
  [x] finished   /five  (token=t1)
  [x] finished   /three (token=t3)
*/
```

## API

```ts
Dena<TConfig, TArgs, TResult>(
  pool: TConfig[],
  worker: (config: TConfig, ...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult>
```

| Parameter | Description |
|-----------|-------------|
| `pool` | Array of resources. Each element is passed as the first argument to `worker` when a task is dispatched. The pool size determines the concurrency limit. |
| `worker` | Async function to schedule. Its first parameter receives a resource from `pool`; the rest are the arguments you pass to the returned function. |

**Returns** a function with the same signature as `worker` minus the first parameter. Each call returns a `Promise` that resolves with the worker's return value.

## TypeScript

Full type definitions are included with the package — no extra `@types` install needed.

## License

MIT

