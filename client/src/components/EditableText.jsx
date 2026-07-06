import { TextInput } from './TextInput'

// A label that swaps to an editable field while `active`. The parent owns the
// `active` flag: on a successful submit it flips active off (unmounting the
// input); on failure it leaves active on, so TextInput keeps the user's draft.
export const EditableText = ({ value, active, onSubmit, onCancel, disabled, placeholder }) => {
    if (!active) {
        return <span>{value}</span>
    }

    return (
        <TextInput
            initialValue={value}
            onSubmit={onSubmit}
            onCancel={onCancel}
            disabled={disabled}
            placeholder={placeholder}
        />
    )
}
