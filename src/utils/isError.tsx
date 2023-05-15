export function isError(obj: object) {
  if (obj instanceof Error) {
    return true;
  }

  // If object has the following properties: `name`, `message`, `stack`, then
  // assume it is an Error object
  if ('name' in obj && 'message' in obj && 'stack' in obj) {
    return true;
  }

  return false;
}
