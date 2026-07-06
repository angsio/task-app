import { useState } from 'react'

// Controlled text input with submit-on-enter/blur and cancel-on-escape.
// onSubmit returns a truthy result on success, falsy on failure; the field only
// clears (when clearOnSubmit) on success, so a rejected submit keeps the user's text.
export const TextInput = ({
    initialValue = '',
    onSubmit,
    onCancel = () => {},
    disabled,
    placeholder,
    clearOnSubmit = false,
    submitLabel,
}) => {
    const [draft, setDraft] = useState(initialValue)

    const commit = async () => {
        if (disabled) return
        const result = await onSubmit(draft)
        if (result && clearOnSubmit) setDraft('')
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            setDraft(initialValue)
            onCancel()
        }
    }

    return (
        <form onSubmit={(event) => { event.preventDefault(); commit() }} className="flex items-center gap-4">
            <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={commit}
                disabled={disabled}
                placeholder={placeholder}
                autoFocus
            />
            {submitLabel && <button type="submit" disabled={disabled}>{submitLabel}</button>}
        </form>
    )
}
