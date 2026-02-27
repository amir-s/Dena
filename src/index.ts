type DoneFn<TResult> = (value: TResult) => void;
type FailFn = (error: unknown) => void;

type PromiseLikeValue<TResult> = TResult | Promise<TResult>;

type Worker<TConfig, TArgs extends unknown[], TResult> = (
  config: TConfig,
  ...args: TArgs
) => PromiseLikeValue<TResult>;

type Scheduler<TArgs extends unknown[], TResult> = (
  ...args: TArgs
) => Promise<TResult>;

const createPromise = <TResult>(): {
  promise: Promise<TResult>;
  done: DoneFn<TResult>;
  fail: FailFn;
} => {
  let done: DoneFn<TResult>;
  let fail: FailFn;
  const promise = new Promise<TResult>((resolve, reject) => {
    done = resolve;
    fail = reject;
  });
  return {
    promise,
    done: done!,
    fail: fail!,
  };
};

const Dena = <TConfig, TArgs extends unknown[], TResult>(
  configs: TConfig[],
  worker: Worker<TConfig, TArgs, TResult>
): Scheduler<TArgs, TResult> => {
  const queue: Array<{ args: TArgs; done: DoneFn<TResult>; fail: FailFn }> = [];
  const busy = configs.map(() => false);

  const trigger = async (): Promise<void> => {
    if (queue.length === 0) return;

    const free = busy.findIndex((b) => !b);
    if (free === -1) return;

    const item = queue.shift();
    if (!item) return;

    busy[free] = true;
    try {
      const returned = await worker(configs[free], ...item.args);
      item.done(returned);
    } catch (error) {
      item.fail(error);
    } finally {
      busy[free] = false;
    }

    trigger();
  };

  return (...args: TArgs) => {
    const future = createPromise<TResult>();
    queue.push({
      args,
      done: future.done,
      fail: future.fail,
    });
    trigger();

    return future.promise;
  };
};

export = Dena;
