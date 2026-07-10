# task-app — App Info & Product Shape

Parallel to `pattern.md` (which documents *how the code is wired*), this file
documents *what the app is and how a user experiences it*. Kept intentionally
small — a foundation to iterate on, not a finished spec. When the two views
below disagree with reality, this file is the intent and the code is behind.


## What it is

A personal organizer. A user captures **Items** and organizes them two ways:
by **Theme** (what an item belongs to) and by **time** (when it happens this
week). Same items, two views, two pages.


## Core entities (source of truth: `server/models/`)

- **Theme** — a named, colored bucket (Work, Personal, School…).
  `{ name, color }`.
- **Item** — one thing that belongs to exactly one Theme. Three kinds share a
  `title` + `theme`, differing only in their *time shape* (this is the Mongoose
  discriminator split — one collection, one `itemType` key):
  - **Task** — something to do. `{ completed, deadline? }`
  - **Event** — something occupying a fixed span. `{ timeStart, timeEnd }`
  - **Reminder** — a nudge at a moment. `{ reminderTime? }`

An Item's `itemType` is the one value that drives every per-type decision on
both sides of the app: which fields it has (server), which form creates it and
which card renders it (client). Add a fourth kind by adding it in exactly those
places — never by branching case-by-case elsewhere.


## The two views

### View 1 — Board  *(build first)*

Items grouped by Theme — each Theme is a container holding its Items.

- See every Theme and the Items under it.
- Create / rename / recolor / delete a Theme (deleting cascades its Items,
  per the server).
- Within a Theme: create an Item (its type chosen at creation, showing that
  type's fields), rename it, mark a Task complete, delete it.

### View 2 — Schedule

The same Items laid on a week grid — Google-Calendar-inspired.

- 7 columns (the 7 days of the current week), a vertical 24-hour axis, hours
  running top → bottom.
- Items that carry a time appear at their slot (Events by their span; timed
  Tasks/Reminders at their moment).
- Bottom-left: the list of Themes as toggles — turning one off hides its Items
  on the grid, turning it on shows them (a per-Theme visibility filter, like
  Google Calendar's calendar list).
- Dates are locked to *this* week for now.


## Foundation scope (deliberately deferred)

Named here so it's a decision, not an oversight:

- No auth / multi-user — a single implicit user.
- The Schedule is always the current week; no week navigation or arbitrary
  date ranges yet.
- No drag-to-reschedule, no recurrence, no delivered notifications.
- Each view fetches Themes + Items on its own when it mounts. A single shared
  in-memory cache spanning both views is a later optimization the code is
  shaped to allow, not a foundation requirement.
