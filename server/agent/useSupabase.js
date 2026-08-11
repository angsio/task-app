import { createClient } from '@supabase/supabase-js'

import { ApiError } from '../errors.js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)

// (error) -> Error, the postgrest failure with its code and hint kept intact.
// Supabase returns faults as a value rather than throwing, so they carry no
// stack of their own; this gives them one to attach as a cause.
const postgrest = ({ message, code, details, hint }) =>
    Object.assign(new Error(message), { code, details, hint })

// (embedding: number[], count: number) -> Promise<{ name, description, similarity }[]>
// Nearest tools by cosine distance, best first.
export const matchTools = async (embedding, count = 3) => {
    const { data, error } = await supabase.rpc('match_tools', {
        query_embedding: embedding,
        match_count: count
    })

    if (error) throw new ApiError(502, 'Tool retrieval failed.', { cause: postgrest(error) })

    return data
}

// (name: string, description: string, embedding: number[]) -> Promise<void>
// Keyed on name, so re-seeding a tool overwrites its row instead of colliding.
export const upsertTool = async (name, description, embedding) => {
    const { error } = await supabase
        .from('tool_embeddings')
        .upsert({ name, description, embedding }, { onConflict: 'name' })

    if (error) throw new ApiError(500, `Tool seeding failed for ${name}.`, { cause: postgrest(error) })
}