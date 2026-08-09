import mongoose from 'mongoose'

const RETENTION_SECONDS = 60 * 60 * 24
const WAIT_MS = 5000
const POLL_MS = 100

const toolCallSchema = new mongoose.Schema({
    owner: { type: String, required: true },
    callId: { type: String, required: true },
    tool: { type: String, required: true },
    arguments: { type: String, default: '' },
    status: { type: String, enum: ['running', 'done'], required: true },
    outcome: { type: mongoose.Schema.Types.Mixed, default: null },
    claimedAt: { type: Date, default: Date.now, expires: RETENTION_SECONDS },
})

toolCallSchema.index({ owner: 1, callId: 1 }, { unique: true })

export const ToolCall = mongoose.model('ToolCall', toolCallSchema)

const IN_FLIGHT_REPLY = {
    message: 'This exact action is already being carried out from an earlier, identical request. Nothing was done here. Tell the user it is already being applied and do not repeat it.',
}

const FAILED_REPLY = {
    error: 'This action failed partway and was not retried, because repeating it could duplicate what it had already written. Tell the user it did not complete, and that asking again will start a fresh one.',
}

// (record, outcome) -> Promise<void>, marks the record done and saves what the
// call produced, as plain JSON.
const store = async (record, outcome) => {
    record.status = 'done'
    record.outcome = JSON.parse(JSON.stringify(outcome))
    await record.save()
}

/*
  Run a tool call at most once, ever.

  In:  call   toolCall; its id is the key, and a resent transcript carries the
              same id
       owner  string, the signed-in user's id
       run    () -> Promise<outcome>, called only if this call has not run

  Out: Promise<outcome>, from run() the first time, from storage every time after
*/
export const runOnce = async (call, owner, run) => {
    // Claim it. Mongo throws 11000 if this call already has a record.
    let record = null
    try {
        record = await ToolCall.create({
            owner,
            callId: call.id,
            tool: call.function.name,
            arguments: call.function.arguments,
            status: 'running',
        })
    } catch (error) {
        if (error.code !== 11000) throw error
    }

    if (!record) {
        const deadline = Date.now() + WAIT_MS

        while (Date.now() < deadline) {
            const existing = await ToolCall.findOne({ owner, callId: call.id }).lean()
            if (existing?.status === 'done') return existing.outcome

            await new Promise(resolve => setTimeout(resolve, POLL_MS))
        }

        return { reply: IN_FLIGHT_REPLY }
    }

    try {
        const outcome = await run()
        await store(record, outcome)

        return outcome
    } catch (error) {
        await store(record, { reply: FAILED_REPLY }).catch(() => {})

        throw error
    }
}
