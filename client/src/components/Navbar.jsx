import { Link } from 'react-router-dom'

export const Navbar = () => {
    return (
        <div className="h-1/20 w-full flex items-center px-10 bg-cyan-500">
            <Link to="/board">Board</Link>
        </div>
    )
}
