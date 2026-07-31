import { useRef, useState } from 'react'

/*
  The single text primitive: a span that becomes a bare input.

  In:  value           string, shown when inactive and seeded when active
       active          boolean. The PARENT owns this and decides what
                       commit/cancel mean (rename vs live-create)
       onSubmit        (text: string) -> void, on Enter or blur
       onCancel        () -> void, on Escape
       disabled        boolean, blocks committing
       placeholder     string
       maxLength       number. When set, a counter renders beside the input
       className       string, on the span/wrapper
       inputClassName  string, on the input, so the caller sizes the box

  Out: a <span> when inactive, a bare <input> (no form, no button) when active.

  Uncontrolled, so it re-seeds from `value` every time it goes active and a
  failed write keeps the user's text on screen.
*/
export const EditableText = ({
    value,
    active,
    onSubmit,
    onCancel = () => {},
    disabled,
    placeholder,
    maxLength,
    className = '',
    inputClassName = '',
    counterClassName = 'shrink-0 text-xs text-ash tabular-nums',
}) => {
    const inputRef = useRef(null)
    const [length, setLength] = useState(value?.length ?? 0)

    if (!active) {
        return <span className={`truncate ${className}`}>{value}</span>
    }

    const commit = () => {
        if (disabled) return
        onSubmit(inputRef.current.value)
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') commit()
        else if (event.key === 'Escape') onCancel()
    }

    const field = (
        <input
            ref={inputRef}
            type="text"
            defaultValue={value}
            maxLength={maxLength}
            onKeyDown={handleKeyDown}
            onBlur={commit}
            onChange={event => setLength(event.target.value.length)}
            disabled={disabled}
            placeholder={placeholder}
            autoFocus
            className={maxLength ? `flex-1 min-w-0 ${inputClassName}` : inputClassName}
        />
    )

    if (!maxLength) return field

    return (
        <span className={`flex items-center gap-2 ${className}`}>
            {field}
            <span className={counterClassName}>{length}/{maxLength}</span>
        </span>
    )
}