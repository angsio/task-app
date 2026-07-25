import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export const IconButton = ({ icon, onClick, title, disabled, className = '' }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            aria-label={title}
            disabled={disabled}
            className={className}
        >
            <FontAwesomeIcon icon={icon} />
        </button>
    )
}
