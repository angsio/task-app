# STYLING — task-app client

How a single `className` is **written**. For how the code is wired, see
`architecture.md`.

Two failure modes this prevents, both real complaints from the human working here:
*"I can't read 10+ utilities in one div"* and *"I can't tell which classes
transfer to children."*

1. [PLACE vs PAINT](#1-place-vs-paint) · 2. [Inline order](#2-inline-order) ·
3. [The styles object](#3-the-styles-object) ·
4. [What inherits](#4-what-inherits) · 5. [Spacing & colour roles](#5-spacing--colour-roles) ·
6. [Sizing](#6-sizing) · 7. [Class vs style](#7-class-vs-style) ·
8. [Responsive](#8-responsive) · 9. [Scrolling](#9-scrolling) ·
10. [Housekeeping](#10-housekeeping)

---

## 1. PLACE vs PAINT

**The one question: does this class PLACE the box, or PAINT it?**

| | asks | holds | lives |
|---|---|---|---|
| **PLACE** | where is the box, how big, how are its children arranged? | size, position, display, flex/grid, alignment, padding, gap, overflow | **inline**, in the order of §2 |
| **PAINT** | what does it look like? | background, border, rounding, shadow, typography, opacity, transitions, every `hover:`/`focus:`/`disabled:` | a **`styles` object**, appended last |

This matches the CSS underneath: PLACE utilities touch the box model and do
**not** inherit; PAINT is colour, type and effects, and many of them **do** (§4).
Learning the split is learning the cascade.

The payoff: an inline string is a fixed-shape sentence you skim, and all visual
detail collapses to one token (`styles.card`).

### Who owns which class

Each layer owns one axis, so the same class never gets set from two places:

| layer | owns | never |
|---|---|---|
| `layouts/` | viewport occupancy and chrome positioning — `h-dvh`, `fixed` | reaches inside the `Outlet` |
| `pages/` | spacing *between* sibling features | touches viewport height/scroll, or a feature's internals |
| `features/` | everything about their own content — columns, card sizing, internal spacing | assumes a container size; no `h-dvh`, no `fixed` |

A feature sizes relative to its parent (`w-full`). `sticky` is allowed inside one
(it pins to whatever ancestor scrolls); `fixed` is not, because it assumes the
viewport, which is a layout concern.

**The test:** would this className still make sense if I swapped what's on the
other side of the boundary?

---

## 2. Inline order

Left to right, dropping any zone you don't use. `${styles.x}` is always last.

1. **Position** — `relative absolute sticky`, then insets, then `z-*`
2. **Size** — `h-*` then `w-*`, then `min-h-* max-w-*`
3. **Display** — `flex grid block hidden`
4. **Direction** — `flex-col`, `grid-flow-*`, `flex-wrap`
5. **Alignment of children** — `items-*`, `justify-*`, then `self-*`, `flex-1`, `shrink-0`
6. **Spacing** — `p-*` then `gap-*` (never margin — §5)
7. **Overflow & scroll** — `overflow-*`, `snap-*`
8. **`${styles.role}`** — the whole PAINT bundle, one token

```jsx
className={`relative h-full w-full flex flex-col items-center p-4 gap-2 overflow-y-auto ${styles.card}`}
```

A pure structural wrapper has no `styles` entry at all. That is fine and common.

---

## 3. The `styles` object

At the top of the file, above the component:

```js
const styles = {
  header:    'bg-crypt border border-border rounded-md',
  title:     'font-display text-parchment',
  deleteBtn: 'text-parchment-dim transition-colors hover:text-danger',
}
```

- One entry **per painted box**, holding **all** of that box's PAINT.
- Name by the box's **role** (`card`, `deleteBtn`), never its look (`redBox`,
  `bold`). Recolour everything and role names still describe the code.
- For variants, use a `skin` object with a `base` key plus one key per variant,
  and a shared `layout` const for the PLACE bundle they share.
- **Caller overrides come last**, so a parent can always win.

---

## 4. What inherits

Set an inherited property once on the highest box owning a text region; repeating
it on children is noise. A non-inherited property must be restated wherever you
want it.

**Inherits:** `text-{colour}`, `text-{size}` (and its line-height), `font-*`,
`italic`, `leading-*`, `tracking-*`, `text-left/center/right`, `uppercase`,
`whitespace-*`, `list-*`, `cursor-*`.

**Does not inherit:** **`bg-*`** (surprises people — each box states its own),
`w/h`, `p/m`, `border*`, `rounded-*`, `shadow-*`, `opacity-*`, `flex`/`grid`,
`items-*`/`justify-*`/`gap-*`, position and insets, `z-*`, `overflow-*`,
transitions, transforms.

> **The #1 confusion:** flex/grid alignment belongs to the **parent** and
> positions its **direct children only**. A grandchild is untouched unless its own
> parent is also a flex/grid container. To centre something, put the flex classes
> on the box *directly around it*. A child claims its share with `flex-1`,
> `w-full` or `self-*`.

To make a child react to a parent's hover, put `group` on the parent and
`group-hover:*` on the child — `hover:` doesn't inherit either.

---

## 5. Spacing & colour roles

Tailwind's scale is already consistent; the mess comes from picking a fresh
number per edit. **Pick a role, reuse its number.**

| role | value |
|---|---|
| tight internal grouping — padding in a card, gaps within one unit, small fixed controls (`h-4 w-4`) | **4** |
| section / page-level separation — a feature against its container edge | **10** |

Ask "tight grouping or section separation?" before writing a new spacing class.
If something genuinely fits neither, **name a third role here** rather than
inventing a silent one-off.

**No margins.** Space *between* siblings is the parent's job (`gap-*`); space
*inside* a box is `p-*`. A margin is a child reaching out to push on its
siblings — it leaks across the component boundary and collapses unpredictably. A
genuine one-off needs a comment saying why.

### Colour

Same discipline: reuse a token for a role, never pick a new one per component.
Tokens live in `index.css @theme`, shared with the hub so the two sites read as
one domain.

| role | token |
|---|---|
| the page ground, and any input **well** sunk into a surface | `void` |
| chrome and side panels — navbar, agent panel, a board column | `obsidian` |
| the things you act on — cards, header rows, popovers | `crypt` |
| every hairline (halve it, `/40` `/70`, to recede rather than divide) | `border` |
| primary content — a title, a value | `parchment` |
| labels, secondary lines, a resting icon button | `parchment-dim` |
| tertiary and **off** states — idle toggle, hint, completed title | `ash` |
| the live mark — active nav star, focused field, completed task | `accent` |
| the hover partner for any accent or dim element | `accent-bright` |
| Reminder identity; a theme's visible toggle | `accent-violet` |
| Event identity; a task's deadline toggle | `accent-teal` |
| destructive only — delete, read-load errors | `danger` |

**On/off pairs state both halves, and differ by more than colour where it
matters:** a completed task swaps its glyph *and* strikes its title, because a
colour-only change is invisible at a glance across a full board.

A live-create draft reuses its real element's surface, so the half-made thing
looks like what it is becoming.

> `--color-elevated` is defined but referenced nowhere. Give it a role or delete
> it; don't leave a fourth surface nothing explains.

---

## 6. Sizing

- A box filling its parent gets `h-full w-full` — the most-used pair, reach for
  it first.
- To split a container, give the pieces fractions that **sum to the whole**
  (`h-1/5` + `h-4/5`). Explicit proportion is the house style.
- Anything meant to **grow** uses `flex-1` with a `min-h-0` floor, never a fixed
  `h-*` that caps it.

**Never give chrome a fraction of the viewport.** A height fraction is only safe
when the container is bounded by something *other* than the viewport — an item
card is fine, because its height comes from the list's `visible` count.

A chrome row is not. A theme column's header was `h-1/10`: comfortable on a
laptop, ~10px of usable space on a phone once its padding was subtracted. **And
breakpoints can't fix it** — they are width-based and this is a height problem, so
a phone in landscape takes the desktop branch and breaks anyway.

So: a row of fixed-size controls (a title line, icon buttons, a select) gets its
**natural height plus `shrink-0`**, and the growing region beside it takes
`flex-1 min-h-0`. Fractions divide a box you already bounded; they don't size
chrome.

---

## 7. Class vs `style`

Tailwind reads your source as **text at build time** and only emits CSS for
complete class literals it can see.

- A value from a **fixed, known set** → a class via a literal map
  (`{ x: 'grid-flow-row', y: 'grid-flow-col' }[flow]`). Never build
  `` `grid-cols-${n}` `` — Tailwind never sees it.
- An **open / computed** value (a count, a colour from data) → inline `style`.

**When an open value must also be responsive**, both routes dead-end: it can't be
a class, and an inline `style` cannot hold a media query. `List`'s
`across`/`visible` are the only such case.

**Read the breakpoint in JS and keep the style plain.** `useBreakpoint()` returns
`'base' | 'md' | 'lg'`; the component picks the count and writes one obvious line:

```jsx
const lanes = countAt(across, useBreakpoint())
style={{ gridTemplateColumns: `repeat(${lanes}, minmax(0, 1fr))` }}
```

> This replaced a CSS-custom-property scheme where `List` wrote
> `--list-across{,-md,-lg}` for `@utility` blocks to re-read inside media
> queries. It worked, but cost 30 lines of `index.css` to explain one prop and
> shipped a real bug: **custom properties inherit**, so a nested `List` that left
> a breakpoint unset silently adopted its parent's layout. Resolving in JS makes
> that impossible — a component can only read its own props.

The honest cost: `useBreakpoint` hardcodes `48rem`/`64rem`, because Tailwind keeps
breakpoints compile-time and emits them to no CSS variable, even when declared in
`@theme`. If the theme overrides `md`/`lg`, that file must follow.

Reach for this **only** when an open value must be responsive. Anything CSS can
express stays a `md:`/`lg:` utility — those cost no JS and no re-render.

---

## 8. Responsive

Mobile-first, **exactly two breakpoints**. Base styles are the phone.

| | phone (base) | `md:` 48rem | `lg:` 64rem |
|---|---|---|---|
| board columns | 1 | 2 | 4 |
| cards per column | 2 | 3 | 4 |
| timetable days | 1 | 2 | 4 |
| theme rows | 3 | 4 | 5 |
| schedule panes | stacked | stacked | side by side |

A variant lives wherever the utility it modifies would live: responsive PLACE
(`md:px-10`, `lg:w-1/4`) inline in its zone, responsive PAINT (`lg:border-l`) in
the `styles` object, each immediately after the base it overrides.

**Prefer responding by DENSITY, not by rearranging.** Only the schedule reorients
(`flex-col lg:flex-row`); everything else changes how many things fit, which is
one prop on `List`. Rearranging is a second layout to maintain.

Write base first and override upward. **Never write a `max-*:` variant to undo a
desktop default** — that inverts mobile-first and leaves two rules fighting.

Adding a third breakpoint means adding it to `useBreakpoint` and to this table
together.

---

## 9. Scrolling

**Only the outermost scroller blocks chaining.** `overscroll-none` stops a gesture
from passing to the parent once a box hits its limit. On a nested list that is a
trap: drag over a short item list on a phone and *nothing moves*, because the
inner list has nothing to scroll and refuses to hand the gesture up.

Page bounce is already killed once, globally, on `html, body`. So only the
outermost scroller on a screen (the board grid, the timetable) carries
`overscroll-none`; every nested scroller leaves it off.

### Snapping

A scroller whose children are full-bleed panes should snap, or the user can park
halfway between two. But **a finger and a wheel fail in opposite directions**:

- a **finger** flings, and can fly past several panes — it feels *under*-snapped;
- a **wheel** emits discrete clicks, and mandatory snapping animates a full pane
  per click while swallowing the rest — it feels *over*-snapped, one pane at a
  time with a cooldown.

**Scope snapping by width, on the same ladder as everything else** — snapping
earns its keep exactly when a pane is full-bleed, which is a width fact:

- the timetable shows one day below `md`, so it snaps there and turns snapping
  **off** above: `snap-x snap-mandatory md:snap-none`. Once several days are
  visible you are scanning *across* them and any snapping is a cooldown in the way.
- the board's panes are read one at a time at every width, so it keeps
  `snap-y snap-mandatory` throughout and only relaxes the stop:
  `snap-start snap-always md:snap-normal`.

Ask per scroller whether the user *steps through* panes (snap) or *scans across*
them (don't).

**If the scroller has padding, give it a matching `scroll-p*`.** The snapport is
the container's *padding box*, so `snap-start` aligns an item flush with the
scrollport edge and scrolls the container's own padding out of view — you can drag
to it, but it never snaps there. The board pairs `p-2` with `scroll-pt-2`; both
compile to the same `calc(var(--spacing) * 2)`, so they can't drift.

> **Don't reach for `pointer-coarse:`/`pointer-fine:`.** Tried and removed:
> primary-pointer queries are ambiguous on hybrid devices, invisible in the
> layout, and not faithfully reproduced by devtools emulation — so the behaviour
> is untestable by the person editing it. A width variant is testable by dragging
> the window.
>
> **Firefox does not implement `scroll-snap-stop`** (bug 1312165), so `snap-always`
> is a silent no-op there and a fling can still skip panes; Chromium and Safari
> honour it. Keep the class, but verify snapping in Chromium — and don't "fix"
> Firefox with a JS scroll handler, which costs far more than the imperfection.

---

## 10. Housekeeping

**Don't write a class that restates a default.** `flex` already means
`flex-direction: row`, so `flex flex-row` says it twice — 15 of those were
deleted. Write `flex` for a row, `flex flex-col` for a column. `flex-row` earns
its place only when undoing a `flex-col` at a breakpoint
(`flex flex-col lg:flex-row`).

Same test elsewhere: an inline `style={{ height }}` beats any `h-*` on the same
box, so an `h-full` beside it is dead text pretending to be a rule.

**Tailwind scans your docs too.** `conventions/` sits inside the Vite root, so
every class *named in these files* was being compiled into the production bundle —
including a palette documented as deleted and an `ml-2` that §5 forbids. Prose
about CSS became CSS. Hence `@source not "../conventions";` in `index.css`. If you
add another folder of docs or fixtures under the root, exclude it the same way and
check a built `dist/assets/*.css` for a class you only ever *wrote about*.

**Keep `index.css` lean.** It holds the `@theme` tokens, base element styles, and
one documented exception: the `.datetime-field` rules, because a native
`datetime-local`'s focused segment is a browser pseudo-element no utility can
reach. Anything else that lands there deserves suspicion.

> Your editor may underline `@theme`/`@source` as unknown at-rules. That is VS
> Code's built-in CSS validator not knowing Tailwind v4; the compiler accepts
> them. Silence it with `"css.lint.unknownAtRules": "ignore"` rather than
> "fixing" the CSS.
