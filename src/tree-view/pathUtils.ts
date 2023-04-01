export const DEFAULT_ROOT_PATH = '$';

const WILDCARD = '*';

export function hasChildNodes(data, dataIterator) {
  // We pretend that Error objects have a child node so that the stack trace
  // can be expanded/collapsed.
  return !dataIterator(data).next().done || (data instanceof Error && data.stack !== undefined);
}

export const wildcardPathsFromLevel = (level) => {
  // i is depth
  return Array.from({ length: level }, (_, i) =>
    [DEFAULT_ROOT_PATH].concat(Array.from({ length: i }, () => '*')).join('.')
  );
};

export const getExpandedPaths = (data, dataIterator, expandPaths, expandLevel, prevExpandedPaths) => {
  const wildcardPaths = []
    .concat(wildcardPathsFromLevel(expandLevel))
    .concat(expandPaths)
    .filter((path) => typeof path === 'string'); // could be undefined

  const expandedPaths = [];
  wildcardPaths.forEach((wildcardPath) => {
    const keyPaths = wildcardPath.split('.');
    const populatePaths = (curData, curPath, depth) => {
      if (depth === keyPaths.length) {
        expandedPaths.push(curPath);
        return;
      }
      const key = keyPaths[depth];
      if (depth === 0) {
        if (hasChildNodes(curData, dataIterator) && (key === DEFAULT_ROOT_PATH || key === WILDCARD)) {
          populatePaths(curData, DEFAULT_ROOT_PATH, depth + 1);
        }
      } else {
        if (key === WILDCARD) {
          for (const { name, data } of dataIterator(curData)) {
            if (hasChildNodes(data, dataIterator)) {
              populatePaths(data, `${curPath}.${name}`, depth + 1);
            }
          }
        } else {
          let value = curData[key];

          if (curData.nodeType === Node.ELEMENT_NODE && curData.childNodes) {
            const [tagName, indexStr] = key.split('[');
            const index = parseInt(indexStr.substr(0, indexStr.length - 1));
            value = curData.childNodes[index];
            value = value && value.tagName.toUpperCase() === tagName ? value : undefined;
          }

          if (hasChildNodes(value, dataIterator)) {
            populatePaths(value, `${curPath}.${key}`, depth + 1);
          }
        }
      }
    };

    populatePaths(data, '', 0);
  });

  return expandedPaths.reduce(
    (obj, path) => {
      obj[path] = true;
      return obj;
    },
    { ...prevExpandedPaths }
  );
};
