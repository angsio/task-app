import { createClient } from '@supabase/supabase-js'

import { ApiError } from '../errors.js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)

// (embedding: number[], count: number) -> Promise<{ name, description, similarity }[]>
// Nearest tools by cosine distance, best first.
export const matchTools = async (embedding, count = 3) => {
    const { data, error } = await supabase.rpc('match_tools', {
        query_embedding: embedding,
        match_count: count
    })

    if (error) throw new ApiError(502, 'Tool retrieval failed.')

    return data
}

// (name: string, description: string, embedding: number[]) -> Promise<void>
// Writes one row of the retrieval index; re-run after editing a description.
export const upsertTool = async (name, description, embedding) => {
    const { error } = await supabase
        .from('tool_embeddings')
        .upsert({ name, description, embedding })

    if (error) throw new ApiError(500, 'Tool seeding failed.')
}