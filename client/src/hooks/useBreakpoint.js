import { useSyncExternalStore } from 'react'

// { md: string, lg: string } — Tailwind's own defaults. If the theme ever
// overrides them, match it here.
const WIDTHS = { md: '48rem', lg: '64rem' }

// (width: string) -> MediaQueryList
const query = (width) => window.matchMedia(`(width >= ${width})`)

// () -> 'base' | 'md' | 'lg', the widest breakpoint the window satisfies now
const read = () => {
    if (query(WIDTHS.lg).matches) return 'lg'
    if (query(WIDTHS.md).matches) return 'md'
    return 'base'
}

// (onChange: () => void) -> () => void, the unsubscribe
// Fires on any crossing; `read` decides which side we landed on.
const listen = (onChange) => {
    const queries = Object.values(WIDTHS).map(query)
    queries.forEach(media => media.addEventListener('change', onChange))

    return () => queries.forEach(media => media.removeEventListener('change', onChange))
}

/*
  Which breakpoint the window is currently in.

  In:  nothing.
  Out: 'base' | 'md' | 'lg'. Re-renders the caller when the window crosses one.

  Only for layout a CLASS cannot express — a value React has to compute, like a
  count fed into an inline style. If plain `md:`/`lg:` utilities can do the job,
  use those instead; they cost no JS and no re-render.
*/
export const useBreakpoint = () => useSyncExternalStore(listen, read)
