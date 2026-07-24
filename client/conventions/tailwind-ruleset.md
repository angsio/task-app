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
  (`h-1/5` + `h-4/5`; `h-1/10` + `h-8/10` + `h-1/10`). This makes the proportion
  explicit and is the house style — keep it.
- Anything meant to **grow** instead of holding a fixed share uses `flex-1` with a
  `min-h-0` floor, never a fixed `h-*` that caps it (matches `conventions.txt`
  §14).


## 7. STATIC CLASS vs DYNAMIC `style`

Tailwind reads your source as **text at build time** and only emits CSS for
complete class literals it can see. So:

- A value from a **fixed, known set** → a class, via a literal map
  (`{ x: 'grid-flow-row', y: 'grid-flow-col' }[flow]`). Never build
  `` `grid-cols-${n}` `` — Tailwind never sees it.
- An **open / computed** value (a count, a `%`, a colour from data) → inline
  `style={{ … }}`. This is why `List` takes `slots`/`autoSize` through `style`
  and why `ColorPicker` sets `backgroundColor` through `style`.


## 8. RESPONSIVE PREFIXES GO WITH THE ZONE THEY MODIFY

A `md:`/`sm:` variant lives wherever the utility it modifies would live:

- responsive **PLACE** (`md:flex`, `md:hidden`, `md:flex-row`) → inline, in its
  zone.
- responsive **PAINT** (`sm:text-5xl`) → in the `styles` object, next to the base
  it overrides.


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
const styles = { header: 'bg-slate-50' }

<div className={`h-full w-full flex flex-row items-center justify-between p-4 ${styles.header}`}>
  ...
  <div className="flex flex-row gap-4"> ... </div>
</div>
```

Nothing about the render changed; the string is now a fixed-shape PLACE sentence
plus one PAINT token, and the aesthetic pass edits only `styles`.
