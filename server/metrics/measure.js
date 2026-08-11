/*
  Turns provider responses and finished turns into numbers. Writes nothing.

  Two models are billed and they are not billed alike: the chat model has an
  input and an output side, the embedding model has an input side only, because
  what it returns is a vector rather than tokens. Hence three rates, not four.
  Rates ship empty; an unpriced model costs null, never zero.

    METRICS_PRICE_IN_PER_MTOK      chat, input
    METRICS_PRICE_OUT_PER_MTOK     chat, output
    METRICS_PRICE_EMBED_PER_MTOK   embeddings, input
*/

const PRICES = {
    // 'anthropic.claude-3-5-haiku-20241022-v1:0': { in: 0.80, out: 4.00 },
}

const rateFrom = (name) => {
    const value = Number(process.env[name])

    return Number.isFinite(value) ? value : null
}

const CHAT_IN = rateFrom('METRICS_PRICE_IN_PER_MTOK')
const CHAT_OUT = rateFrom('METRICS_PRICE_OUT_PER_MTOK')
const EMBED_RATE = rateFrom('METRICS_PRICE_EMBED_PER_MTOK')

const ENV_PRICE = CHAT_IN !== null && CHAT_OUT !== null ? { in: CHAT_IN, out: CHAT_OUT } : null

const CHARS_PER_TOKEN = 4

const round = (value, places) => Math.round(value * 10 ** places) / 10 ** places

/* ---------- tokens and cost ---------- */

// OpenAI-compatible, Bedrock native, Anthropic native.
const USAGE_SHAPES = [
    (usage) => [usage.prompt_tokens, usage.completion_tokens],
    (usage) => [usage.inputTokens, usage.outputTokens],
    (usage) => [usage.input_tokens, usage.output_tokens],
]

// (usage) -> [in, out] | null, the first shape whose fields are both numbers.
const reportedTokens = (usage) => {
    if (!usage || typeof usage !== 'object') return null

    for (const shape of USAGE_SHAPES) {
        const [tokensIn, tokensOut] = shape(usage)
        if (typeof tokensIn === 'number' && typeof tokensOut === 'number') return [tokensIn, tokensOut]
    }

    return null
}

const charsOf = (value) => {
    try {
        return JSON.stringify(value ?? '').length
    } catch {
        return 0
    }
}

// (text) -> number, a token estimate for a plain string.
export const estimateTokens = (text) => Math.round((text?.length ?? 0) / CHARS_PER_TOKEN)

// (model) -> { in, out } | null, US dollars per million chat tokens.
export const priceFor = (model) => ENV_PRICE ?? PRICES[model] ?? null

// (tokensIn, tokensOut, model) -> number | null, the cost of one chat call.
export const chatCostOf = (tokensIn, tokensOut, model) => {
    const price = priceFor(model)
    if (!price || tokensIn === null || tokensOut === null) return null

    return round((tokensIn * price.in + tokensOut * price.out) / 1_000_000, 6)
}

/*
  (tokens) -> number | null, the cost of a turn's embedding calls.

  Nine places rather than six: embedding rates sit two orders of magnitude below
  chat rates, so at six a turn rounds to zero and a window of those sums to zero.
*/
export const embedCostOf = (tokens) => {
    if (EMBED_RATE === null || tokens === null || tokens === undefined) return null

    return round((tokens * EMBED_RATE) / 1_000_000, 9)
}

/*
  One chat round trip as numbers a report can add up.

  In:  usage     the provider's usage object, or undefined
       messages  message[], the transcript that was sent
       message   the assistant reply that came back
       model     string | null, the model id the provider named

  Out: { tokensIn, tokensOut, tokenSource, costUsd, model }
       tokenSource is 'reported' when the provider counted, 'estimated' when
       this did. Nothing downstream may present the two as the same thing.
*/
export const modelMetrics = (usage, messages, message, model = null) => {
    const reported = reportedTokens(usage)

    const [tokensIn, tokensOut] = reported ?? [
        Math.round(charsOf(messages) / CHARS_PER_TOKEN),
        Math.round(charsOf(message?.content ?? '') / CHARS_PER_TOKEN)
            + Math.round(charsOf(message?.tool_calls ?? []) / CHARS_PER_TOKEN),
    ]

    return {
        tokensIn,
        tokensOut,
        tokenSource: reported ? 'reported' : 'estimated',
        costUsd: chatCostOf(tokensIn, tokensOut, model),
        model,
    }
}

/* ---------- grounding ---------- */

const CLOCK_TIME = /\b\d{1,2}:\d{2}\s*(?:AM|PM)\b/gi

const normalise = (text) => text.toUpperCase().replace(/\s+/g, ' ')

/*
  (turn) -> { timesSeen, timesUnsupported }

  Counts clock times in the final answer that no tool reply this turn contained.
  A floor, not a groundedness score: see the README before quoting it.

  Both null when there was no final answer to check, which is every turn that
  ended by asking for a confirmation. Never throws.
*/
export const grounding = (turn) => {
    try {
        const last = turn.messages[turn.messages.length - 1]
        if (last?.role !== 'assistant' || typeof last.content !== 'string' || !last.content) {
            return { timesSeen: null, timesUnsupported: null }
        }

        const supported = normalise(
            turn.messages.filter(message => message.role === 'tool').map(message => message.content).join(' ')
        )

        const seen = [...new Set((last.content.match(CLOCK_TIME) ?? [])
            .map(time => normalise(time).replace(/\s*(AM|PM)/, ' $1')))]

        return {
            timesSeen: seen.length,
            timesUnsupported: seen.filter(time => !supported.includes(time)).length,
        }
    } catch {
        return { timesSeen: null, timesUnsupported: null }
    }
}
