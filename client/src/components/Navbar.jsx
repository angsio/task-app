import { Link } from 'react-router-dom'

export const Navbar = () => {
    return (
        <div className="flex items-center gap-10 px-10 h-1/15 w-full bg-cyan-500">
            <Link to="/board">Board</Link>
        </div>
    )
}
