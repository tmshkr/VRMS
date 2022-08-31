/*
Returns a new object with the values from the given object, with one layer of nesting removed.
Useful for extracting nested values from `view.state.values`.
*/

export function getInnerValues(obj) {
  const values = {} as any;
  for (const key in obj) {
    const [innerKey] = Object.keys(obj[key]);
    values[innerKey] = obj[key][innerKey];
  }
  return values;
}
