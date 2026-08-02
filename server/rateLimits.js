import { rateLimit, MINUTE } from 'express-rate-limit'

/*
  Limits on this app's API.

  Every limiter here runs after requireUser, so the account id is available and
  is the natural thing to count against: it is exact, it survives someone
  changing networks, and it sidesteps the whole question of which address a
  request appears to come from behind two proxies.
*/
const byUser = (req) => req.user.id

const shared = {
    keyGenerator: byUser,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
}

/*
  The agent. Tightest limit in the app, because it is the only route that costs
  money: each call reaches a hosted model, sometimes several times over as the
  tool loop turns.

  Thirty in fifteen minutes is far above ordinary conversation and far below
  what a script left running overnight would manage.
*/
export const agentLimiter = rateLimit({
    ...shared,
    windowMs: 15 * MINUTE,
    limit: 30,
    message: { error: 'The assistant is resting. Try again in a few minutes.' },
})

/*
  Writes to the board. Reads are skipped: loading the page issues several at
  once, and they are cheap.

  This is a runaway guard rather than a security control, since a signed-in
  account editing its own data is not an attack. It stops a loop in the client
  from filling the database.
*/
export const writeLimiter = rateLimit({
    ...shared,
    windowMs: 15 * MINUTE,
    limit: 200,
    skip: (req) => req.method === 'GET',
    message: { error: 'Too many changes at once. Give it a moment.' },
})
