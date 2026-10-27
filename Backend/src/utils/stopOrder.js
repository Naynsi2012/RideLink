export function sortedStops(stops) {
  return [...stops].sort((a, b) => a.order - b.order);
}

export function renumber(stops) {
  return stops.map((stop, index) => ({ ...stop, order: index }));
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function insertAt(stops, stop, position) {
  const list = sortedStops(stops);
  const index = clamp(position ?? list.length, 0, list.length);
  list.splice(index, 0, stop);
  return renumber(list);
}

export function moveTo(stops, stopId, position) {
  const list = sortedStops(stops);
  const from = list.findIndex((stop) => stop.stopId === stopId);
  if (from === -1) return renumber(list);

  const [stop] = list.splice(from, 1);
  list.splice(clamp(position, 0, list.length), 0, stop);
  return renumber(list);
}

export function removeStop(stops, stopId) {
  return renumber(sortedStops(stops).filter((stop) => stop.stopId !== stopId));
}
