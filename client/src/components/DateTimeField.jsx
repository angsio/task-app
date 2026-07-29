const styles = {
    field: 'bg-void border border-border rounded-md transition-colors focus-within:border-accent',
    label: 'text-parchment-dim',
    input: 'datetime-field bg-transparent text-center text-parchment focus:outline-none',
}

const toDateTimeLocal = (value) => {
    if (!value) return ''
    const date = new Date(value)
    const offset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

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
        <div className={`w-full flex flex-row items-center px-4 ${styles.field} ${className}`}>
            <span className={`w-1/4 ${styles.label}`}>{label}</span>
            <input
                type="datetime-local"
                defaultValue={toDateTimeLocal(value)}
                onBlur={commit}
                onKeyDown={commitOnEnter}
                className={`h-full w-3/4 ${styles.input}`}
            />
        </div>
    )
}
