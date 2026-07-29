import { NavLink } from 'react-router-dom'

const NAV_LINKS = [
    { label: 'Board', to: '/board' },
    { label: 'Schedule', to: '/schedule' },
]

const styles = {
    bar:        'border-b border-border/70 bg-void/80 text-lg backdrop-blur-md',
    link:       'font-display tracking-wide text-parchment-dim transition-colors hover:text-accent-bright',
    linkActive: 'font-display tracking-wide text-parchment',
    star:       'text-accent',
    starIdle:   'text-transparent',
}

const linkLayout = 'inline-flex items-center gap-2 py-2'

export const Navbar = () => {
    return (
        <div className={`h-(--nav-h) w-full flex items-center shrink-0 px-10 gap-8 ${styles.bar}`}>
            {NAV_LINKS.map(link => (
                <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) => `${linkLayout} ${isActive ? styles.linkActive : styles.link}`}
                >
                    {({ isActive }) => (
                        <>
                            <span aria-hidden className={isActive ? styles.star : styles.starIdle}>✦</span>
                            {link.label}
                        </>
                    )}
                </NavLink>
            ))}
        </div>
    )
}
