# Agent Metrics

Two things live here, and they are kept apart on purpose.

**Runtime telemetry** is passive and continuous. The live agent emits it as turns
happen, and it records what actually occurred: how long each stage took, what a
turn cost, which tools were retrieved and which were called, whether the turn
finished, whether a confirmation was issued and whether the user said yes.

**Offline evaluation** is a batch job you run on demand. It calls the embedding
model and pgvector directly, with no chat model and no agent loop, and asks one
question of each test case: given a plain description of a capability, does the
search return the right tool — and where no right tool exists, does it return
nothing.

They share an event envelope so one report reads both. They share no plumbing.
The eval cannot write a runtime event and the loop cannot start an eval. Merging
them is how this kind of subsystem turns into something nobody trusts: a
retrieval accuracy number that quietly includes production traffic where nobody
knows the right answer is not an accuracy number.

```bash
npm run eval        # score the retrieval layer
npm run metrics     # print the report
```

---

## The seams

Five event types. Nine calls in `agent/runAgent.js`, most of them at choke points
the loop already had.

| Event | Emitted where | Once per |
|---|---|---|
| `turn.start` | top of `runAgent` | turn |
| `model.call` | `callModel`, around `chat()` | model round trip |
| `tool.call` | `runToolCall` | tool execution |
| `confirmation` | `toResponse` (issued) and the resume branch (answered) | confirmation, twice, in two requests |
| `turn.end` | `toResponse` and the catch | turn |

`runToolCall` was already the only path any tool runs through — gated, ungated,
first attempt or ledger replay. `toResponse` was already the only non-throwing
exit. Instrumenting those two covers every tool call and every successful turn
with one call each, which is the difference between a seam and a sprinkle.

The set is minimal in the sense that removing any one loses something no other
event can reconstruct. Drop `turn.start` and a turn that dies with the process
leaves nothing, so crashes become invisible instead of counted. Drop
`model.call` and there is no cost. Drop `tool.call` and you cannot tell what
retrieval offered from what the model used. Collapse the two confirmation phases
and approval rate is gone, because they arrive in different HTTP requests. Drop
`turn.end` and there is no completion rate.

There is deliberately **no seam inside `find_tools`** splitting embedding latency
from pgvector latency. That is the first step down the road this design exists to
avoid. The split is measured in the eval harness instead, where you can time both
without touching the request path.

---

## The event schema

Getting this wrong is expensive once there is data, so it is versioned: every
line carries `v`. A field may be added at the same `v`; changing what a field
means bumps it, and the report branches on it.

### Envelope, on every line

| Field | Notes |
|---|---|
| `v` | schema version, currently `1` |
| `ts` | ISO 8601 UTC |
| `kind` | `runtime` or `eval`. The field that lets one report serve both without inferring it from event names |
| `event` | `turn.start`, `model.call`, `tool.call`, `confirmation`, `turn.end`, `eval.start`, `eval.case`, `eval.end` |
| `runId` | groups everything from one turn, or one eval sweep |
| `ownerHash` | salted SHA-256 of the account id, first 12 hex. Null on eval |
| `env` | `NODE_ENV` |
 
### `turn.start`

`messages` (transcript length received), `resuming` (true when answering a
confirmation), `timeZone`.

### `model.call`

`step`, `ms`, `toolsOffered`, `toolCalls`, `finish` (`tools` or `text`), `ok`,
`error`, `tokensIn`, `tokensOut`, `tokenSource`, `costUsd`, `model`.

### `tool.call`

`step`, `tool`, `ms`, `ok`, `error`, `gated`, `replyBytes`. For `find_tools`
only: `retrieved` (names), `retrievedCount`, and `embedTokens` — the estimated
size of the string that was sent to the embedding model, which is the second
billed call in a turn. `step` is `-1` for a tool that ran while answering a
confirmation, because it belongs to the previous turn's step, not this one's.

### `confirmation`

`phase` (`issued`, `approved`, `declined`), `tools`, `count`.

### `turn.end`

`outcome` (`completed`, `awaiting_confirmation`, `step_limit`, `error`), `ms`,
`steps`, `modelMs`, `toolMs`, `tools` (in call order), `path` (those joined —
the intent signature), `error`, `timesSeen`, `timesUnsupported`, plus the two
billed models kept apart: `chatTokensIn`, `chatTokensOut`, `chatTokenSource`,
`chatCostUsd`, `embedTokens`, `embedCostUsd`.

The chat fields are named explicitly here, while `model.call` just says
`tokensIn` / `tokensOut` / `costUsd`. A `model.call` event is a chat call by
definition, so there is nothing to disambiguate. `turn.end` is the line anyone
reads to add up a turn, and there it matters that the two models are labelled.

### `eval.case`

`caseId`, `query`, `expected`, `outOfCatalogue`, `ms`, `ranked`, `similarity`,
`rank`, and `perK`: one `{ k, retrieved, hit, precision, recall, aboveThreshold }`
per k in the sweep.

---

## Two models are billed, and not the same way

|  | Input tokens | Output tokens |
|---|---|---|
| **Chat** (`CHAT_URL`) | the whole transcript sent | the reply generated |
| **Embedding** (`EMBED_URL`) | the `need` string sent | **none, ever** |

An embedding model does not generate text. It takes tokens in and returns a
fixed-size float vector, and a vector is not tokens — so there is no output
meter to read and no output rate on the pricing page. Titan Text Embeddings and
Cohere Embed on Bedrock are both billed per million input tokens and nothing
else. That is why there are three rates below and not four.

Both are counted. A turn's chat spend comes from `model.call` events; its
embedding spend comes from the `embedTokens` on each `find_tools` call, since
every retrieval embeds a string and that call is billed. They are reported on
separate lines and only added together when both are priced, because a total
that silently omits one model is worse than no total — it still looks like an
answer.

The embedding figure is the rougher of the two: the token count is estimated
from the string rather than read back from the provider. Threading the real
count out would mean adding a field to every tool's outcome contract for an
amount worth a fraction of a cent, which is not a trade worth making. If that
changes, Titan returns `inputTextTokenCount` in the same response the vector
comes from.

## Where the chat token counts come from

The chat gateway answers in the OpenAI chat-completions shape, so `usage`
arrives as `prompt_tokens` / `completion_tokens`. `measure.js` reads that first,
then Bedrock's `inputTokens` / `outputTokens`, then Anthropic's
`input_tokens` / `output_tokens`, so swapping the gateway does not silently zero
the cost column.

**When the provider sends no usage at all**, the counts are estimated at four
characters per token from the serialised request and reply, and the event is
stamped `tokenSource: "estimated"`. Every number derived from it stays labelled:
the report prints how many turns were counted by the provider and how many were
estimated here, on separate lines, and never averages them into one figure. An
estimate is a planning number, not a measurement, and the moment those two get
mixed the whole table stops being quotable.

Cost is tokens times a rate from `measure.js`, which ships with **no numbers in
it**. Set the three rates below, or fill in the `PRICES` table if more than one
chat model is in play. Until then the cost is `null` and the report says `not
priced` rather than printing a zero that reads like a measurement.

---

## Groundedness, and what this does not measure

The general question — did the answer only reference data a tool returned — is
not cheaply checkable. The model paraphrases, so string matching produces false
negatives on genuinely grounded answers and false positives on invented ones at
roughly the same rate. Doing it properly needs a judge model, which is a second
model call on the request path, and that was out of scope.

One narrow slice is checkable, and it is checked. The system prompt forces a
fixed shape for times — `8:00 PM EDT` — and every time the model is permitted to
say came from a tool in the same turn. So `measure.js` pulls `h:mm AM/PM` out of
the final answer and checks each against the tool replies, reporting
`timesSeen` and `timesUnsupported`. Regex and a substring check, microseconds,
no second model.

**Read it as a floor.** A flagged time is probably ungrounded. An unflagged turn
is not thereby grounded:

- an invented item title, day, or theme is invisible to it
- a time written `5 PM` with no minutes is not counted at all
- it only compares against tool output, so a correct time the model rephrased
  into a different format counts as unsupported

It is worth having because it catches the specific failure the system prompt is
written to prevent, and because it is honest about its own range. It is not a
groundedness score and should not be called one anywhere outside this file.

The check reads the response text in memory and writes only two integers. No
content reaches disk.

---

## Reading the report

`npm run metrics` prints nine sections. The ones worth explaining:

**Turns.** Completion rate is `completed` plus `awaiting_confirmation` over all
turns — a turn that correctly stopped to ask permission finished its job.
`abandoned` means a `turn.start` with no `turn.end`, which is a turn the process
did not survive.

**Latency by stage.** Turn total, then the split into model time, tool time and
loop overhead. Overhead is the subtraction, which is why there is no seam for it.
Percentiles are nearest-rank, so every number printed is a request that actually
happened rather than an interpolation between two that did.

**Tool retrieval.** `retrieved but never called` is the cost of a wrong match:
retrieval offered a tool and the model did not use it. Rising means retrieval is
getting worse or the catalogue has grown past what the current `k` handles.

**Top intents.** Tool paths in call order — `find_tools > list_items >
find_tools > create_items`. It is a proxy: what the turn did, not what the user
asked. The real intent text is user content and is not logged. This is the
honest version, and it is the version that survives someone asking what the
logging retains.

**Failures by cause.** Cause codes, not messages, keyed by where they happened.
Messages are excluded on purpose — a mongoose validation message repeats the
value that failed, which is user data.

`upstream_502` and `net_ECONNREFUSED` are different failures and are kept apart.
The first means the gateway answered and refused; the second means the request
never arrived, which on a Pi behind a tunnel is the more likely of the two and
wants a different response. `causeOf` walks the error's cause chain to find the
errno, because by the time it arrives it is wrapped twice — once by `fetch` and
once by `useBedrock`.

**Retrieval eval.** One row per k. `precision@k` is capped at `|expected| / k`,
so with one right answer per case it cannot beat `1/k` and the shape of that
column is arithmetic, not a result. Recall, hit rate and MRR are what move.

Below the sweep, accuracy per tool at the k production returns, then every case
whose tool fell outside it with the query, the tool wanted and what came back
instead. That block is where the eval earns its keep: an averaged hit rate says
retrieval works, the per-tool table says which description reads like another
tool's. The two views disagree on cases expecting two tools — the sweep counts a
hit if either is retrieved, the per-tool table counts each separately — so a
tool can show below the overall rate without any case having failed outright.

Last is the block for queries no tool serves, split in two because one half is
a threshold's job and the other is not:

- **unrelated** — a different domain entirely. A similarity threshold should
  reject these, so they are scored pass/fail.
- **adjacent** — scheduling vocabulary for a capability that does not exist,
  such as exporting a schedule or sharing a calendar. These outscore most
  correct matches, so no threshold separates them without discarding valid
  requests. They are shown and deliberately not scored: a rate here would
  report a property of embedding similarity as a defect. The chat model
  declines them instead.

Rejection cases are a small part of the set and are meant to be. Without a few
of them a retriever that returns its three nearest tools for any input at all
scores full marks, because every case would have a right answer to find.

---

## Files

```
metrics/
  emit.js       the sink: envelope, run ids, cause codes. The only writer
  measure.js    tokens, cost, grounding. Computes, writes nothing
  index.js      what the agent loop imports
  report.js     npm run metrics
  eval/
    cases.json  the test set
    run.js      npm run eval
  data/         JSONL, one file per day, gitignored
```

## Errors at the model boundary

Every way a call to a hosted model can fail ends as `ApiError(502)`, so the
browser gets one story and `errors.js` needs no rule of its own. Before this, a
refused connection surfaced as a 500 "Something went wrong" from a bare
`TypeError`, and a 200 carrying an HTML error page surfaced as a 500 from a
`SyntaxError` — so a dead tunnel, a rate-limited gateway and an actual bug were
indistinguishable.

They stay distinguishable in the metrics because the reason rides on the error:
an errno on `cause`, or the gateway's own status on `upstreamStatus`.

| What happened | Message | Cause code |
|---|---|---|
| Never arrived | `... is unreachable.` | `net_ECONNREFUSED`, `net_ENOTFOUND` |
| Gateway refused | `... is unreachable.` | `upstream_429`, `upstream_503` |
| Body unusable | `... returned an unusable response.` | `upstream_malformed` |

`causeOf` walks the cause chain to find the errno, because by the time it
arrives it has been wrapped twice — once by `fetch`, once by `useBedrock`.

## Design notes

**A turn that fails halfway is recorded, not discarded.** Failure reasons are
one of the things this exists to answer, and discarding partial turns deletes
exactly the data most needed. It would also mean buffering a whole turn in memory
until it completed, which contradicts writing fire-and-forget. Events are
independent appends: a turn that throws gets a `turn.end` with
`outcome: "error"` and a cause, and one that dies with the process gets no
`turn.end` and is counted `abandoned`. The error is rethrown untouched, so
`errors.js` still chooses the status code.

**Test cases are JSON.** YAML would need a parser dependency for a few dozen
one-line queries. Defining them in JavaScript invites logic in a fixture, which
then needs testing itself, and makes the diff of a changed case noisier than it
should be. JSON is data, parses everywhere without a parser choice, and the one
thing it lacks — comments — is covered by a `note` field on each case.

A case is one query plus the tools that answer it:

```json
{ "id": "update-move", "query": "move a meeting to a different time",
  "expected": ["update_items"] }
```

An empty `expected` names no tool, and `absent` says which kind it is —
`unrelated` or `adjacent`. Adding a tool means adding cases for it and
re-running `agent/seedTools.js`; a tool the index has never seen cannot be
retrieved, and a tool with no cases is not being measured.

**The eval sweeps k rather than fixing it.** Retrieval at `k=1` is a prefix of
retrieval at `k=5`, so the whole sweep costs one embedding and one query per
case: exactly what measuring a single k costs. Given that, fixing `k=3` measures
one point on the curve that the entire design claim is about. The sweep is also
what would justify the constant in `findTools.js` if the catalogue ever grows
enough for the choice to matter.

**Nothing here can take down a request.** `emit` never throws, never awaits and
never blocks: it hands a line to a Node write stream and returns. A failing disk
disables the sink for the life of the process and logs once. `grounding` returns
nulls rather than throwing. `METRICS_ENABLED=0` turns the whole thing off without
touching the loop.

---

## Configuration

```
METRICS_ENABLED         0 turns everything off. Default on
METRICS_DIR             where the JSONL goes. Default metrics/data
METRICS_RETAIN_DAYS     whole days kept. Default 30
METRICS_SALT            salt for the account hash. See below
METRICS_LOG_CONTENT     1 logs tool arguments. Default off, see below
METRICS_PRICE_IN_PER_MTOK    chat model, USD per million input tokens
METRICS_PRICE_OUT_PER_MTOK   chat model, USD per million output tokens
METRICS_PRICE_EMBED_PER_MTOK embedding model, USD per million input tokens.
                             There is no output rate: see the table above
EVAL_K                  the k sweep. Default 1,2,3,5
EVAL_MIN_SIMILARITY     threshold reported against. Default 0.13, matching
                        MIN_SIMILARITY in agent/tools/findTools.js. Override to
                        try a candidate value without editing the agent
```

**Set `METRICS_SALT`.** Account ids are short and enumerable, so an unsalted
hash is reversible by anyone holding the id list. Changing it later re-anonymises
everyone, which breaks per-account joins across the change.

**`METRICS_LOG_CONTENT` is the only switch that puts anything the user or the
model wrote on disk.** Off by default. On, it adds each tool call's raw
arguments, which for `create_items` is item titles and for `find_tools` is the
capability sentence the model wrote. Useful for a day of debugging retrieval;
not something to leave on.

---

## Storage

Append-only JSONL, one file per UTC day, in `metrics/data`. The filename is the
rotation — nothing ever rewrites a file — and the first write of a new day
deletes days older than the retention window. Not committed.

No database. At one Pi's request volume a day of events is small enough that the
report reads the whole window into an array, and when that stops being true the
fix is to stream the same pass line by line rather than to introduce storage.
That is a real ceiling, not a claim that JSONL scales.

## Known limitations

- A hard kill can lose the last few lines still in the stream's buffer.
- Approval rate is computed over a time window, so a confirmation issued just
  before the window opened, or answered just after it closed, is counted on one
  side only. The report flags this on the `issued, never answered` line.
- `MIN_SIMILARITY` lives in `findTools.js` and is restated in `eval/run.js`;
  `MAX_MATCHES` is restated in `report.js` as `PRODUCTION_K`. Three files, each
  carrying a comment naming the others. Importing them would remove the drift,
  at the cost of the eval reaching into the agent's tools.
- The queries are mine, not observed. They reflect a guess at how someone asks
  for a capability, so the accuracy figures describe retrieval against that
  guess. Runtime telemetry records the tool path of every real turn, and
  replacing these with phrasings taken from it is the obvious next version.
- The same four verbs exist for items and for themes, so the close neighbours
  are real ones and a query naming neither noun clearly is where the ranking
  gets decided. `update-refile` is currently the only case that misses at k=3,
  and it misses that way: "file an existing item under a different theme"
  returns all three theme tools ahead of `update_items`.
- Nothing here measures the chat model's judgement. The eval stops at which
  tools were offered; whether the model then picked the right one, or declined
  an adjacent request instead of pretending to serve it, is only visible in the
  runtime tool paths.
