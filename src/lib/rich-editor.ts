/**
 * Selection-safe helpers for contentEditable rich editors.
 * Preserves the user's selection when using the toolbar so bold / color / lists
 * apply to the full description (titles, bullets, mixed blocks).
 */

export function saveSelection(editor: HTMLElement): Range | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return null;
  return range.cloneRange();
}

export function restoreSelection(
  editor: HTMLElement,
  range: Range | null
): boolean {
  if (!range) return false;
  try {
    // Ensure range still lives under the editor
    if (!editor.contains(range.commonAncestorContainer)) return false;
    const sel = window.getSelection();
    if (!sel) return false;
    sel.removeAllRanges();
    sel.addRange(range);
    return true;
  } catch {
    return false;
  }
}

/**
 * Run an execCommand against the editor without losing the active selection.
 * Uses styleWithCSS so color / size land as span[style] consistently.
 */
export function applyEditorCommand(
  editor: HTMLElement,
  command: string,
  arg?: string,
  savedRange?: Range | null
): boolean {
  const range = savedRange ?? saveSelection(editor);
  editor.focus();
  restoreSelection(editor, range);

  try {
    document.execCommand("styleWithCSS", false, "true");
  } catch {
    /* optional */
  }

  try {
    const ok = document.execCommand(command, false, arg);
    // Some browsers return false even when the command partially worked
    return ok;
  } catch {
    return false;
  }
}

/** Snapshot selection on mousedown of toolbar (before focus moves). */
export function captureEditorSelection(
  editor: HTMLElement | null
): Range | null {
  if (!editor) return null;
  return saveSelection(editor);
}
