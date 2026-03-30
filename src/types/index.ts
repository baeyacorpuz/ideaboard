// Board types enum
export type BoardType = 'retro' | 'brainstorm' | 'start-stop-continue' | 'freeform'

// Board interface
export interface Board {
  id: string
  title: string
  description?: string
  board_type: BoardType
  created_at: string
  updated_at: string
  created_by?: string
  is_active: boolean
  columns: Column[]
}

// Column interface
export interface Column {
  id: string
  board_id: string
  title: string
  color: string
  position: number
  created_at: string
  items: Item[]
}

// Item interface
export interface Item {
  id: string
  column_id: string
  content: string
  author_name: string
  votes: number
  position: number
  created_at: string
  updated_at: string
}

// Vote interface
export interface Vote {
  id: string
  item_id: string
  voter_id: string
  created_at: string
}

// Archived Board interface
export interface ArchivedBoard {
  id: string
  original_board_id: string
  title: string
  board_type: BoardType
  snapshot_data: {
    columns: {
      id: string
      title: string
      color: string
      position: number
      items: {
        id: string
        content: string
        author_name: string
        votes: number
        position: number
      }[]
    }[]
  }
  archived_at: string
  archived_by?: string
}

// Board type configurations
export const BOARD_TYPE_CONFIG: Record<BoardType, { name: string; description: string; columns: { title: string; color: string }[] }> = {
  retro: {
    name: 'Retrospective',
    description: 'Reflect on what went well, what didn\'t, and action items',
    columns: [
      { title: 'What went well', color: '#10b981' },
      { title: 'What didn\'t go well', color: '#ef4444' },
      { title: 'Action items', color: '#3b82f6' },
    ],
  },
  brainstorm: {
    name: 'Brainstorm',
    description: 'Generate and organize ideas collaboratively',
    columns: [
      { title: 'Ideas', color: '#8b5cf6' },
      { title: 'Grouped', color: '#f59e0b' },
      { title: 'Action items', color: '#10b981' },
    ],
  },
  'start-stop-continue': {
    name: 'Start/Stop/Continue',
    description: 'Evaluate processes and identify improvements',
    columns: [
      { title: 'Start', color: '#10b981' },
      { title: 'Stop', color: '#ef4444' },
      { title: 'Continue', color: '#3b82f6' },
    ],
  },
  freeform: {
    name: 'Freeform',
    description: 'Create your own custom columns',
    columns: [
      { title: 'Column 1', color: '#8b5cf6' },
    ],
  },
}

// Database insert types
export type BoardInsert = Omit<Board, 'id' | 'created_at' | 'updated_at' | 'columns'>
export type ColumnInsert = Omit<Column, 'id' | 'created_at' | 'items'>
export type ItemInsert = Omit<Item, 'id' | 'created_at' | 'updated_at'>
export type VoteInsert = Omit<Vote, 'id' | 'created_at'>

// Real-time event types
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

export interface RealtimePayload<T> {
  eventType: RealtimeEvent
  new: T
  old: T
  schema: string
  table: string
  commit_timestamp: string
}