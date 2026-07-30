# TAILWIND CLASSNAME RULESET — task-app client

Companion to `conventions.txt`. That file governs how the code is *wired*; this
one governs how a single `className` string is *written*, so that a div with ten
utilities on it reads at a glance and you always know what leaks down to its
children.

It is a synthesis of two working styles:

- **task-app's own style** — every utility inline, always in the *same order*, no
  aesthetic noise, whole containers partitioned into fractions that sum to 1.
  Readable because it is predictable.
- **the hub's style** — the visual utilities (colour, border, type, hover) pulled
  out of the JSX into a named `styles` object at the top of the file, so the
  inline string stays short and structural.

The rule below keeps task-app's ordered-inline structure AND adopts the hub's
partition, so that when the aesthetic pass arrives it has exactly one place to
land and the inline strings never blow past what a human can scan.


## 0. THE ONE QUESTION: does this class PLACE the box, or PAINT it?

Every utility answers one of two questions. Decide which, and its home follows.

- **PLACE** — *where is the box, how big, how are its children arranged?*
  Size, position, display, flex/grid, alignment, padding, gap, overflow.
  → written **inline** in the JSX, in the canonical order of §2.
- **PAINT** — *what does the box look like?*
  Background, border, rounding, shadow, typography, opacity, transitions, and
  every `hover:`/`focus:`/`disabled:` state.
  → pulled into a **`styles` object** (§3), named by role, appended **last**.

Rule of thumb that matches the CSS underneath: PLACE utilities touch the box
model / flexbox / grid / position — properties that arrange boxes and do **not**
inherit. PAINT utilities are colour, type, and effects — visual, and many of
them **do** inherit (§4). Learning the split is also learning the cascade.


## 1. WHY THE SPLIT EARNS ITS KEEP

The two failure modes this prevents, both stated by the human working here:

1. *"I can't read 10+ utilities in one div."* — After the split, an inline
   string is **only** PLACE, always in the same order, so it is a fixed-shape
   sentence you skim, not a soup you parse. All the visual detail collapses to a
   single named token (`styles.card`).
2. *"I can't tell which classes transfer to children."* — The split lines up with
   the cascade: PAINT is where the inheriting properties live, so §4 is a short,
   closed list you consult, not a per-class guess.


## 2. PLACE: INLINE, ALWAYS THIS ORDER

Left to right, drop any zone you don't use. The `${styles.x}` PAINT bundle is
always appended at the very end.

1. **Position** — `relative absolute fixed sticky`, then insets `top-0 right-0
   inset-0`, then `z-*`
2. **Size** — `h-*` then `w-*` (then `min-h-* max-w-*` …)
3. **Display** — `flex grid block hidden`
4. **Direction / flow** — `flex-row flex-col`, `grid-flow-*`, `flex-wrap`
5. **Alignment of children** — `items-*` then `justify-*` (then `self-*`,
   `flex-1`)
6. **Spacing** — padding `p-*` then `gap-*` (never margin — §5)
7. **Overflow** — `overflow-*`
8. **`${styles.role}`** — the whole PAINT bundle, one token, last.

```
className={`relative h-full w-full flex flex-col items-center justify-between p-4 gap-2 overflow-y-auto ${styles.card}`}
```

If a box has no PAINT at all (a pure structural wrapper), it has no `styles`
entry and the string is just the PLACE zones. That is fine and common.


## 3. PAINT: A `styles` OBJECT, NAMED BY ROLE

At the top of the file, above the component (this is the hub pattern):

```js
const styles = {
  column:    'bg-slate-300',
  card:      'bg-white border border-black rounded',
  title:     'text-lg font-bold',
  deleteBtn: 'bg-red-500 hover:bg-red-600',
}
```

- One entry **per painted box**, holding **all** of that box's PAINT.
- Name by the box's **role** (`card`, `title`, `deleteBtn`), never by its look
  (`redBox`, `bold`). When the aesthetic pass recolours everything, the role
  names still describe the code; the look names would lie.
- For a component with variants, use the hub's shape: a `skin` object with a
  `base` key plus one key per variant, and a shared `layout` const for the PLACE
  bundle they all share (see hub `Button.jsx`). Compose
  `` `${layout} ${skin.base} ${skin[variant]} ${className}` ``.
- Caller overrides come **after** everything, so a parent can always win.


## 4. WHAT TRANSFERS TO CHILDREN (the cheat-sheet)

Set an **inherited** property once on the highest box that owns a text region;
every descendant picks it up. Repeating it on each child is noise — delete it.
A **non-inherited** property affects only the box it is on and must be restated
where you actually want it.

**INHERITS (set once high up, children get it for free):**

- `text-{colour}` — colour
- `text-{size}` — font-size (**and** line-height)
- `font-{family}`, `font-{weight}`, `italic` / `not-italic`
- `leading-*` (line-height), `tracking-*` (letter-spacing)
- `text-left / -center / -right / -justify` — text-align
- `uppercase / lowercase / capitalize`
- `whitespace-*`, `list-*`, `cursor-*`, `indent-*`, `invisible / visible`

**DOES NOT INHERIT (restate on each box that needs it):**

- **`bg-*`** — surprises people: background does **not** flow down. Each box that
  needs a fill states its own.
- `w/h`, `p/m`, `border*`, `rounded-*`, `shadow-*`, `opacity-*`
- `flex / grid`, `flex-row/-col`, `items-* justify-* gap-*`
- `relative/absolute/…`, insets, `z-*`, `overflow-*`
- `transition-* duration-* ease-*`, transforms, `outline-*`

**The #1 confusion — flex/grid alignment is the PARENT's, not inherited:**
`items-*`, `justify-*`, and `gap-*` live on the flex/grid parent and position its
**direct children only**. A child claims its own share with `flex-1`, `w-full`,
or `self-*`. A *grand*child is untouched unless **its** own parent is also a
flex/grid container. So to centre something, put the flex classes on the box
**directly around it**, not on some ancestor.

**Making a child react to a parent's hover:** `hover:` does not inherit either.
Put `group` on the parent and `group-hover:*` on the child (hub `SectionCard`).


## 5. NO MARGINS — GAP BETWEEN, PADDING WITHIN

- Space **between** siblings → the **parent** owns it with `gap-*` (so the parent
  must be `flex`/`grid`). Space **inside** a box → `p-*`.
- **No `m-*`.** A margin is a child reaching out to push on its siblings and
  parent; it leaks across the component boundary and collapses unpredictably in
  flow. Gap and padding keep every spacing decision owned by the box that draws
  the space.
- If a genuine one-off truly needs a margin, it is a documented exception with a
  comment saying why — never a silent `ml-2`.


## 6. SIZING: FILL, OR PARTITION INTO FRACTIONS

- A box that should fill its parent gets `h-full w-full` — task-app's most-used
  pair; reach for it first.
- To split a container, give the pieces fractions that **sum to the whole**
  (`h-1/5` + `h-4/5`). This makes the proportion explicit and is the house style
  — keep it, but only where §6a says it is safe.
- Anything meant to **grow** instead of holding a fixed share uses `flex-1` with a
  `min-h-0` floor, never a fixed `h-*` that caps it (matches `conventions.txt`
  §14).


## 6a. NEVER GIVE CHROME A FRACTION OF THE VIEWPORT

A height fraction is only safe when the container's height is **bounded by
something other than the viewport**. An item card is fine: its height comes from
the list's `autoSize`, so `h-1/5` + `h-4/5` always divides a sane box.

A CHROME ROW is not fine. A theme column's header and its create-row used to be
`h-1/10` each. Ten percent of a laptop is a comfortable 90px; ten percent of a
phone is ~58px, and after the row's own `p-2` + `p-4` that leaves about 10px of
usable space — the header collapsed. Worse, **breakpoints cannot fix it**, because
Tailwind breakpoints are WIDTH-based and this is a HEIGHT problem: a phone in
landscape is wide and short, so it would take the desktop branch and break anyway.

The rule: a row whose contents are fixed-size controls (a title line, icon
buttons, a select) gets its **natural height** plus `shrink-0`, and the growing
region beside it takes `flex-1 min-h-0`. Its height is then set by its padding and
its content at every screen size, which is what you actually meant. Fractions are
for dividing a box you already bounded, never for sizing chrome.


## 7. STATIC CLASS vs DYNAMIC `style`

Tailwind reads your source as **text at build time** and only emits CSS for
complete class literals it can see. So:

- A value from a **fixed, known set** → a class, via a literal map
  (`{ x: 'grid-flow-row', y: 'grid-flow-col' }[flow]`). Never build
  `` `grid-cols-${n}` `` — Tailwind never sees it.
- An **open / computed** value (a count, a `%`, a colour from data) → inline
  `style={{ … }}`. This is why `ColorPicker` sets `backgroundColor` through
  `style`.


## 7a. WHAT THE RESPONSIVE PASS BROKE: `style` HAS NO BREAKPOINTS

An inline `style` is one flat declaration — **it cannot hold a media query.** So
the moment an open value must differ per screen size, rule 7 dead-ends: it can't
be a class (Tailwind can't see it) and it can't be responsive in `style`.
`List`'s `slots`/`autoSize` hit this exactly; they drive the app's whole layout
density and were structurally unable to respond to anything.

The way out is to **split the value from the breakpoint**. The open value still
goes through `style`, but as a CSS CUSTOM PROPERTY, and a real CSS rule does the
media queries. `List` sets `--list-slots{,-md,-lg}` and `--list-size{,-md,-lg}`,
and wears `list-tracks-x` / `list-tracks-y` — two `@utility` rules in index.css
that read them. Callers stay declarative:

```jsx
slots={{ base: 1, md: 2, lg: 4 }}   // or slots={4} for every size
```

**THE TRAP — CUSTOM PROPERTIES INHERIT.** This shipped broken once; do not
reinvent it. If a nested `List` sets only `--list-slots` and the CSS falls back
`var(--list-slots-lg, var(--list-slots))`, the nested list does NOT get its own
base value — it INHERITS `--list-slots-lg` from the enclosing `List` and silently
adopts the parent's layout. Concretely: item cards inside a theme column laid out
4-across because they inherited the board's `--list-slots-lg: 4`, and every hour
row grew to a quarter of the day column because it inherited the timetable's
`--list-size-lg: calc(100% / 4)`.

The fix, and the rule: **resolve the cascade in JS, not in CSS.** `toTrackVars`
carries the last named breakpoint forward and always emits EVERY tier, so each
`List` overwrites all the vars it reads and inherits nothing. Each `@media` block
then reads only its own var, with no fallback chain. Any future var-driven
utility must do the same — emit every tier, always.

Two more rules that keep this honest:
- the media queries use `theme(--breakpoint-md)` / `theme(--breakpoint-lg)`, never
  hardcoded rem, so they resolve to exactly the widths the `md:`/`lg:` variants
  use. Hardcoding gives two ladders that drift apart.
- the ladder is defined in those two utilities only. Callers pass counts and
  sizes, never widths, so no call site can invent a breakpoint.

Reach for this ONLY when an open value genuinely must be responsive. A fixed
known set is still a class; a non-responsive open value is still plain `style`.


## 8. RESPONSIVE PREFIXES GO WITH THE ZONE THEY MODIFY

A `md:`/`lg:` variant lives wherever the utility it modifies would live:

- responsive **PLACE** (`md:px-10`, `lg:flex-row`, `lg:w-1/4`) → inline, in its
  zone, immediately after the base it overrides.
- responsive **PAINT** (`lg:border-l`) → in the `styles` object, next to the base
  it overrides.

**The ladder — exactly two breakpoints, mobile-first.** Base styles are the PHONE.
`md:` (48rem) is tablet, `lg:` (64rem) is desktop. Do not introduce `sm:`/`xl:`
without adding them here and to the `list-tracks-*` utilities together — a
breakpoint that exists in one place and not the other is how the two ladders drift.

What each tier changes:

| | phone (base) | `md:` tablet | `lg:` desktop |
|---|---|---|---|
| board columns | 1 | 2 | 4 |
| cards per column | 2 | 3 | 4 |
| timetable days | 1 | 2 | 4 |
| theme rows | 3 | 4 | 5 |
| schedule panes | stacked | stacked | side by side |

Only the schedule reorients (`flex-col lg:flex-row`); everything else responds by
DENSITY through `List`, not by rearranging. Prefer that — changing how many things
fit is one prop, while rearranging is a new layout to maintain per breakpoint.

Write base first, then override upward. Never write a `max-*:` variant to undo a
desktop default; that inverts mobile-first and means two rules fight for every
screen.


## 9. WORKED EXAMPLE

Before (everything inline, order drifting, a stray margin):

```jsx
<div className="h-full w-full flex flex-row items-center justify-between p-4 bg-slate-50">
  ...
  <div className="flex flex-row ml-4 gap-4"> ... </div>
</div>
```

After (PLACE inline in canonical order, PAINT named, margin → gap on the parent
that already distributes with `justify-between`):

```jsx
const styles = { header: 'bg-crypt border border-border rounded-md' }

<div className={`h-full w-full flex items-center justify-between p-4 ${styles.header}`}>
  ...
  <div className="flex gap-4"> ... </div>
</div>
```

Nothing about the render changed; the string is now a fixed-shape PLACE sentence
plus one PAINT token, and the aesthetic pass edits only `styles`.

Note `flex-row` is gone from both lines — see §10.


## 10. DON'T WRITE A CLASS THAT RESTATES A DEFAULT

`flex` already means `flex-direction: row`. So `flex flex-row` says the same thing
twice, and the second half is noise in every string it appears in — 15 of them
here, now deleted. Write `flex` for a row and `flex flex-col` for a column.

`flex-row` earns its place in exactly one situation: **undoing a `flex-col` at a
breakpoint** (`flex flex-col lg:flex-row`). There the word carries information.

Same test elsewhere: an inline `style={{ height }}` beats any `h-*` class on the
same box, so `h-full` sitting next to it is dead text pretending to be a rule —
delete it. Before adding a utility, ask whether the box already behaves that way.


## 11. SCROLL CONTAINERS: ONLY THE OUTERMOST BLOCKS CHAINING

`overscroll-none` is `overscroll-behavior: none`, which stops a scroll gesture from
**chaining to the parent** once this box hits its limit. On a nested list that is a
trap: drag over a short item list on a phone and nothing moves at all, because the
inner list has nothing to scroll and refuses to hand the gesture up.

The rule: page bounce / pull-to-refresh is already killed once, globally, on
`html, body` in index.css. So only the **outermost** scroller on a screen (the
board grid, the timetable) carries `overscroll-none`. Every nested scroller — item
lists, the theme rows, the agent transcript — leaves it off so gestures chain
outward and the whole surface is draggable.

For a scroller whose children are full-bleed panes, add snapping so it can never
rest halfway between two of them: `snap-y snap-mandatory` (or `snap-x`) on the
container and `snap-start` on each item. The board and the timetable both do this —
on a phone, where one theme or one day fills the screen, it is the difference
between a pane and a smear.


## 11a. SNAP ONLY WHERE THE PANES ARE FULL-BLEED

One `snap-mandatory` for every screen is wrong, because a finger and a wheel fail
in opposite directions:

- a **finger** flings. Mandatory alone still lets one gesture fly past several
  panes, so it feels *under*-snapped.
- a **wheel** emits discrete clicks. Mandatory animates a full pane per click and
  swallows clicks until that animation ends, so it feels *over*-snapped — one pane
  at a time with a cooldown you have to wait out.

Scope snapping by **WIDTH**, on the same `md:`/`lg:` ladder as everything else —
not by pointer type. Snapping earns its keep exactly when a pane is FULL-BLEED, and
that is a width fact the ladder already describes:

- the timetable shows 1 day below `md`, then 2 and 4. So it snaps on phones and
  turns snapping off entirely above: `snap-x snap-mandatory md:snap-none`. Once
  several days are visible the user is scanning *across* them, and any snapping is
  just a cooldown in the way.
- the board's panes are read one at a time at every width, so it keeps
  `snap-y snap-mandatory` throughout, and only relaxes `scroll-snap-stop`:
  `snap-start snap-always md:snap-normal`.

Ask per scroller whether the user *steps through* panes (snap) or *scans across*
them (don't).

**Do not reach for `pointer-coarse:` / `pointer-fine:` here.** It was tried and
removed. Primary-pointer queries are ambiguous on hybrid devices, they are
invisible in the layout so nobody can see which branch is live, and they are not
faithfully reproduced by devtools device emulation — so the behaviour is
untestable by the person editing it. A width variant is testable by dragging the
window, which is worth more than the extra precision.

**Firefox does not implement `scroll-snap-stop` at all** (bug 1312165), so
`snap-always` is a silent no-op there and a fling can still skip panes; Chromium
and Safari honour it. Keep the class — it is correct and free for the browsers that
have it — but do not try to "fix" the skip in Firefox by writing a JS scroll
handler. Hijacking wheel and touch to fight native momentum costs far more than
the imperfection. Verify snap work in Chromium; a devtools phone view in Firefox
tells you nothing about touch snapping.


## 12. TAILWIND SCANS YOUR DOCS TOO

Tailwind v4 auto-detects source files, and `conventions/` sits inside the Vite
root — so **every class named in these two files was being compiled into the
production bundle.** That shipped `bg-slate-50` and `bg-slate-300` from a palette
documented as deleted, `bg-red-500` from an example, `sm:text-5xl`, and `ml-2` —
a class §5 explicitly forbids. Prose about CSS became CSS.

`src/index.css` therefore carries `@source not "../conventions";`. Keep it. If you
add another folder of docs, examples, or fixtures under the Vite root, exclude it
the same way, and check a built `dist/assets/*.css` for a class you only ever
*wrote about* to confirm.

(Your editor may underline `@utility`, `@source`, and `@theme` as unknown at-rules.
That is VS Code's built-in CSS validator not knowing Tailwind v4; the compiler
accepts them. Silence it with `"css.lint.unknownAtRules": "ignore"` — do not
"fix" the CSS to satisfy it.)
