import { ApiError } from '../errors.js'

const TOKEN = process.env.AWS_MODELS_TOKEN
const CHAT_URL = process.env.CHAT_URL
const EMBED_URL = process.env.EMBED_URL

const stripReasoning = (content) => (content ?? '').replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '').trim()

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

  Out: Promise<{ message, usage, model }>
       message  the assistant's reply, possibly carrying tool_calls, reasoning
                tags stripped. The only part that joins the transcript
       usage    the provider's token counts, undefined if it sent none
       model    the model id the provider named, or null

  Throws ApiError(502).
*/
export const chat = async (messages, tools) => {
    const data = await post(CHAT_URL, { messages, tools }, 'The agent')
    const message = data.choices?.[0]?.message

    if (!message) throw unusable('The agent')

    return {
        message: { ...message, content: stripReasoning(message.content) },
        usage: data.usage,
        model: data.model ?? null,
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
