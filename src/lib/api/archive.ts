import { supabase, getSessionId } from '@/lib/supabase'
import type { ArchivedBoard, Board } from '@/types'

/**
 * Archive a board - saves current state and clears items
 */
export async function archiveBoard(board: Board): Promise<ArchivedBoard> {
  const sessionId = getSessionId()

  // Create snapshot data
  const snapshotData = {
    columns: board.columns.map((col) => ({
      id: col.id,
      title: col.title,
      color: col.color,
      position: col.position,
      items: col.items.map((item) => ({
        id: item.id,
        content: item.content,
        author_name: item.author_name,
        votes: item.votes,
        position: item.position,
      })),
    })),
  }

  // Save to archived_boards
  const { data: archived, error: archiveError } = await supabase
    .from('archived_boards')
    .insert({
      original_board_id: board.id,
      title: board.title,
      board_type: board.board_type,
      snapshot_data: snapshotData,
      archived_by: sessionId,
    })
    .select()
    .single()

  if (archiveError) throw archiveError
  if (!archived) throw new Error('Failed to archive board')

  // Clear all items from the board
  const columnIds = board.columns.map((col) => col.id)
  
  for (const columnId of columnIds) {
    // Delete all items in this column
    const { error: deleteError } = await supabase
      .from('items')
      .delete()
      .eq('column_id', columnId)

    if (deleteError) throw deleteError
  }

  return archived
}

/**
 * Get all archived boards for a board
 */
export async function getArchivedBoards(boardId: string): Promise<ArchivedBoard[]> {
  const { data, error } = await supabase
    .from('archived_boards')
    .select('*')
    .eq('original_board_id', boardId)
    .order('archived_at', { ascending: false })

  if (error) throw error

  return data || []
}

/**
 * Get all archived boards (for history page)
 */
export async function getAllArchivedBoards(): Promise<ArchivedBoard[]> {
  const { data, error } = await supabase
    .from('archived_boards')
    .select('*')
    .order('archived_at', { ascending: false })
    .limit(50)

  if (error) throw error

  return data || []
}

/**
 * Delete an archived board
 */
export async function deleteArchivedBoard(archivedId: string): Promise<void> {
  const { error } = await supabase
    .from('archived_boards')
    .delete()
    .eq('id', archivedId)

  if (error) throw error
}

/**
 * Get a single archived board
 */
export async function getArchivedBoard(archivedId: string): Promise<ArchivedBoard | null> {
  const { data, error } = await supabase
    .from('archived_boards')
    .select('*')
    .eq('id', archivedId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}