import { useRef } from 'react'

export const EditableText = ({ value, active, onSubmit, onCancel = () => {}, disabled, placeholder, inputClassName }) => {
    const inputRef = useRef(null)

    if (!active) {
        return <span>{value}</span>
    }

    const commit = () => {
        if (disabled) return
        onSubmit(inputRef.current.value)
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') commit()
        else if (event.key === 'Escape') onCancel()
    }

    return (
        <input
            ref={inputRef}
            type="text"
            defaultValue={value}
            onKeyDown={handleKeyDown}
            onBlur={commit}
            disabled={disabled}
            placeholder={placeholder}
            autoFocus
            className={inputClassName}
        />
    )
}
