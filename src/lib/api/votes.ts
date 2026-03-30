import { supabase, getSessionId } from '@/lib/supabase'
import type { Vote, VoteInsert } from '@/types'

/**
 * Add a vote to an item
 */
export async function addVote(itemId: string): Promise<Vote> {
  const voterId = getSessionId()

  const { data, error } = await supabase
    .from('votes')
    .insert({
      item_id: itemId,
      voter_id: voterId,
    } as VoteInsert)
    .select()
    .single()

  if (error) {
    // Check if it's a duplicate vote (unique constraint violation)
    if (error.code === '23505') {
      throw new Error('Already voted')
    }
    throw error
  }
  if (!data) throw new Error('Failed to add vote')

  // Update vote count on the item
  await supabase.rpc('increment_vote_count', { item_id: itemId })

  return data
}

/**
 * Remove a vote from an item
 */
export async function removeVote(itemId: string): Promise<void> {
  const voterId = getSessionId()

  const { error } = await supabase
    .from('votes')
    .delete()
    .eq('item_id', itemId)
    .eq('voter_id', voterId)

  if (error) throw error

  // Update vote count on the item
  await supabase.rpc('decrement_vote_count', { item_id: itemId })
}

/**
 * Check if the current user has voted on an item
 */
export async function hasVoted(itemId: string): Promise<boolean> {
  const voterId = getSessionId()

  const { data, error } = await supabase
    .from('votes')
    .select('id')
    .eq('item_id', itemId)
    .eq('voter_id', voterId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return false // Not found
    throw error
  }

  return !!data
}

/**
 * Get all votes for an item
 */
export async function getVotes(itemId: string): Promise<Vote[]> {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('item_id', itemId)

  if (error) throw error

  return data || []
}

/**
 * Get all items the current user has voted on in a board
 */
export async function getUserVotes(boardId: string): Promise<string[]> {
  const voterId = getSessionId()

  // First get all column IDs for this board
  const { data: columns, error: columnsError } = await supabase
    .from('columns')
    .select('id')
    .eq('board_id', boardId)

  if (columnsError) throw columnsError
  if (!columns) return []

  const columnIds = columns.map((c) => c.id)

  // Then get all item IDs in those columns
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('id')
    .in('column_id', columnIds)

  if (itemsError) throw itemsError
  if (!items) return []

  const itemIds = items.map((i) => i.id)

  // Finally get votes by this user on those items
  const { data: votes, error: votesError } = await supabase
    .from('votes')
    .select('item_id')
    .eq('voter_id', voterId)
    .in('item_id', itemIds)

  if (votesError) throw votesError

  return (votes || []).map((v) => v.item_id)
}