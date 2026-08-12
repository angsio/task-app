# Task App

A scheduling board and weekly timetable for tasks, events and reminders, with an
assistant that reads your schedule and asks before it changes anything.

<!--
  Screenshot goes here — the board with a few items, or the agent mid-confirmation:
      ![Board](docs/board.png)
-->

Live at [tasks.frangiclave.com](https://tasks.frangiclave.com). Sign-in is
handled by [auth-hub](https://github.com/angsio/auth-hub), one account across
every app on the domain.

## Stack

React 19 · Vite 8 · react-router 7 · Tailwind 4 · Express 5 · Mongoose 9 ·
MongoDB Atlas · Supabase pgvector for tool retrieval · a hosted chat model and a
hosted embedding model, both behind Bedrock · Docker Compose and nginx on a
Raspberry Pi 4B.

## Tools Are Retrieved, Not Handed Over

The usual way to give a model tools is to put every tool in the request and let
it choose. That is fine at three tools and degrades as the list grows, because
every description competes for attention in the same prompt.

Here the model starts holding exactly one tool, `find_tools`. When it needs to
touch the schedule it describes the capability it wants in plain words — "see
what is already scheduled on a day", "create an event" — and that sentence is
embedded and matched against the tool descriptions in pgvector. Only the nearest
matches become callable, and they stay callable for the rest of the turn. It can
search again at any step, which is what a read-then-write request needs.

Eight tools are retrievable: list, create, update and delete, for items and for
themes. `find_tools` itself is the ninth and is never retrieved, since it is the
one the model always holds.

The second half is that writes are gated. Each tool declares `confirm: true` or
not. Read tools run the moment they are called; a write tool stops the loop and
returns a plain-language summary of what it is about to do, which the client
renders as a yes or no. The summary is built by the tool itself, so the front end
never has to know any tool's argument shape.

A gate on its own is not enough, because the server keeps no session: the
transcript round-trips through the client, so an approved turn that gets resent —
a lost response and a retry, a reload, two tabs — arrives looking exactly like
the first one, and the gate would reopen and write again. So a tool marked
`once: true` claims the model's own id for that call in Mongo before doing
anything, under a unique index on `(owner, callId)`. The insert is the lock:
duplicates race, one wins, and the losers replay the winner's stored outcome
rather than writing a second time. A write that throws is recorded as failed
instead of released, since it may have landed partway — asking again produces a
new call id and a fresh attempt, so nothing is stranded.

One approval usually carries several writes, and they either all land or none of
them do. The set runs inside a single Mongo transaction, ordered so a theme is
written before the items filed under it and deleted after them. The first error
aborts the lot, and the ledger forgets those calls, so asking again runs them
properly instead of replaying a failure.

Transactions are the part unit tests cannot reach, so `npm run txcheck` runs 21
assertions against a real replica set. It works on a scratch database on the
app's own cluster and drops it on the way out. What it checks: that a tool sees
an earlier tool's uncommitted write inside the same set, that a failed set leaves
nothing behind, that the ledger forgets rolled-back calls, that a tool which
throws still unwinds, and that deleting a theme takes its items with it.

Ownership is the other thing the loop cannot get wrong. Every tool is handed the
signed-in account id from the session, and `owner` is stripped from request
bodies before they reach the database, so an item cannot be filed under somebody
else's name even if the model asks for it.

## Known Limitations

Eight tools are retrievable now, up from three. List, create, update and delete
each exist for items and for themes, so a query has close neighbours to get wrong
instead of one obvious answer. Eight is still not thirty, which is the size this
was built for.

Retrieval quality is measured now. `npm run eval` scores it against 46 cases
offline and `npm run metrics` prints what the live agent did.
[`server/metrics/`](server/metrics/README.md) says what those numbers mean and
what they miss. The biggest miss is groundedness: nothing scores whether an
answer stuck to what the tools returned, only a narrow check on the clock times
it quoted.

Writes are last-write-wins at field granularity, because `PATCH` is partial and
there is no version check on the document. Two tabs editing the same item will
not conflict, they will simply overwrite each other. The ledger stops one call
running twice. It does nothing about two different calls arriving at once.

There is no test framework and nothing runs on push. `txcheck` asserts, but you
have to run it yourself. The eval scores retrieval and asserts nothing at all.
Neither one touches the API routes, so status codes, auth rejection and request
validation are unchecked.

## Running Locally

```bash
cd server && npm install && npm run dev      # :5001
node agent/seedTools.js                      # seeds the retrieval index
node scripts/indexes.js                      # shows the indexes; --drop prunes
cd client && npm install && npm run dev      # :5173
```

`seedTools.js` needs running once, and again after any tool description changes.
The descriptions are what retrieval matches against, so editing one without
reseeding leaves the index disagreeing with the code.

Three more, none of which touch the request path:

```bash
cd server
npm run eval        # score retrieval against metrics/eval/cases.json
npm run metrics     # print the report over the retained window
npm run txcheck     # 21 assertions on a scratch database, dropped after
```

`txcheck` needs `MONGODB_URI` pointing at a replica set, since transactions do
not exist without one. Atlas is one by default.

```
server/.env   PORT  MONGODB_URI  AUTH_URL  ALLOWED_ORIGINS
              SUPABASE_URL  SUPABASE_SECRET_KEY
              AWS_MODELS_TOKEN  CHAT_URL  EMBED_URL

              METRICS_SALT  and the METRICS_* / EVAL_* settings in
              server/metrics/README.md. Set METRICS_SALT before running
              anywhere real: account ids are short and enumerable, so an
              unsalted hash is reversible by anyone holding the id list.

client/.env   VITE_API_URL  VITE_AUTH_URL
```

The server needs [auth-hub](https://github.com/angsio/auth-hub) running for
`AUTH_URL` to answer, and Supabase needs a `tool_embeddings` table plus a
`match_tools` function before `seedTools.js` has anywhere to write.
