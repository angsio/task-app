import { useEffect } from 'react'

import { stillSignedIn, toLogin } from '../session'

/*
  Send this tab to the sign-in page if the session ended somewhere else.

  In:  nothing
  Out: nothing; it redirects when the session has gone.

  Signing out happens on another subdomain, which cannot message this one
  directly, so the check runs whenever the tab becomes visible again. That is
  the moment it matters: a board left open on a shared machine should not still
  be readable after someone signs out in another tab.
*/
export const useSessionWatch = () => {
    useEffect(() => {
        const check = async () => {
            if (document.visibilityState !== 'visible') return
            if (!await stillSignedIn()) toLogin()
        }

        document.addEventListener('visibilitychange', check)
        window.addEventListener('focus', check)

        return () => {
            document.removeEventListener('visibilitychange', check)
            window.removeEventListener('focus', check)
        }
    }, [])
}
