# Simulation scenes for algorithm clips

An algorithm clip shows the code running step by step. `array` (one row of cells) is built into
`public/codelens.html`. Every other kind of figure is a module in this folder: one file per kind.

| File | Layout | For |
|---|---|---|
| `matrix.js` | `matrix` | 2D grids: islands, flood fill, BFS on a grid, DP tables, boards |
| `tree.js` | `tree` | binary trees, BSTs, tries, heaps, recursion trees |
| `list.js` | `list` | linked lists |
| `graph.js` | `graph` | node-and-edge graphs: BFS/DFS, topological sort, shortest path, union-find |
| `intervals.js` | `intervals` | intervals on a number line: merge, insert, meeting rooms |

The page stays one self-contained file. After editing a module, copy the modules into it:

```bash
node tools/build-scenes.cjs
```

Check and preview a module without building (writes one image per step):

```bash
node tools/sim-preview.cjs scenes/matrix.js --out /tmp/matrix-preview
```

## What the page does for every kind

- Keeps `steps` (at most 12). Each step has `say` (its narration, read aloud when the step appears),
  `vars` (up to 4 name/value pairs) and an optional `box`: a stack, queue, heap, map or set drawn as a strip
  of items under the figure. A module never handles `say`, `vars` or `box`.
- Draws the heading, the step counter, the box and the variables. The module draws only the figure.
- Times the steps to the voice, writes subtitles, and tells the AI which kind fits which problem.

## Module interface

A module is a plain script that registers one definition:

```js
(window.__codelensSimDefs = window.__codelensSimDefs || []).push(["matrix", {
  label: "…",      // Vietnamese name in the editor's layout list
  when: "…",       // Vietnamese, one line: which problems use this kind (the AI picks the kind from this)
  prompt: "…",     // Vietnamese, under 1500 chars: the exact fields the AI must write, with one compact example
  review: "…",     // Vietnamese, 1–2 sentences: what the AI reviewer must verify in this kind of scene
  dataHint: "…",   // Vietnamese hint with a JSON example of the scene data (shown in the editor)
  stepHint: "…",   // Vietnamese hint with a JSON example of one step's state (shown in the editor)
  fields: ["rows"],                   // names of the scene-level data fields this kind owns
  norm(sc, h) { return { rows }; },   // scene data from raw input; must never throw
  normStep(st, data, h) { return { at, hi, dim }; },  // one step's state from raw input; must never throw
  draw(c, sc, f, h) { },              // draw the figure for one moment
  samples: [ { heading, subtitle, narration, rows, steps: [...] }, … ],   // at least 2 real problems
}]);
```

`fields` may not use a name the scene already has: `layout`, `duration`, `heading`, `subtitle`, `narration`,
`part`, `actors`, `links`, `focus`, `mark`, `left`, `right`, `code`, `codeTitle`, `steps`, `cells`.

### `norm` and `normStep`

- Accept what an AI is likely to write: a string where an array is expected, 1 or 2 spellings of a field,
  numbers as strings. Clamp sizes. Drop what is invalid. Return plain JSON.
- Stable: normalising the output again returns the same thing.
- A step is a complete snapshot of what is marked at that moment (like `hi` and `dim` in `array`). Nothing
  carries over from earlier steps unless the module's prompt says so in plain words.

### `draw(c, sc, f, h)`

- `c` is a 1080×1920 canvas context. Draw only inside `f.area` (`{x, y, w, h}`): the page owns everything
  else. The area is taller when the scene has no box and no variables; scale the figure to fill it.
- `f.st` is the current step, `f.pr` the previous one (the same step for the first), `f.k` the step index,
  `f.steps` all steps, `f.tl` seconds since the scene started.
- `f.u` goes from 0 to 1 over the first 0.4 s of a step. Use it to move from `f.pr` to `f.st`: slide a
  cursor, fade a highlight in. At `u = 1` the picture must show exactly the state of `f.st`.
- The page wraps the call in `save()`/`restore()` and catches exceptions; still, do not throw.

### Helpers `h`

`COL` (palette: `bg, blue, orange, teal, violet, red, green, yellow, cyan, white, muted, disk, ink`),
`FONT`, `MONO`, `W`, `H`, `clamp(v, lo, hi)`, `easeOut(t)`, `easeInOut(t)`, `lerp(a, b, u)`,
`str(v, maxLen)`, `int(v, lo, hi, fallback)`, `ptrCols()` (colours for named pointers, in order).

### Visual language (same as `array`)

- A cell or node: fill `COL.disk`, stroke `rgba(77,184,255,0.45)` 3px, value in `MONO` bold, `COL.white`.
- Being looked at now: fill `COL.orange`, text `COL.ink`. Visited or ruled out: alpha about 0.32.
- A group or window: outline `COL.blue` 5px with fill `rgba(77,184,255,0.16)`. Accepted or final: `COL.green`.
  Rejected: `COL.red`.
- Named pointers: a small triangle and the name in `ptrCols()` colours, 800 weight, about 38px.
- No text under 24px. Values 30px or more where they fit. The clip is watched on a phone.
