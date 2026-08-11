import 'dotenv/config'
import { readFileSync } from 'node:fs'

import { embed } from '../../agent/useBedrock.js'
import { matchTools } from '../../agent/useSupabase.js'
import { emit, newRunId, causeOf } from '../index.js'

/*
  Offline evaluation of the retrieval layer.

    node metrics/eval/run.js

  Calls the embedding model and pgvector directly: no turn, no chat model, no
  Mongo. Cases come from cases.json.

  A case with an empty `expected` names no tool, and its `absent` says why:

    unrelated  a different domain entirely; the threshold should reject it
    adjacent   scheduling vocabulary with no matching capability. Similarity
               cannot separate these from real requests, so retrieving one is
               recorded but is not scored as a miss

  Exits non-zero if any case errored.
*/

// Retrieval at k is a prefix of retrieval at a larger k, so the whole sweep
// costs one embedding and one query per case, the same as fixing k would.
const K_VALUES = (process.env.EVAL_K ?? '1,2,3,5').split(',').map(Number).filter(Number.isFinite).sort((a, b) => a - b)
const MAX_K = Math.max(...K_VALUES)

// Must match findTools.js. Override only to test a different value.
const MIN_SIMILARITY = Number(process.env.EVAL_MIN_SIMILARITY ?? 0.13)

const round = (value, places = 4) => Math.round(value * 10 ** places) / 10 ** places

// (matches, expected, k) -> the scores at one k. precision is capped by
// expected.length / k, so recall and rank are the numbers that move.
const scoreAt = (matches, expected, k) => {
    const top = matches.slice(0, k)
    const names = top.map(match => match.name)
    const correct = names.filter(name => expected.includes(name))

    return {
        k,
        retrieved: names,
        hit: correct.length > 0,
        precision: round(correct.length / k),
        recall: expected.length ? round(correct.length / expected.length) : null,
        aboveThreshold: top.filter(match => match.similarity > MIN_SIMILARITY).length,
    }
}

const cases = JSON.parse(readFileSync(new URL('./cases.json', import.meta.url), 'utf8'))
const runId = newRunId()
const startedAt = Date.now()

emit('eval.start', {
    kind: 'eval',
    runId,
    cases: cases.length,
    k: K_VALUES,
    minSimilarity: MIN_SIMILARITY,
})

let failed = 0

for (const testCase of cases) {
    const started = Date.now()

    try {
        const matches = await matchTools(await embed(testCase.query), MAX_K)
        const expected = testCase.expected ?? []
        const rank = matches.findIndex(match => expected.includes(match.name))

        emit('eval.case', {
            kind: 'eval',
            runId,
            caseId: testCase.id,
            query: testCase.query,
            expected,
            outOfCatalogue: expected.length === 0,
            absent: expected.length ? null : (testCase.absent ?? 'unrelated'),
            ms: Date.now() - started,
            ranked: matches.map(match => match.name),
            similarity: matches.map(match => round(match.similarity)),
            rank: rank === -1 ? null : rank + 1,
            perK: K_VALUES.map(k => scoreAt(matches, expected, k)),
            ok: true,
            error: null,
        })
    } catch (error) {
        failed += 1

        emit('eval.case', {
            kind: 'eval',
            runId,
            caseId: testCase.id,
            query: testCase.query,
            expected: testCase.expected ?? [],
            ms: Date.now() - started,
            ok: false,
            error: causeOf(error),
        })
    }
}

emit('eval.end', {
    kind: 'eval',
    runId,
    cases: cases.length,
    failed,
    ms: Date.now() - startedAt,
})

console.log(`Ran ${cases.length} cases at k = ${K_VALUES.join(', ')}${failed ? `, ${failed} failed` : ''}.`)
console.log(`Run ${runId}. Read it with: npm run metrics`)

process.exit(failed ? 1 : 0)
