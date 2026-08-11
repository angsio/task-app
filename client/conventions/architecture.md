# ARCHITECTURE — task-app

How the code is **wired**, both sides of the HTTP barrier. For how a `className` is written, see `styling.md`.

Guidelines, not law. They exist so that adding the next feature is *copying an
existing shape, never inventing one*. That is the only test for whether a rule
belongs here. **If a rule stops being true of the code, fix it or delete it** — a
convention that lies is worse than none.

The through-line: **one symmetric pattern, repeated.** Two resources (themes,
items), four CRUD verbs each, both sides of the HTTP barrier, one skeleton.
Everything below is an application of that. Deviations get justified out loud.

1. [Layers](#1-layers) · 2. [api/ vs hooks/](#2-api-vs-hooks) ·
3. [The cache invariant](#3-the-cache-invariant) · 4. [Errors](#4-errors) ·
5. [Feature shape](#5-feature-shape) · 6. [Item cards](#6-item-cards) ·
7. [Shared components](#7-shared-components) · 8. [The agent](#8-the-agent) ·
9. [Naming](#9-naming)

---

## 1. Layers

Dependencies flow one way only. A lower layer never imports a higher one.

```
components/   hooks/   api/     the shared trifecta — knows nothing of
      \         |        /      each other or of anything above
       v        v       v
        features/<name>/         owns domain logic
              v
           pages/                compose features, nothing else
              v
        layouts/  routes/        URL -> (layout, page)
              v
        App.jsx -> main.jsx
```

**What belongs in the trifecta:** anything that would still make sense copied
into an unrelated project. The test is *generic-ness, not headcount* — a
domain-agnostic piece goes there the day it exists, even with one caller, because
that is where a reader looks for reusables. What stays private to a feature is
what **knows the domain** (a card reading `item.itemType`), however many callers
it gets.

**Exports:** named only, no `export default`. Every folder gets an `index.js`
barrel re-exporting its public surface, so renaming a file can't silently break
an anonymous import.

`pages/` compose one or more features and do nothing else — no fetching, no
domain logic. `BoardPage` is one line.

---

## 2. api/ vs hooks/

Two unrelated axes. `api/` grows by **resource**, `hooks/` by **lifecycle shape**.

- **`api/`** is the only place allowed to know the server contract — URLs,
  methods, payload shapes. Plain async functions mirroring the routes 1:1
  (`getThemes`, `createItem`). `request()` is their single sink. New endpoint =
  one thin function here.
- **`hooks/`** is generic React state orchestration around *any* async function.
  It never knows a URL or a resource.

| hook | shape | use it when |
|---|---|---|
| `useQuery(fn, deps)` | the generic READ | fetch on mount / on deps change. Returns `{ data, setData, loading, error }`, with no opinion about what data is |
| `useMutation(fn)` | the generic WRITE | runs on `mutate(...)`. Returns the result or `null` on failure. The HTTP verb lives in the api function, so it serves create, update and delete equally |
| `useCollection(fn, deps)` | `useQuery` + a cache | the data is an `_id`-keyed list kept in sync locally. Hides `setData`, exposes `upsert(doc)` / `remove(doc)` |
| `useBreakpoint()` | environment, not data | layout a CSS class can't express (see `styling.md` §7) |

**Do not add a fourth data hook that only renames one of these.** No
`usePatch`/`useDelete` — they are `useMutation` with a label, and would duplicate
every future fix N times. A new hook is earned by a new *lifecycle shape*.

`useCollection` is not a fourth verb: it literally contains `useQuery` and adds
the only two cache ops the app needs.

> Known friction: `useQuery` sets loading inside its effect, which
> `react-hooks/set-state-in-effect` flags. For a fetch-on-mount read that cascade
> is intended, so the rule is suppressed on that one line — not worked around
> elsewhere.

---

## 3. The cache invariant

**Every server write returns the affected top-level resource as JSON, keyed by
`_id`** — never 204, never a parent wrapping it. Items are their own documents,
so an item write returns that item, not its theme.

Therefore the client cache is a set of flat `_id`-keyed collections with exactly
two operations, which is precisely what `useCollection` provides. One change is
one document: `upsert` swaps a single entry and every other entry keeps its
object identity.

**Mirror server side effects in the cache.** Deleting a theme cascade-deletes its
items server-side, so the client must `remove` those items too, or the cache
holds orphans (`ThemeColumn` loops over the items it already has).

This also applies to the agent: its tools hand back the documents they wrote so
the schedule updates in place, with no refetch and without resetting the
conversation.

---

## 4. Errors

Two kinds, deliberately handled differently:

- **Read-load failure** (`useQuery`/`useCollection`) — the view has no data, so it
  renders an inline message where the data would be.
- **Write failure** (`useMutation`) — the view still has its data and the failure
  is transient, so it goes to one app-wide sink and surfaces as a toast.

The convergence point is **`useMutation`'s own catch block, not each handler**.
Every write already flows through it, so a new feature gets error reporting for
free and cannot forget to wire it. That is why `useMutation` exposes no `error` —
there is nothing for a component to display, and callers never `try/catch`.

---

## 5. Feature shape

**One coordinator per feature.** Each `features/<name>/` has one component named
after the folder (`Board.jsx`), the folder's only public export. Everything else
is private.

The coordinator is the only file that knows all its direct children at once. It
owns the shared data and hands each child its own slice as ordinary props.
Children never import each other, so any one is replaceable. This repeats at
every level: `App` coordinates providers + router, a route coordinates
(layout, page), a page coordinates features, a feature coordinates its leaves.

**Scoped context carries cross-cutting callbacks only.** When a value must reach
a descendant through an intermediate that doesn't care about it, use a Context
scoped to that one feature folder — not global state, not a prop threaded through
indifferent levels.

Shape it narrowly. Context carries only the "this write succeeded, update shared
data" callbacks (the `useCollection` ops). It never carries the mutation itself
and never the raw fetched data: each leaf owns its **own** `useMutation` and its
**own** loading, so it shows its own pending state, and reaches into context only
*after* its write succeeds.

> A stateful Provider component and its context/hook go in separate files —
> react-refresh forbids one file exporting both components and non-components.
> `BoardContext.js` dodges this by re-exporting a raw `Context.Provider` rather
> than defining a Provider component.

---

## 6. Item cards

Items are one collection split by a discriminator (`itemType`). The frontend
mirrors that with **one self-contained card per type** in `features/board/
ItemCards/` — no shared shell, no registry. `ThemeColumn` dispatches through a
small map and renders the match.

Each card writes the same base explicitly: the card box, the universal top line
(title + rename + delete), then its own body. **This trades DRY for readability
on purpose** — three cards that each read top to bottom beat a shell plus a
lookup, and the cost is that a base change touches three files.

**Where that trade stops: a card SHELL is duplicated, a LEAF INPUT is not.** The
shell has no invariant to get wrong, so copies cost only keystrokes. An input
with subtle correctness is the opposite — three copies are three places to get it
wrong — so it becomes one primitive in `components/` (§7).

Creation lives in `CreateItem`, which owns the type list and the per-type
defaults so a title-only create validates.

**Adding a fourth type:** one card + barrel line, one entry in `ThemeColumn`'s
map, one entry in `CreateItem`.

---

## 7. Shared components

`components/` may never know what a theme or an item is — that line is absolute.
Layout is softer: a generic component may own a container as long as it is driven
by **abstract, caller-supplied options**, not baked-in assumptions.

### List

A grid exposed as a symmetric transpose:

| prop | meaning |
|---|---|
| `flow` | `'x'` fills rows then wraps, `'y'` fills columns then wraps |
| `across` | tracks on the fixed cross axis (`'x'` → columns) |
| `visible` | items along the flow axis before it overflows and scrolls |

Swap `x`↔`y` and every column/row swaps with it.

**`across` and `visible` are COUNTS, never sizes.** Callers used to pass the track
size directly and got it subtly wrong in different ways — the same three-visible
row was `'33.333%'` in one file and `calc(100% / 3)` in another. The count is what
the caller means; List owns the division. *A caller computing a percentage for
List means the prop is wrong, not that it needs a bigger escape hatch.*

Both accept a bare count, or `{ base, md, lg }` where an unnamed breakpoint keeps
the value below it. See `styling.md` §7 for how that resolves.

### Input primitives — one per kind of value

Exactly two, split by the **kind of value** being edited, not by which screen
edits it: **`EditableText`** for text, **`DateTimeField`** for a datetime. Both
commit the same way — on Enter or blur, from an uncontrolled input, so a rejected
write leaves the user's typing on screen. Learn the contract once.

`EditableText` renders a `<span>` when inactive and a bare `<input>` when active —
no form, no submit button — so the caller sizes the box via `inputClassName`. The
**parent owns `active`** and decides what commit/cancel mean, which is what lets
one primitive serve two jobs:

- **Rename:** parent holds a `renaming` flag and flips it off on success, leaving
  it on for a server failure so the input keeps the user's text.
- **Live-create:** parent renders a draft element holding an always-`active`
  `EditableText` with `value=""`. Submit persists and unmounts the draft; cancel
  just unmounts it, so it "disappears".

So a create is a draft element *wearing* an active `EditableText`, not a separate
always-present field.

`DateTimeField` exists to hold two non-obvious rules that were being got wrong
per copy:

- **never `disabled` while its write is in flight** — disabling a focused input
  blurs it, throwing the user out after one segment;
- **never writes on change** — a `datetime-local` fires change mid-typing, so one
  edit became a burst of PATCHes.

**A new primitive is earned only by a new kind of value** (a duration, a colour
beyond `ColorPicker`) — never by a caller wanting a different-looking box. That
is what `inputClassName` is for.

---

## 8. The agent

**One endpoint, one turn, no session.** `POST /agent` takes the whole transcript
and returns `{ messages, pending, documents }`. The server stores nothing between
calls, so the transcript *is* the state and the client owns it (`useAgent`).
Answering a confirmation is the same call with `approved: true|false` attached —
there is no second endpoint, because "continue this turn" is the only thing that
ever happens.

**The model earns its tools.** It starts holding exactly one, `find_tools`, so
every turn is a clean fork: answer in words, or search for a capability. What it
finds is offered for the rest of the turn, and it may search again at any step.

```
prompt -> chat ─┬─ no tool call ─────────────> reply, done
                └─ find_tools -> vector match -> tools offered -> chat -> ...
                                                    └─ confirm tool? -> pause, ask the user
```

This costs one extra round trip versus retrieving up front, and buys two things:
the model searches with a *targeted* query ("create a recurring task") instead of
the raw prompt, and chit-chat skips retrieval entirely. At eight tools it is
starting to earn its keep; it is the right shape at thirty.

> **The system prompt is load-bearing.** It is the only thing standing between a
> retrieval-based agent and a confident hallucination, and it carries three jobs:
> that the model cannot see the schedule and must call `find_tools`; that it must
> **read before it writes** when a request refers to something already scheduled
> ("after my meeting"); and the clock. It is rebuilt every turn rather than kept
> in the transcript, because a stored system message would pin "now" to whenever
> the conversation started.
>
> **Timezone is an explicit contract, not an assumption.** Tools report UTC; the
> user speaks local wall-clock. The prompt states the current time, the zone and
> the offset, and requires written times to carry that offset
> (`...T14:00:00-04:00`). Without it the model defaulted to midnight UTC and put
> "in two hours" most of a day out.

A tool's `description` does **double duty** — it is the usage instruction *and*
the text that gets embedded for retrieval. So write it with the vocabulary a
searching model would use ("check for a clash", "look up when an existing item
is"), not just what the tool returns. **Changing a description means re-running
`node agent/seedTools.js`**, or the vector index still matches the old wording.

**Layers, and what each may know:**

| piece | knows | never |
|---|---|---|
| `tools/*.js` | the models and the data layer | the loop, the client, the transcript |
| `runAgent.js` | the message protocol and which tools exist | what any tool *does* |
| `routes/agent.js` | HTTP | anything about tools |
| `useAgent.js` | the transcript and what awaits a yes/no | any tool's argument shape |

A tool returns `{ reply, documents?, offer? }` — `reply` is the only part the
model reads, `documents` feeds the client cache (§3), `offer` widens what may be
called next. A `confirm` tool also supplies `summarise(args)`, so a pending action
reaches the client as **text it can render**, not arguments it must interpret.
That is what keeps tool schemas from leaking across the barrier.

**Retrieval is seeded from `RETRIEVABLE`, not `TOOLS`** — `find_tools` is always
in hand, and embedding it would let a search return the search.

**The loop cannot run away silently.** Exhausting `MAX_STEPS` appends a plain
assistant message saying so, rather than returning as if the model had finished.

---

## 9. Naming

| thing | pattern | example |
|---|---|---|
| api function | `<verb><Resource>`, mirroring the route | `createItem` |
| mutation trigger | aliased `<operation>Mutation` | `mutate: deleteThemeMutation` |
| field-backed handler (two outcomes) | `submit<X>` / `cancel<X>` | `submitRenameTheme` |
| click-once command (no cancel) | `run<X>` | `runDeleteTheme` |
| cache callbacks | the `useCollection` ops themselves | `upsertItem` / `removeTheme` |

Handlers are named for the **UI interaction**, not the HTTP verb — the verb
already lives in the api function.
