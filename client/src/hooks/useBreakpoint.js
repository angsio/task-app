import { useSyncExternalStore } from 'react'

// Tailwind's own md/lg defaults. If the theme ever overrides them, match it here.
const WIDTHS = { md: '48rem', lg: '64rem' }

const query = (width) => window.matchMedia(`(width >= ${width})`)

const read = () => {
    if (query(WIDTHS.lg).matches) return 'lg'
    if (query(WIDTHS.md).matches) return 'md'
    return 'base'
}

// Re-render on any crossing; `read` decides which side we landed on.
const listen = (onChange) => {
    const queries = Object.values(WIDTHS).map(query)
    queries.forEach(media => media.addEventListener('change', onChange))

    return () => queries.forEach(media => media.removeEventListener('change', onChange))
}

/*
  The breakpoint the window is currently in: 'base' | 'md' | 'lg'.

  Only for layout a CLASS cannot express — a value React has to compute, like a
  count fed into an inline style. If plain `md:`/`lg:` utilities can do the job,
  use those instead; they cost no JS and no re-render.
*/
export const useBreakpoint = () => useSyncExternalStore(listen, read)
