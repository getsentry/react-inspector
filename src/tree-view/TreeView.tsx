import React, { useContext, useCallback, useLayoutEffect, useState, memo } from 'react';
import { ExpandedPathsContext } from './ExpandedPathsContext';
import { TreeNode } from './TreeNode';
import { DEFAULT_ROOT_PATH, hasChildNodes, getExpandedPaths } from './pathUtils';

import { useStyles } from '../styles';
import { ObjectValue } from '../object/ObjectValue';

const ConnectedTreeNode = memo<any>((props) => {
  const { data, dataIterator, path, depth, nodeRenderer, onExpand } = props;
  const [expandedPaths, setExpandedPaths] = useContext(ExpandedPathsContext);
  const nodeHasChildNodes = hasChildNodes(data, dataIterator);
  const expanded = !!expandedPaths[path];
  const isError = data instanceof Error;
  const shouldShowArrow = nodeHasChildNodes || isError;

  const handleClick = useCallback(() => {
    if (nodeHasChildNodes || isError) {
      setExpandedPaths((prevExpandedPaths) => {
        const newExpandedPaths = {
          ...prevExpandedPaths,
          [path]: !expanded,
        };

        return newExpandedPaths;
      });

      if (typeof onExpand === 'function') {
        onExpand(path, { ...expandedPaths, [path]: !expanded });
      }
    }
  }, [nodeHasChildNodes, setExpandedPaths, path, expanded, onExpand]);

  console.log(isError);
  return (
    <TreeNode
      expanded={expanded}
      // show arrow anyway even if not expanded and not rendering children
      shouldShowArrow={shouldShowArrow}
      // show placeholder only for non root nodes
      shouldShowPlaceholder={depth > 0}
      // Render a node from name and data (or possibly other props like isNonenumerable)
      nodeRenderer={nodeRenderer}
      {...props}
      // Do not allow override of `onClick`
      onClick={handleClick}>
      {
        // only render if the node is expanded
        expanded ? (
          isError ? (
            <ObjectValue object={data} />
          ) : (
            [...dataIterator(data)].map(({ name, data, ...renderNodeProps }) => {
              return (
                <ConnectedTreeNode
                  name={name}
                  data={data}
                  depth={depth + 1}
                  path={`${path}.${name}`}
                  key={name}
                  dataIterator={dataIterator}
                  nodeRenderer={nodeRenderer}
                  onExpand={onExpand}
                  {...renderNodeProps}
                />
              );
            })
          )
        ) : null
      }
    </TreeNode>
  );
});

// ConnectedTreeNode.propTypes = {
//   name: PropTypes.string,
//   data: PropTypes.any,
//   dataIterator: PropTypes.func,
//   depth: PropTypes.number,
//   expanded: PropTypes.bool,
//   nodeRenderer: PropTypes.func,
//   onExpand: PropTypes.func,
// };

export const TreeView = memo<any>(({ name, data, dataIterator, nodeRenderer, expandPaths, expandLevel, onExpand }) => {
  const styles = useStyles('TreeView');
  const stateAndSetter = useState({});
  const [, setExpandedPaths] = stateAndSetter;

  useLayoutEffect(
    () =>
      setExpandedPaths((prevExpandedPaths) =>
        getExpandedPaths(data, dataIterator, expandPaths, expandLevel, prevExpandedPaths)
      ),
    [data, dataIterator, expandPaths, expandLevel]
  );

  return (
    <ExpandedPathsContext.Provider value={stateAndSetter}>
      <ol role="tree" style={styles.treeViewOutline}>
        <ConnectedTreeNode
          name={name}
          data={data}
          dataIterator={dataIterator}
          depth={0}
          path={DEFAULT_ROOT_PATH}
          nodeRenderer={nodeRenderer}
          onExpand={onExpand}
        />
      </ol>
    </ExpandedPathsContext.Provider>
  );
});

// TreeView.propTypes = {
//   name: PropTypes.string,
//   data: PropTypes.any,
//   dataIterator: PropTypes.func,
//   nodeRenderer: PropTypes.func,
//   expandPaths: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
//   expandLevel: PropTypes.number,
// };
