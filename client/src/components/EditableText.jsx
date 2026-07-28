import { useRef, useState } from 'react'

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