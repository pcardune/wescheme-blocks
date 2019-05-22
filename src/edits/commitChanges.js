import CodeMirror from 'codemirror';
import {store} from '../store';
import SHARED from '../shared';
import {poscmp, adjustForChange} from '../utils';
import {activate} from '../actions';
import patch from './patchAst';


const tmpDiv = document.createElement('div');
const tmpCM = CodeMirror(tmpDiv, {value: ""});
const raw = lines => lines.join('').trim();

// commitChanges :
//   Changes, FocusHint, {newAST, focusId} -> Void, exception -> Void
//   -> Void
// where
//   Changes has the form:
//     [{text: string, from: Pos, to: Pos, label: string}]
//   FocusHint is a function of type:
//     ast -> ASTNode|null|"fallback"
//     (If null, remove focus. If "fallback", fall back on computeFocusNodeFromChanges.)
//
// Attempt to commit a set of text changes to Code Mirror.
// If successful (i.e., if the resulting program parses),
//   then make the changes, update the focus, and call the success callback.
// If not successful,
//   then do not make the changes, leave the focus alone, and call the error callback.
export function commitChanges(
  changes,
  focusHint = undefined,
  onSuccess = () => {},
  onError = () => {}
) {
  tmpCM.setValue(SHARED.cm.getValue());
  let handler = (cm, changeArr) => {
    let newAST = null;
    try {
      newAST = SHARED.parser.parse(tmpCM.getValue());
    } catch (exception) {
      onError(exception);
      return;
    }
    // patch the tree and set the state
    SHARED.cm.operation(changes(SHARED.cm));
    let {ast: oldAST, collapsedList} = store.getState();
    if(oldAST.hash !== newAST.hash) newAST = patch(oldAST, newAST);
    store.dispatch({type: 'SET_AST', ast: newAST});
    // Use the focus hint to determine focus, unless:
    // 1. There is no focus hint, or
    // 2. There is a focus hint, but when you call it it returns "fallback".
    // In those cases, use `computeFocusNodeFromChanges` instead.
    let focusNode = focusHint ? focusHint(newAST) : "fallback";
    if (focusNode === "fallback") {
      focusNode = computeFocusNodeFromChanges(changeArr, newAST);
    }
    let focusId = focusNode ? focusNode.id : null;
    while (focusNode && focusNode.parent && (focusNode = focusNode.parent)) {
      if (collapsedList.includes(focusNode.id)) focusId = focusNode.id;
    }
    store.dispatch(activate(focusId));
    onSuccess({newAST, focusId});
  };

  tmpCM.on('changes', handler);
  tmpCM.operation(changes(tmpCM));
  tmpCM.off('changes', handler);
}

// TODO: make this private
// TODO: update this heuristic to work better with Editing-Syntax-style edits.
// computeFocusNodeFromChanges : [CMchanges], AST -> Number
// compute the focusId by identifying the node in the newAST that was
//   (a) most-recently added (if there's any insertion)
//   (b) before the first-deleted (in the case of deletion)
//   (c) first root node (in the case of deleting a pre-existing first node)
//   (d) null (in the case of deleting the only nodes in the tree)
// NOTE(Justin): This is a set of _heuristics_ that are likely but not
// guaranteed to work, because textual edits may obscure what's really going on.
// Whenever possible, a `focusHint` should be given.
export function computeFocusNodeFromChanges(changes, newAST) {
  let insertion = false, focusId = false;
  let startLocs = changes.map(c => {
    c.from = adjustForChange(c.from, c, true);
    c.to   = adjustForChange(c.to,   c, false);
    if(c.text.join("").length > 0) insertion = c; // remember the most-recent insertion
    return c.from;                                // return the starting srcLoc of the change
  });
  if(insertion) {
    // Case A: grab the inserted node, *or* the node that ends in
    // insertion's ending srcLoc (won't ever be null post-insertion)
    let insertedNode = newAST.getNodeAt(insertion.from, insertion.to);
    let lastNodeInserted = newAST.getNodeBeforeCur(insertion.to);
    return insertedNode || lastNodeInserted;
  } else {
    startLocs.sort(poscmp);                                // sort the deleted ranges
    let focusNode = newAST.getNodeBeforeCur(startLocs[0]); // grab the node before the first
    // Case B: If the node exists, use the Id. 
    // Case C: If not, use the first node...unless...
    // Case D: the tree is empty, so return null
    return focusNode || newAST.getFirstRootNode() || null;
  }
}
