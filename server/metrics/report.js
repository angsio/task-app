import 'dotenv/config'
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/*
  Reads the JSONL and prints. The only place that knows what the events mean.

    node metrics/report.js [--days 7] [--kind runtime|eval|all]

  What each number means, and what it cannot mean, is in README.md.
*/

const DIR = process.env.METRICS_DIR ?? join(dirname(fileURLToPath(import.meta.url)), 'data')
const DAY_FILE = /^\d{4}-\d{2}-\d{2}\.jsonl$/

const arg = (name, fallback) => {
    const at = process.argv.indexOf(`--${name}`)

    return at === -1 ? fallback : process.argv[at + 1]
}

const DAYS = Number(arg('days', 7))
const KIND = arg('kind', 'all')

/* ---------- reading ---------- */

// (days) -> Set<string>, the day filenames inside the window
const window = (days) => {
    const wanted = new Set()
    const cursor = new Date()

    for (let back = 0; back < days; back++) {
        wanted.add(cursor.toISOString().slice(0, 10))
        cursor.setUTCDate(cursor.getUTCDate() - 1)
    }

    return wanted
}

// () -> { events, files, malformed }. A half-written last line is expected after
// a hard kill, so a bad line is counted rather than thrown on.
const read = () => {
    const wanted = window(DAYS)
    const events = []
    let files = 0
    let malformed = 0

    let names = []
    try {
        names = readdirSync(DIR)
    } catch (error) {
        // Nothing recorded yet is normal. Anything else is a real problem and
        // must not be dressed up as an empty report.
        if (error.code !== 'ENOENT') throw error

        return { events, files, malformed }
    }

    for (const name of names.filter(name => DAY_FILE.test(name) && wanted.has(name.slice(0, 10))).sort()) {
        files += 1

        for (const raw of readFileSync(join(DIR, name), 'utf8').split('\n')) {
            if (!raw.trim()) continue

            try {
                events.push(JSON.parse(raw))
            } catch {
                malformed += 1
            }
        }
    }

    return { events, files, malformed }
}

/* ---------- arithmetic ---------- */

// (values, p) -> the nearest-rank percentile, so every number printed is a
// request that actually happened.
const pct = (values, p) => {
    if (!values.length) return null

    const sorted = [...values].sort((a, b) => a - b)

    return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]
}

const sum = (values) => values.reduce((total, value) => total + value, 0)
const mean = (values) => (values.length ? sum(values) / values.length : null)
const rate = (part, whole) => (whole ? part / whole : null)
const field = (events, name) => events.map(event => event[name] ?? 0)

// (events, key) -> Map<string, number>
const countBy = (events, key) => {
    const counts = new Map()

    for (const event of events) {
        const value = typeof key === 'function' ? key(event) : event[key]
        if (value === null || value === undefined) continue

        counts.set(value, (counts.get(value) ?? 0) + 1)
    }

    return counts
}

/* ---------- formatting ---------- */

const LABEL = 34

const line = (label, value) => console.log(`  ${String(label).padEnd(LABEL)}${value}`)
const blank = () => console.log('')

const head = (title) => {
    console.log(`\n${title}`)
    console.log('  ' + '-'.repeat(LABEL + 20))
}

const ms = (value) => (value === null || value === undefined ? '-' : `${Math.round(value)} ms`)
const pctText = (value) => (value === null ? '-' : `${(value * 100).toFixed(1)}%`)
const num = (value, places = 0) => (value === null || value === undefined ? '-' : value.toFixed(places))

// Exponent form below six places, so a real embedding total does not print as
// "$0.000000" and read like a broken meter.
const usd = (value) => {
    if (value === null || value === undefined) return 'not priced'
    if (value !== 0 && Math.abs(value) < 1e-6) return `$${value.toExponential(2)}`

    return `$${value.toFixed(6)}`
}

const spread = (label, values, format = ms) => line(label, `p50 ${format(pct(values, 50))}   p95 ${format(pct(values, 95))}`)

// (counts, total) -> void, biggest first
const distribution = (counts, total, limit = 12) => {
    const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)

    if (!rows.length) return line('(none)', '')

    for (const [name, count] of rows) line(name, `${count}   ${pctText(rate(count, total))}`)
}

/* ---------- runtime ---------- */

// (events) -> Map<runId, run>, one run per turn, rebuilt from events written
// independently. Exposes a start with no end.
const group = (events) => {
    const runs = new Map()

    for (const event of events) {
        if (!event.runId) continue

        const run = runs.get(event.runId) ?? { models: [], tools: [], confirmations: [] }

        if (event.event === 'turn.start') run.start = event
        else if (event.event === 'turn.end') run.end = event
        else if (event.event === 'model.call') run.models.push(event)
        else if (event.event === 'tool.call') run.tools.push(event)
        else if (event.event === 'confirmation') run.confirmations.push(event)

        runs.set(event.runId, run)
    }

    return runs
}

const turns = ({ ended, abandoned, total }) => {
    head('TURNS')

    const outcomes = countBy(ended, 'outcome')

    line('turns', total)
    for (const [outcome, count] of [...outcomes.entries()].sort((a, b) => b[1] - a[1])) {
        line(`  ${outcome}`, `${count}   ${pctText(rate(count, total))}`)
    }
    if (abandoned) line('  abandoned (no turn.end)', `${abandoned}   ${pctText(rate(abandoned, total))}`)

    const finished = (outcomes.get('completed') ?? 0) + (outcomes.get('awaiting_confirmation') ?? 0)
    line('completion rate', pctText(rate(finished, total)))
    spread('steps per turn', field(ended, 'steps'), num)
}

const latency = ({ ended, models, tools }) => {
    head('LATENCY BY STAGE')

    spread('turn, end to end', field(ended, 'ms'))
    spread('  model calls, per turn', field(ended, 'modelMs'))
    spread('  tool calls, per turn', field(ended, 'toolMs'))
    spread('  loop overhead, per turn', ended.map(end => end.ms - end.modelMs - end.toolMs))
    spread('single model call', field(models.filter(model => model.ok), 'ms'))

    for (const name of new Set(tools.map(tool => tool.tool))) {
        spread(`single ${name}`, field(tools.filter(tool => tool.tool === name), 'ms'))
    }
}

const cost = ({ ended }) => {
    head('COST AND TOKENS')

    const estimated = ended.filter(end => end.chatTokenSource === 'estimated').length
    const chatPriced = ended.filter(end => end.chatCostUsd !== null && end.chatCostUsd !== undefined)
    const embedPriced = ended.filter(end => end.embedCostUsd !== null && end.embedCostUsd !== undefined)

    line('chat tokens in / out, total', `${sum(field(ended, 'chatTokensIn'))} / ${sum(field(ended, 'chatTokensOut'))}`)
    spread('chat tokens per turn', ended.map(end => (end.chatTokensIn ?? 0) + (end.chatTokensOut ?? 0)), num)
    line('  counted by the provider', `${ended.length - estimated} turns`)
    line('  estimated here', `${estimated} turns   ${pctText(rate(estimated, ended.length))}`)
    line('embedding tokens, total', `${sum(field(ended, 'embedTokens'))}   (estimated)`)

    blank()

    if (!chatPriced.length) line('chat cost', 'not priced - set METRICS_PRICE_IN/OUT_PER_MTOK')
    else {
        spread('chat cost per turn', field(chatPriced, 'chatCostUsd'), usd)
        line('chat cost, window total', `${usd(sum(field(chatPriced, 'chatCostUsd')))} over ${chatPriced.length} turns`)
    }

    if (!embedPriced.length) line('embedding cost', 'not priced - set METRICS_PRICE_EMBED_PER_MTOK')
    else line('embedding cost, window total', `${usd(sum(field(embedPriced, 'embedCostUsd')))}   (estimated)`)

    // Only when both sides are priced: a total that omits one model still looks
    // like an answer.
    if (chatPriced.length && embedPriced.length) {
        line('both models, window total', usd(sum(field(chatPriced, 'chatCostUsd')) + sum(field(embedPriced, 'embedCostUsd'))))
    }
}

const retrieval = ({ runs, ended, tools, gatedTools }) => {
    head('TOOL RETRIEVAL')

    const searches = tools.filter(tool => tool.retrieved !== undefined)
    const found = searches.filter(search => search.retrievedCount > 0)

    line('find_tools calls', searches.length)
    line('searches returning a match', `${found.length}   ${pctText(rate(found.length, searches.length))}`)
    line('matches per search, mean', num(mean(field(searches, 'retrievedCount')), 2))
    line('searches per turn, mean', num(mean(ended.map(end => (end.tools ?? []).filter(tool => tool === 'find_tools').length)), 2))

    // What retrieval offered against what the model did with it. A gated tool is
    // retrieved in one turn and run in the next, under a different runId, so
    // within one turn it always looks retrieved and unused.
    const offered = []
    const unused = []
    for (const run of runs) {
        const gave = new Set(run.tools.flatMap(tool => tool.retrieved ?? []).filter(name => !gatedTools.has(name)))
        if (!gave.size) continue

        const used = new Set(run.tools.map(tool => tool.tool))
        offered.push(gave.size)
        unused.push([...gave].filter(name => !used.has(name)).length)
    }
    line('retrieved but never called', `${sum(unused)} of ${sum(offered)} ungated   ${pctText(rate(sum(unused), sum(offered)))}`)
}

const toolCalls = ({ tools }) => {
    head('TOOL CALL DISTRIBUTION')

    distribution(countBy(tools, 'tool'), tools.length)

    const failed = tools.filter(tool => !tool.ok)
    blank()
    line('tool calls failing', `${failed.length}   ${pctText(rate(failed.length, tools.length))}`)
}

const confirmations = ({ confirmations: events }) => {
    head('CONFIRMATIONS')

    const phase = (name) => events.filter(event => event.phase === name).length
    const [issued, approved, declined] = [phase('issued'), phase('approved'), phase('declined')]

    line('issued', issued)
    line('approved', approved)
    line('declined', declined)
    line('approval rate', pctText(rate(approved, approved + declined)))
    line('issued, never answered', `${Math.max(0, issued - approved - declined)}   (window edges inflate this)`)
}

// Tool paths in call order: what the turn did, never what the user asked for.
const intents = ({ ended }) => {
    head('TOP INTENTS')

    distribution(countBy(ended, 'path'), ended.length)
}

const failures = ({ ended, models, tools, total }) => {
    head('FAILURES BY CAUSE')

    const where = (event) => (
        event.event === 'turn.end' ? 'turn'
            : event.event === 'model.call' ? 'model'
                : `tool:${event.tool}`
    )

    const causes = countBy([...ended, ...models, ...tools].filter(event => event.error), event => `${where(event)} / ${event.error}`)

    distribution(causes, total)
}

// A floor, not a groundedness score. See README.md before quoting it.
const grounding = ({ ended }) => {
    head('UNSUPPORTED TIME REFERENCES')

    const checked = ended.filter(end => end.timesSeen !== null && end.timesSeen !== undefined)
    const seen = sum(field(checked, 'timesSeen'))
    const bad = sum(field(checked, 'timesUnsupported'))

    line('turns with a final answer checked', checked.length)
    line('clock times stated', seen)
    line('not found in any tool reply', `${bad}   ${pctText(rate(bad, seen))}`)
}

const RUNTIME_SECTIONS = [turns, latency, cost, retrieval, toolCalls, confirmations, intents, failures, grounding]

const runtimeReport = (events) => {
    const runs = [...group(events.filter(event => event.kind === 'runtime')).values()]
    const ended = runs.map(run => run.end).filter(Boolean)
    const abandoned = runs.filter(run => run.start && !run.end).length

    if (!runs.length) return console.log('\nNo runtime telemetry in this window.')

    const tools = events.filter(event => event.event === 'tool.call')

    const data = {
        runs,
        ended,
        abandoned,
        total: ended.length + abandoned,
        models: events.filter(event => event.event === 'model.call'),
        tools,
        confirmations: events.filter(event => event.event === 'confirmation'),
        gatedTools: new Set([
            ...tools.filter(tool => tool.gated).map(tool => tool.tool),
            ...events.filter(event => event.event === 'confirmation').flatMap(event => event.tools ?? []),
        ]),
    }

    for (const section of RUNTIME_SECTIONS) section(data)
}

/* ---------- eval ---------- */

// Must match MAX_MATCHES in agent/tools/findTools.js: the number of tools a
// real search returns, so accuracy is reported where it actually matters.
const PRODUCTION_K = 3

// (cases, ks) -> void, the k sweep. precision@k is capped at |expected| / k, so
// with one right answer per case it cannot exceed 1/k; recall and MRR move.
const sweep = (cases, ks) => {
    blank()
    console.log(`  ${'k'.padEnd(6)}${'hit rate'.padEnd(12)}${'recall@k'.padEnd(12)}${'precision@k'.padEnd(14)}above threshold`)

    for (const k of ks) {
        const at = cases.map(event => event.perK.find(score => score.k === k)).filter(Boolean)
        if (!at.length) continue

        const hits = at.filter(score => score.hit).length

        console.log(
            `  ${String(k).padEnd(6)}`
            + `${pctText(rate(hits, at.length)).padEnd(12)}`
            + `${num(mean(at.map(score => score.recall)), 3).padEnd(12)}`
            + `${num(mean(at.map(score => score.precision)), 3).padEnd(14)}`
            + num(mean(field(at, 'aboveThreshold')), 2)
        )
    }
}

/*
  (cases, k) -> void, accuracy for each tool at the k production uses.

  Grouped by the tool that is correct, so a description that reads like another
  tool's shows up as one bad row instead of being averaged away.
*/
const perTool = (cases, k) => {
    const tools = new Set(cases.flatMap(event => event.expected))

    blank()
    console.log(`  ${'tool'.padEnd(18)}${'cases'.padEnd(8)}${'top 1'.padEnd(10)}${`top ${k}`.padEnd(10)}worst rank`)

    for (const tool of [...tools].sort()) {
        const mine = cases.filter(event => event.expected.includes(tool))
        const rankOf = (event) => event.ranked.indexOf(tool) + 1
        const ranks = mine.map(rankOf)
        const within = (limit) => ranks.filter(rank => rank > 0 && rank <= limit).length

        console.log(
            `  ${tool.padEnd(18)}${String(mine.length).padEnd(8)}`
            + `${pctText(rate(within(1), mine.length)).padEnd(10)}`
            + `${pctText(rate(within(k), mine.length)).padEnd(10)}`
            + (ranks.some(rank => rank === 0) ? 'not found' : Math.max(...ranks))
        )
    }
}

// (cases, k) -> void, every case whose tool was outside the top k, and what
// came back instead.
const misses = (cases, k) => {
    const missed = cases.filter(event => event.perK.find(score => score.k === k && !score.hit))
    if (!missed.length) return

    blank()
    line(`missed at k=${k}`, `${missed.length} of ${cases.length}`)

    for (const event of missed) {
        console.log(`    ${event.caseId}`)
        console.log(`      query     ${event.query}`)
        console.log(`      wanted    ${event.expected.join(', ')}`)
        console.log(`      got       ${event.ranked.slice(0, k).map((name, at) => `${name} ${num(event.similarity[at], 3)}`).join('   ')}`)
    }
}

/*
  (cases, threshold) -> void, the requests no tool serves, split by kind.

  unrelated  a different domain; the threshold is the right instrument and this
             is a pass/fail rate
  adjacent   scheduling words, no capability. Similarity cannot separate these
             from real requests, so they are shown and deliberately not scored:
             a rate here would report a design limit as a defect
*/
const rejections = (cases, threshold) => {
    if (!cases.length) return

    const cleared = (event) => (event.similarity?.[0] ?? 0) > threshold
    const byScore = (list) => [...list].sort((a, b) => (b.similarity?.[0] ?? 0) - (a.similarity?.[0] ?? 0))
    const show = (event) => line(`  ${event.caseId}`, `${num(event.similarity?.[0], 4)}   ${cleared(event) ? 'retrieved' : 'rejected'}`)

    const unrelated = cases.filter(event => event.absent !== 'adjacent')
    const adjacent = cases.filter(event => event.absent === 'adjacent')

    if (unrelated.length) {
        const rejected = unrelated.filter(event => !cleared(event)).length

        blank()
        line('unrelated requests', `${rejected} of ${unrelated.length} rejected   ${pctText(rate(rejected, unrelated.length))}`)
        byScore(unrelated).forEach(show)
    }

    if (adjacent.length) {
        blank()
        line('adjacent requests', `${adjacent.length}, not scored`)
        byScore(adjacent).forEach(show)
    }
}

const evalReport = (events) => {
    const cases = events.filter(event => event.event === 'eval.case')
    if (!cases.length) return console.log('\nNo eval runs in this window. Run: npm run eval')

    // Newest run only: mixing two catalogues in one average hides a change.
    const latest = events.filter(event => event.event === 'eval.start').sort((a, b) => a.ts.localeCompare(b.ts)).at(-1)
    const run = cases.filter(event => event.runId === latest?.runId)
    const ok = run.filter(event => event.ok)
    const scored = ok.filter(event => !event.outOfCatalogue)

    head('RETRIEVAL EVAL')

    line('run', latest?.runId ?? '-')
    line('at', latest?.ts ?? '-')
    line('cases', `${run.length}${run.length - ok.length ? `, ${run.length - ok.length} errored` : ''}`)
    line('similarity threshold', latest?.minSimilarity ?? '-')
    spread('retrieval latency', field(ok, 'ms'))

    blank()
    line('in-catalogue cases', scored.length)
    line('MRR', num(mean(scored.map(event => (event.rank ? 1 / event.rank : 0))), 3))
    line('never retrieved at any k', `${scored.filter(event => event.rank === null).length} of ${scored.length}`)

    sweep(scored, latest?.k ?? [])
    perTool(scored, PRODUCTION_K)
    misses(scored, PRODUCTION_K)
    rejections(ok.filter(event => event.outOfCatalogue), latest?.minSimilarity ?? 0)
}

/* ---------- main ---------- */

const { events, files, malformed } = read()

console.log(`\nmetrics  ${DIR}`)
console.log(`window   last ${DAYS} day(s), ${files} file(s), ${events.length} events${malformed ? `, ${malformed} unreadable lines` : ''}`)

if (!events.length) {
    console.log('\nNothing recorded yet.')
} else {
    if (KIND !== 'eval') runtimeReport(events)
    if (KIND !== 'runtime') evalReport(events.filter(event => event.kind === 'eval'))
}

blank()
