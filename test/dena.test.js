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

const testErrorPropagation = async () => {
  const scheduler = Dena([1], async (config, value) => {
    throw new Error('boom');
  });

  await assert.rejects(
    async () => scheduler(5),
    { message: 'boom' }
  );
};

const testErrorReleasesResource = async () => {
  // If an error doesn't release the resource, subsequent tasks will hang
  const tokens = ['a'];
  const order = [];

  const worker = async (token, shouldFail) => {
    await sleep(10);
    if (shouldFail) {
      throw new Error('intentional');
    }
    return token;
  };

  const scheduler = Dena(tokens, worker);

  // First call fails
  await assert.rejects(
    async () => scheduler(true),
    { message: 'intentional' }
  );

  // Second call should still work (resource was released)
  const result = await scheduler(false);
  assert.strictEqual(result, 'a');
};

const testQueueContinuesAfterError = async () => {
  const tokens = ['a', 'b'];
  const results = [];

  const worker = async (token, shouldFail, id) => {
    await sleep(5);
    if (shouldFail) {
      throw new Error(`fail-${id}`);
    }
    return `ok-${id}`;
  };

  const scheduler = Dena(tokens, worker);

  const promises = await Promise.allSettled([
    scheduler(true, 1),
    scheduler(false, 2),
    scheduler(false, 3),
    scheduler(false, 4),
  ]);

  assert.strictEqual(promises[0].status, 'rejected');
  assert.strictEqual(promises[0].reason.message, 'fail-1');
  assert.strictEqual(promises[1].status, 'fulfilled');
  assert.strictEqual(promises[1].value, 'ok-2');
  assert.strictEqual(promises[2].status, 'fulfilled');
  assert.strictEqual(promises[2].value, 'ok-3');
  assert.strictEqual(promises[3].status, 'fulfilled');
  assert.strictEqual(promises[3].value, 'ok-4');
};

const tests = [testResolvesReturn, testConcurrencyLimit, testErrorPropagation, testErrorReleasesResource, testQueueContinuesAfterError];

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
