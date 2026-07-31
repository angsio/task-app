const AUTH = import.meta.env.VITE_AUTH_URL ?? 'http://localhost:5175'

// () -> never returns; the page leaves for the sign-in screen and comes back here.
export const toLogin = () => {
    window.location.href = `${AUTH}/login?next=${encodeURIComponent(window.location.href)}`
}

/*
  Is the session still alive?

  In:  nothing; the shared cookie travels on its own
  Out: Promise<boolean>. True if unreachable, because a network blip should not
       throw someone out of a board they are looking at.
*/
export const stillSignedIn = async () => {
    try {
        const response = await fetch(`${AUTH}/auth/me`, { credentials: 'include' })
        return response.ok
    } catch {
        return true
    }
}
