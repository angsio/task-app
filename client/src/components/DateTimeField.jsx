const styles = {
    field: 'bg-void border border-border rounded-md transition-colors focus-within:border-accent',
    label: 'text-parchment-dim',
    input: 'datetime-field bg-transparent text-center text-parchment focus:outline-none',
}

// (value: string | Date | null) -> string, 'YYYY-MM-DDTHH:mm' in local time
// ('' when empty). The format a datetime-local input requires.
const toDateTimeLocal = (value) => {
    if (!value) return ''
    const date = new Date(value)
    const offset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

/*
  A labelled datetime box.

  In:  label      string, shown to the left
       value      string | Date, the current value
       onCommit   (next: string) -> void, called with 'YYYY-MM-DDTHH:mm'
       className  string, sizes the box (the caller owns its height)

  Out: a <div> wrapping a native datetime-local input.

  Commits once, on blur or Enter, and only when the value actually changed.
  Two rules it must keep: it is never `disabled` mid-write (disabling a focused
  input blurs it, throwing the user out after one segment), and it never writes
  on change (a datetime-local fires change mid-typing, one edit per keystroke).
  Uncontrolled, so a rejected write leaves the user's typing on screen.
*/
export const DateTimeField = ({ label, value, onCommit, className = '' }) => {
    const commit = (event) => {
        const next = event.target.value
        if (!next || next === toDateTimeLocal(value)) return

        onCommit(next)
    }

    const commitOnEnter = (event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
    }

    return (
        <div className={`w-full flex items-center px-4 gap-2 ${styles.field} ${className}`}>
            <span className={`shrink-0 ${styles.label}`}>{label}</span>
            <input
                type="datetime-local"
                defaultValue={toDateTimeLocal(value)}
                onBlur={commit}
                onKeyDown={commitOnEnter}
                className={`h-full flex-1 min-w-0 ${styles.input}`}
            />
        </div>
    )
}
