# task-app — Code Infrastructure & Pattern

This file documents *how the codebase is wired and why* — the shape, not the
feature list. Read it left-to-right, from the source of truth (the database)
to where it terminates (the user's screen). Two distinct things travel this
pipe — **information** and **errors** — and each is its own branch below.

The guiding philosophy: **one symmetric pattern, repeated on both sides of the
HTTP barrier, with exactly one convergence point per concern.** Adding a
resource or an endpoint should mean copying a shape, never inventing one.

Status note for future readers: the **backend** and the **frontend `api/`
layer** are settled and match this document exactly. The frontend
*consumption* layer (hooks → coordinator → components) is mid-migration from an
older "task list" model to the current **Theme / Item** model; where this doc
describes those roles, treat it as the target shape being built toward, not
files to trust verbatim yet.


## The one picture

```
        SERVER  (source of truth)                    ║  HTTP  ║              CLIENT  (consumer → UI)
                                                      ║ barrier║
   MongoDB
      │
      ▼   models/  (Mongoose schemas)
   Theme          Item ─┬─ Task       one `items` collection,
   (name, color)        ├─ Event      split by discriminator
                        └─ Reminder   key `itemType`
      │
      ▼   routes/  (express.Router per resource)
   themesRouter, itemsRouter
   every handler = try { happy path } catch (e) { handleError(res, e) }
      │
      ├─ SUCCESS ─▶ res.json(resource) ═══════▶ ║  ║ ═══▶ request() ─▶ api fn ─▶ hook ───── coordinator ─▶ card/field ─▶ 👤
      │                                         ║  ║      parses ok      themes/   useFetch     owns the       renders,
      │                                         ║  ║      body           items.js  useMutation  cache          fires actions
      │                                         ║  ║
      └─ FAILURE ─▶ handleError ──────────────▶ ║  ║ ═══▶ !res.ok →      the thrown Error rides up to the hook:
             (ApiError | ValidationError |      ║  ║      throw            • useMutation → notify() → 🔔 toast
              CastError | unknown 500)          ║  ║      Error(msg)       • useFetch    → inline "Error: …" view
             res.status(n).json({ error })      ║  ║
```

User actions travel the *other* way (👤 clicks → api fn → `request` → endpoint);
the diagram shows the **response**, because that's where information and errors
originate and flow outward to the UI.


## Branch 1 — Information (the data pipe)

The happy path, end to end:

1. **MongoDB** holds the documents.
2. **`models/`** — Mongoose schemas define shape + validation. `Theme` is flat
   (`name`, `color`). `Item` is a **base schema** (`title`, `theme` ref) with
   three **discriminators** (`Task` / `Event` / `Reminder`) that add only their
   own fields. All three share the `items` collection; each doc carries
   `itemType` marking which it is. `Item.find()` reads all types at once;
   `Task.find()` reads only Tasks.
3. **`routes/`** — one `express.Router()` per resource. A handler does the
   minimum: read `req`, call a model method, `res.json(...)` the result.
4. **HTTP barrier** — the resource crosses as JSON.
5. **`api/request.js`** — the single client-side entry: `fetch`es, checks
   `res.ok`, returns `res.json()`.
6. **`api/themes.js`, `api/items.js`** — thin, symmetric wrappers naming each
   endpoint (`getThemes`, `createItem`, …). No logic beyond method + path + body.
7. **`hooks/`** — `useFetch` (auto, on mount) and `useMutation` (imperative, on
   user action) wrap *any* async function. They are generic — they know nothing
   about themes or items.
8. **coordinator → components** — the coordinator owns the fetched cache and
   hands slices down; leaf components render and trigger actions.
9. **UI** — the user sees it.


## Branch 2 — Errors (the failure pipe)

Errors never fan out to be handled everywhere. Each side has **one sink**, and
they are mirror images that meet at the barrier:

- **Server sink — `errors.js`.** Any handler that fails (a thrown
  `ApiError(404)`, a Mongoose `ValidationError`/`CastError`, or an unexpected
  crash) is caught by its `try/catch` and passed to **one** function,
  `handleError(res, error)`, which maps it to the right status + `{ error }`
  JSON. Deliberate 4xx use `throw new ApiError(status, message)` so they exit
  through the same `catch` as real crashes — every handler ends identically.
- **The wire** — the failure crosses as `{ error: "..." }` with an HTTP status.
- **Client sink — `request()`.** On `!res.ok` it reads that `{ error }` and
  re-throws it as a JS `Error` carrying the **server's real message**. `fetch`
  does *not* throw on 4xx/5xx, so this is the one place that converts "response
  says failure" into a thrown exception. It **translates**; it does not display.
- **Surfacing** — the thrown Error rides up to whichever hook called the api fn:
  - `useMutation` → `catch` → `notify(message)` → app-wide **toast**
    (transient write failures; the view still has its data).
  - `useFetch` → stores the error → **inline** message (a load failed; there's
    nothing to show).

`handleError` turns an error *into* a response; `request` turns that response
*back into* an error. One translator each side, one display path each kind.


## Backend structure (left of the barrier)

```
server/
  index.js          bootstrap only: middleware, mongoose.connect, mount routers, listen
  errors.js         ApiError class + handleError(res, error)  ← the one server sink
  models/
    Theme.js        export const Theme
    Item.js         export const Item, Task, Event, Reminder  (base + discriminators)
    index.js        barrel
  routes/
    themes.js       export const themesRouter
    items.js        export const itemsRouter
    index.js        barrel
```

ESM throughout (`import`/`export`, `.js` extensions on relative imports),
named exports only, a barrel per folder — identical conventions to the client.

**Endpoints** (both resources share the same CRUD skeleton):

| Method | Path | Purpose | Body / Query |
| --- | --- | --- | --- |
| GET | `/api/themes` | list themes | — |
| POST | `/api/themes` | create theme | body: `{ name, color }` |
| PATCH | `/api/themes/:id` | rename / recolor | body: changed fields |
| DELETE | `/api/themes/:id` | delete theme **+ cascade its items** | — |
| GET | `/api/items` | list items | query: `?theme=`, `?itemType=` (optional, combinable) |
| POST | `/api/items` | create item | body: `{ itemType, theme, title, …type fields }` |
| PATCH | `/api/items/:id` | update item | body: changed fields |
| DELETE | `/api/items/:id` | delete item | — |

**Handler conventions**
- **Every handler sets its status explicitly** — `201` on create, `200` on
  every other success — never leaning on a framework default. Same explicitness
  as passing `method` on every client `fetch`.
- Every write returns the **affected resource** as JSON (never 204/empty) so the
  client cache always has a full object to upsert.
- **Reads vs writes** map to REST's two endpoint kinds: *collection*
  (`/items` — GET list, POST create) and *member* (`/items/:id` — PATCH, DELETE).
  Reading one item by id (`GET /items/:id`) is a valid member endpoint we simply
  haven't needed — the client already holds each item from the list read.
- **Which channel:** `params` = *which* resource (identity), `query` = *refine a
  list* (filter/sort/paginate), `body` = *payload* for create/update.
- **PATCH shape:** `findById` → `.set(req.body)` → `.save()`, used for both
  resources so they read identically. `.set` only touches keys you send, so a
  partial patch never clobbers untouched fields, and `.findById` on the base
  `Item` returns the doc as its real discriminator type, so type-specific fields
  validate correctly.
- **Item creation** routes to the right discriminator by looking up
  `MODELS[req.body.itemType]`; an unknown type is a deliberate `ApiError(400)`.


## Frontend structure (right of the barrier)

```
client/src/
  api/
    request.js      request(path, { method, body })  ← the one client sink/translator
    themes.js       getThemes / createTheme / updateTheme / deleteTheme
    items.js        getItems(filters) / createItem / updateItem / deleteItem
    index.js        barrel
  hooks/            useFetch (auto read) + useMutation (imperative write) — generic
  notifications/    app-wide toast sink (where useMutation errors surface)
  features/<name>/  one coordinator (owns cache + shared callbacks) + private children
  pages/            thin composition of features
  layouts/ routes/  chrome + URL wiring
```

**`request` is the mirror of `handleError`.** Every api function is a one-line
delegation to it, so all of them are naked of error handling by design — add a
ninth api function and it inherits the whole error path for free. `method` is
always passed explicitly (even GET) and a guard throws if it's missing; headers
are always explicit. `body` is `JSON.stringify`ed when present, omitted
(`undefined`) otherwise — a GET may not carry a body.

**api symmetry** (the shape is identical across both resources):

| verb | function | method | path | body |
| --- | --- | --- | --- | --- |
| read many | `getThemes()` / `getItems(filters)` | GET | collection | — |
| create | `createTheme(fields)` / `createItem(fields)` | POST | collection | `fields` |
| update | `updateTheme(id, fields)` / `updateItem(id, fields)` | PATCH | member | `fields` |
| delete | `deleteTheme(id)` / `deleteItem(id)` | DELETE | member | — |

Justified asymmetries: only `getItems` takes filters (themes are always fetched
whole; items are the large, filterable set — mirrors the backend reading
`req.query` only on `/items`). `create`/`update` take a single `fields` object
rather than spelled-out params, so their shape matches and Items can carry
different fields per type without changing a signature.


## Cross-cutting philosophy (the "why")

- **Symmetry over cleverness.** Both resources, both sides of the barrier, and
  all four CRUD verbs share one skeleton. A new thing is a copy of an existing
  shape. Deviations must be *justified* (see the asymmetry notes), never casual.
- **One convergence point per concern.** Errors converge to `handleError`
  (server) and `request` (client). Nothing is handled in N places where it could
  be handled in one — add a route/api-fn and the cross-cutting behavior comes
  for free.
- **Explicit over implicit.** Spell out HTTP methods, statuses only where the
  default is imprecise, and guard the silliness that fails *quietly* (a missing
  method) while trusting the platform to guard what fails *loudly* (a GET body).
- **Named exports + a barrel per folder, on both sides.** Consistent imports,
  and renaming a file never breaks an anonymous default import.
- **Generic stays generic.** `hooks/` and `request` know nothing about themes or
  items; `api/` is the only client code that knows the server contract. Mongoose
  lives *only* on the server — anything in `client/` is standard JS, a Web API,
  or a library, never a DB method.
- **Discriminators for polymorphism.** Items that share ~80% of their shape live
  in one collection so the (future) week view is a single query, with per-type
  fields validated per variant.
- **Every write returns the affected resource**, so the client cache is always a
  set of full objects keyed by `_id` — two operations only, upsert and remove.
```
