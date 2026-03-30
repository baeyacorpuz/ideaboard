import { supabase } from '@/lib/supabase'
import type { Board, Column, BoardInsert } from '@/types'

export interface BoardWithColumns extends Board {
  columns: Column[]
}

/**
 * Create a new board with default columns
 */
export async function createBoard(
  title: string,
  boardType: Board['board_type']
): Promise<BoardWithColumns> {
  // Start a transaction by creating the board first
  const { data: board, error: boardError } = await supabase
    .from('boards')
    .insert({
      title: title || `${boardType.charAt(0).toUpperCase() + boardType.slice(1).replace('-', ' ')} Board`,
      board_type: boardType,
      is_active: true,
    } as BoardInsert)
    .select()
    .single()

  if (boardError) throw boardError
  if (!board) throw new Error('Failed to create board')

  // Create default columns based on board type
  const columnConfigs = getDefaultColumns(board.id, boardType)

  const { data: columns, error: columnsError } = await supabase
    .from('columns')
    .insert(columnConfigs)
    .select()

  if (columnsError) throw columnsError

  return {
    ...board,
    columns: (columns || []).map((col) => ({
      ...col,
      items: [],
    })),
  }
}

/**
 * Get a board by ID with all columns
 */
export async function getBoard(boardId: string): Promise<BoardWithColumns | null> {
  // Get the board
  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select('*')
    .eq('id', boardId)
    .eq('is_active', true)
    .single()

  if (boardError) {
    if (boardError.code === 'PGRST116') return null // Not found
    throw boardError
  }
  if (!board) return null

  // Get columns for this board
  const { data: columns, error: columnsError } = await supabase
    .from('columns')
    .select('*')
    .eq('board_id', boardId)
    .order('position', { ascending: true })

  if (columnsError) throw columnsError

  // Get items for each column
  const columnsWithItems = await Promise.all(
    (columns || []).map(async (column) => {
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('column_id', column.id)
        .order('position', { ascending: true })

      if (itemsError) throw itemsError

      return {
        ...column,
        items: items || [],
      }
    })
  )

  return {
    ...board,
    columns: columnsWithItems,
  }
}

/**
 * Update a board
 */
export async function updateBoard(
  boardId: string,
  updates: Partial<Pick<Board, 'title' | 'description'>>
): Promise<Board> {
  const { data, error } = await supabase
    .from('boards')
    .update(updates)
    .eq('id', boardId)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to update board')

  return data
}

/**
 * Delete a board (soft delete)
 */
export async function deleteBoard(boardId: string): Promise<void> {
  const { error } = await supabase
    .from('boards')
    .update({ is_active: false })
    .eq('id', boardId)

  if (error) throw error
}

// Helper function to get default columns based on board type
function getDefaultColumns(boardId: string, boardType: Board['board_type']) {
  const columnConfigs: Record<string, { title: string; color: string }[]> = {
    retro: [
      { title: 'What went well', color: '#10b981' },
      { title: "What didn't go well", color: '#ef4444' },
      { title: 'Action items', color: '#3b82f6' },
    ],
    brainstorm: [
      { title: 'Ideas', color: '#8b5cf6' },
      { title: 'Grouped', color: '#f59e0b' },
      { title: 'Action items', color: '#10b981' },
    ],
    'start-stop-continue': [
      { title: 'Start', color: '#10b981' },
      { title: 'Stop', color: '#ef4444' },
      { title: 'Continue', color: '#3b82f6' },
    ],
    freeform: [
      { title: 'Column 1', color: '#8b5cf6' },
    ],
  }

  return columnConfigs[boardType].map((config, index) => ({
    board_id: boardId,
    title: config.title,
    color: config.color,
    position: index,
  }))
}