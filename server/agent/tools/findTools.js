import { embed } from '../useBedrock.js'
import { matchTools } from '../useSupabase.js'

const MIN_SIMILARITY = 0.05
const MAX_MATCHES = 3

export const findTools = {
    name: 'find_tools',
    description: 'Search for a tool that can read or change the user\'s schedule. Call this before doing anything with tasks, events, reminders or themes, and call it again whenever the next step needs a capability you do not hold yet — reading first and then writing normally takes two searches. Describe the ONE capability you need right now in plain words, such as "see what is already scheduled on a day" or "create an event".',
    parameters: {
        type: 'object',
        properties: {
            need: {
                type: 'string',
                description: 'The capability you are looking for, in plain words.',
            },
        },
        required: ['need'],
    },
    run: async ({ need }) => {
        const matches = await matchTools(await embed(need), MAX_MATCHES)
        const found = matches.filter(match => match.similarity > MIN_SIMILARITY)

        if (!found.length) return { reply: { error: `No tool matches "${need}". Tell the user you cannot do that.` } }

        return {
            reply: { found: found.map(({ name, description }) => ({ name, description })) },
            offer: found.map(match => match.name),
        }
    },
}
