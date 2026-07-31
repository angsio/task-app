const BASE = import.meta.env.VITE_API_URL ?? '/api'
const AUTH = import.meta.env.VITE_AUTH_URL ?? 'http://localhost:5175'

/*
  The single sink every api/ function goes through.

  In:  path    string, appended to the API base ('/items/123')
       method  string, required, an omitted verb throws rather than GETs
       body    object, JSON-encoded when present

  Out: Promise<any>, the parsed JSON body.
       Throws Error(serverMessage) on a non-2xx, which useMutation turns into a
       toast and useQuery into an inline message.

  A 401 is the exception: it means no session, so instead of surfacing an error
  the page leaves for the login screen and comes back here afterwards.
*/
export const request = async (path, { method, body } = {}) => {
    if (!method) throw new Error(`request(${path}) needs an explicit method`)

    const res = await fetch(BASE + path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    })

    if (res.status === 401) {
        window.location.href = `${AUTH}/login?next=${encodeURIComponent(window.location.href)}`
        return new Promise(() => {})
    }

    if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error)
    }

    return res.json()
}