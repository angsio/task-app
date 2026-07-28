import { NavLink } from 'react-router-dom'

const styles = {
    bar:        'border-b border-border bg-obsidian/90',
    brand:      'font-display text-lg tracking-widest text-accent',
    link:       'font-display tracking-wide text-parchment-dim transition-colors hover:text-accent-bright',
    linkActive: 'font-display tracking-wide text-accent-bright',
}

const linkClass = ({ isActive }) => (isActive ? styles.linkActive : styles.link)

export const Navbar = () => {
    return (
        <div className={`h-1/20 w-full flex items-center gap-8 px-10 ${styles.bar}`}>
            <span className={styles.brand}>✦</span>
            <NavLink to="/board" className={linkClass}>Board</NavLink>
            <NavLink to="/schedule" className={linkClass}>Schedule</NavLink>
        </div>
    )
}