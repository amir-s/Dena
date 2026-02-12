const assert = require('assert');
const Dena = require('../dist');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const testResolvesReturn = async () => {
  const scheduler = Dena([1], async (config, value) => {
    await sleep(10);
    return config + value;
  });

  const result = await scheduler(5);
  assert.strictEqual(result, 6);
};

const testConcurrencyLimit = async () => {
  const tokens = ['a', 'b'];
  let active = 0;
  let maxActive = 0;

  const worker = async (token, id, delay) => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    await sleep(delay);
    active -= 1;
    return `${token}-${id}`;
  };

  const scheduler = Dena(tokens, worker);
  const results = await Promise.all([
    scheduler('one', 30),
    scheduler('two', 20),
    scheduler('three', 10),
    scheduler('four', 5),
  ]);

  assert.strictEqual(results.length, 4);
  results.forEach((result) => {
    assert.ok(tokens.some((token) => result.startsWith(`${token}-`)));
  });
  assert.ok(maxActive <= tokens.length);
};

const tests = [testResolvesReturn, testConcurrencyLimit];

const run = async () => {
  for (const test of tests) {
    try {
      await test();
      console.log(`ok - ${test.name}`);
    } catch (error) {
      console.error(`not ok - ${test.name}`);
      console.error(error);
      process.exitCode = 1;
      return;
    }
  }
};

run();
