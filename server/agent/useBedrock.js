import { ApiError } from '../errors.js'

const TOKEN = process.env.AWS_MODELS_TOKEN
const CHAT_URL = process.env.CHAT_URL
const EMBED_URL = process.env.EMBED_URL

// How much the model deliberates before answering. Explicit rather than left to
// the gateway: high spends roughly three times the output tokens on a scheduling
// turn for no better tool choice, and every extra line of it is a line that can
// degenerate or leak.
const REASONING_EFFORT = 'medium'

const LOST_REPLY = 'I lost my train of thought there. Ask me again and I will pick it up.'

/*
  (content) -> the answer, with the model's reasoning taken out.

  gpt-oss writes its reasoning into the content itself, wrapped in <reasoning>
  tags. A generation that degenerates or is cut short loses one of the two tags,
  and then matching only on complete pairs strips nothing and the whole thing
  reaches the transcript and the user. So each half is handled alone: text before
  a stray closing tag lost its opening one, and text after a stray opening tag
  never closed.
*/
const stripReasoning = (content) => {
    let text = (content ?? '').replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '')

    const close = text.lastIndexOf('</reasoning>')
    if (close !== -1) text = text.slice(close + '</reasoning>'.length)

    const open = text.indexOf('<reasoning>')
    if (open !== -1) text = text.slice(0, open)

    return text.trim()
}

// (subject, status?) -> ApiError, the model could not be reached or refused.
// `upstreamStatus` carries what it said, when it said anything.
const unreachable = (subject, status) => {
    const failed = new ApiError(502, `${subject} is unreachable.`)
    if (status !== undefined) failed.upstreamStatus = status

    return failed
}

// (subject, cause?) -> ApiError, the model answered with something unusable.
const unusable = (subject, cause) => {
    const failed = new ApiError(502, `${subject} returned an unusable response.`)
    failed.upstreamStatus = 'malformed'
    if (cause) failed.cause = cause

    return failed
}

/*
  In:  url, body  the call to make
       subject    names the model in the error message

  Out: Promise<object>, the parsed JSON body.

  Throws ApiError(502) for all three failures: no reply, a refusal, or a body
  that will not parse. Which one is on `cause` as an errno, or on
  `upstreamStatus` as the status the gateway returned.
*/
const post = async (url, body, subject) => {
    let response

    try {
        response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
    } catch (error) {
        const failed = unreachable(subject)
        failed.cause = error

        throw failed
    }

    if (!response.ok) throw unreachable(subject, response.status)

    try {
        return await response.json()
    } catch (error) {
        throw unusable(subject, error)
    }
}

/*
  In:  messages  message[], the transcript
       tools     spec[], the functions the model may call this call

  Out: Promise<{ message, usage, model, finish }>
       message  the assistant's reply, possibly carrying tool_calls, reasoning
                stripped. The only part that joins the transcript
       usage    the provider's token counts, undefined if it sent none
       model    the model id the provider named, or null
       finish   why the model stopped. 'length' means it was cut off, which is
                what leaves reasoning unclosed and answers half written

  Throws ApiError(502).
*/
export const chat = async (messages, tools) => {
    const data = await post(CHAT_URL, { messages, tools, reasoning_effort: REASONING_EFFORT }, 'The agent')
    const choice = data.choices?.[0]

    if (!choice?.message) throw unusable('The agent')

    // Reasoning that ran away can leave nothing behind once it is stripped.
    // Saying so beats sending the browser an empty bubble.
    const content = stripReasoning(choice.message.content)
    const tooling = Boolean(choice.message.tool_calls?.length)

    return {
        message: { ...choice.message, content: content || (tooling ? '' : LOST_REPLY) },
        usage: data.usage,
        model: data.model ?? null,
        finish: choice.finish_reason ?? null,
    }
}

/*
  (text: string) -> Promise<number[]>, the embedding vector.

  Billed on input tokens only; what comes back is a vector, not tokens.
  Throws ApiError(502).
*/
export const embed = async (text) => {
    const data = await post(EMBED_URL, { inputText: text }, 'The embedding model')

    if (!Array.isArray(data.embedding)) throw unusable('The embedding model')

    return data.embedding
}
