import { Link } from 'react-router-dom'

const styles = {
    bar: 'bg-cyan-500',
}

export const Navbar = () => {
    return (
        <div className={`h-1/20 w-full flex items-center px-10 gap-4 ${styles.bar}`}>
            <Link to="/board">Board</Link>
            <Link to="/schedule">Schedule</Link>
        </div>
    )
}
