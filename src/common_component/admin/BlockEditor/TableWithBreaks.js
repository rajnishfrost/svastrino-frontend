import Table from '@editorjs/table'

/**
 * The table tool, with Enter meaning what it means everywhere else in the
 * editor: a new line inside the cell you are typing in.
 *
 * Two things had to change for a cell to keep a line break.
 *
 * The tool takes Enter to mean "move to the next row" and only leaves a break
 * to Shift+Enter, which is not what an admin writing a two-line salary figure
 * expects — and a break the writer cannot see the point of pressing is a break
 * they never make. Tab still walks the cells, so nothing is lost by giving
 * Enter back to the text. (Shift+Enter keeps working too, through the browser's
 * own handling.)
 *
 * The tool also declares no sanitizer rules of its own, so Editor.js kept only
 * what the inline tools asked for and dropped `<br>` on save: the cell read on
 * two lines while it was being edited and came back as one after a reload, with
 * the break gone and nothing in its place ("₹6 - 20 LPAGlobal: $60,000"). The
 * paragraph tool allows `br` on its own text for this reason; a table cell is
 * the same kind of text. Inline formatting is unaffected — the editor merges
 * the inline tools' rules into this one.
 *
 * What the page draws has to stay in step: RichText.jsx renders `<br>`, and
 * richText.js on the server keeps it through a save.
 */
export default class TableWithBreaks extends Table {
  static get sanitize() {
    return { withHeadings: false, content: { br: true } }
  }

  render() {
    const wrapper = super.render()
    // Capture, so this runs before the tool's own handler on the table
    // element. Cancelling the keydown also cancels the keypress it would have
    // produced, which is where "move to the next row" lives.
    wrapper.addEventListener('keydown', breakLine, true)
    return wrapper
  }
}

function breakLine(event) {
  if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return

  // Only inside a cell: the tool's toolboxes sit in this wrapper too.
  if (!event.target?.closest?.('[contenteditable="true"]')) return

  event.preventDefault()
  event.stopPropagation()

  // execCommand is the one call that gets the trailing-break case right — a
  // break at the very end of a cell needs a second `<br>` for the caret to
  // land on the new line, and the browser adds and removes it as you type.
  if (document.execCommand('insertLineBreak')) return

  const selection = window.getSelection()
  if (!selection?.rangeCount) return
  const range = selection.getRangeAt(0)
  range.deleteContents()
  const br = document.createElement('br')
  range.insertNode(br)
  if (!br.nextSibling) br.after(document.createElement('br'))
  range.setStartAfter(br)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
}
