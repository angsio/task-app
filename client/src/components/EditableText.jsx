import { useState, useEffect } from 'react'

export const EditableText = ({ value, active, onSubmit, onCancel, disabled }) => {
    const [draft, setDraft] = useState(value)

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDraft(value)
    }, [active, value])

    if (!active) {
        return <span>{value}</span>
    }

    const commit = () => {
        if (disabled) return
        onSubmit(draft)
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Escape') onCancel()
    }

    return (
        <form onSubmit={(event) => { event.preventDefault(); commit() }}>
            <input
                type="text"
                value={draft}
                onChange={event => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={commit}
                disabled={disabled}
                autoFocus
            />
        </form>
    )
}
