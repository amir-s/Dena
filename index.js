const createPromise = () => {
  let done;
  const promise = new Promise(function(resolve, reject){
    done = resolve;
  });
  return {
    promise,
    done
  }
}

const Dena = function (configs, worker) {
  const queue = [];
  const busy = configs.map(() => false);

  const trigger = async () => {
    if (queue.length === 0) return;

    const free = busy.findIndex(b => !b);
    if (free === -1) return;

    const item = queue.shift();
    
    busy[free] = true;
    await worker.apply(null, [configs[free], ...item.args]);
    busy[free] = false;
    item.done();

    trigger();
  }

  return async function () {
    const future = createPromise();
    queue.push({
      args: Array.from(arguments),
      done: future.done
    });
    trigger();

    return future.promise;
  }
}

module.exports = Dena;
