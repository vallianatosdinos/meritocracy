import { SCALE_SHORT, type Fork } from '../engine'
import { QUESTION_H, rowY, slotX, type Zoom } from './layout'
import type { TreeNode } from './tree'

interface Props {
  fork: Fork
  node: TreeNode
  zoom: Zoom
  focused: boolean
  onFocus: () => void
}

/**
 * A question, at one place in the tree.
 *
 * The same fork appears once per distinct history, which is the point: row N is
 * fork N asked of everyone who could have got there.
 */
export const QuestionCard = ({ fork, node, zoom, focused, onFocus }: Props): JSX.Element => {
  const labels = zoom !== 'life'
  const classes = [
    'q-card',
    node.kind === 'stub' ? 'stub' : '',
    node.onActivePath ? 'active' : 'parallel',
    node.isCurrent ? 'current' : '',
    focused ? 'focused' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className="q-node"
      style={{ left: slotX(node.x), top: rowY(node.depth), height: QUESTION_H }}
    >
      <div className={classes} onClick={onFocus} role="button" tabIndex={0}>
        <span className="q-scale">{SCALE_SHORT[fork.scale]}</span>
        {labels && <span className="q-when">{fork.when}</span>}
        {node.isCurrent && labels && <span className="q-now">now</span>}
      </div>
      {zoom === 'moment' && focused && node.kind === 'lived' && (
        <p className="q-prose">{fork.prose}</p>
      )}
    </div>
  )
}
