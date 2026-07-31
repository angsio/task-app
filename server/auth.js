import { ApiError } from './errors.js'

// Where the auth service lives. In compose this is the service name on the
// internal network; nothing outside needs to reach it.
const AUTH_URL = process.env.AUTH_URL ?? 'http://localhost:5002'

// This app's name, as it would appear in a user's `apps` list.
const APP = 'tasks'

/*
  Identify the caller, or refuse the request.

  In:  req  the Express request; only its cookie header matters
  Out: calls next() with req.user = { id, email, apps } set.
       Throws 401 when there is no valid session, 403 when the account exists
       but is not allowed into this app.

  The session cookie is opaque to us, so we hand it to the auth service and ask
  who it belongs to. This app never sees a password and never reads the accounts
  database. It only learns an id it can scope queries by.

  `apps: []` means unrestricted, which is every account today. Put 'tasks' in an
  account's list (alongside any other apps) to limit it to those.
*/
export const requireUser = async (req, res, next) => {
    const response = await fetch(`${AUTH_URL}/auth/me`, {
        headers: { cookie: req.headers.cookie ?? '' },
    }).catch(() => null)

    if (!response) throw new ApiError(503, 'Sign-in is unavailable right now.')
    if (!response.ok) throw new ApiError(401, 'Sign in to continue.')

    const { user } = await response.json()

    if (user.apps.length && !user.apps.includes(APP)) {
        throw new ApiError(403, 'This account does not have access to Tasks.')
    }

    req.user = user
    next()
}
