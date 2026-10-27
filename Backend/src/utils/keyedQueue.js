const queues = new Map();

export function runExclusive(key, task) {
  const previous = queues.get(key) ?? Promise.resolve();
  const result = previous.catch(() => {}).then(task);

  const tail = result.catch(() => {});
  queues.set(key, tail);
  tail.then(() => {
    if (queues.get(key) === tail) queues.delete(key);
  });

  return result;
}
