import { create } from 'zustand'
import type { Board, Item, ArchivedBoard } from '@/types'
import * as api from '@/lib/api'

interface BoardState {
  // Current board
  currentBoard: Board | null
  isLoading: boolean
  error: string | null
  userVotes: Set<string> // Item IDs the user has voted on

  // Actions
  setCurrentBoard: (board: Board | null) => void
  createBoard: (title: string, boardType: Board['board_type']) => Promise<Board>
  getBoard: (boardId: string) => Promise<Board | null>
  updateBoard: (title: string, description?: string) => Promise<void>
  deleteBoard: () => Promise<void>
  archiveBoard: () => Promise<ArchivedBoard>
  
  // Item actions
  addItem: (columnId: string, content: string, authorName?: string) => Promise<Item>
  updateItem: (itemId: string, content: string) => Promise<void>
  deleteItem: (itemId: string) => Promise<void>
  
  // Vote actions
  voteItem: (itemId: string) => Promise<void>
  unvoteItem: (itemId: string) => Promise<void>
  hasVoted: (itemId: string) => boolean
  
  // Real-time handlers
  handleItemInsert: (item: Item) => void
  handleItemUpdate: (item: Item) => void
  handleItemDelete: (itemId: string) => void
  handleVoteInsert: (vote: { item_id: string }) => void
  handleVoteDelete: (itemId: string) => void
}

export const useBoardStore = create<BoardState>((set, get) => ({
  currentBoard: null,
  isLoading: false,
  error: null,
  userVotes: new Set(),

  setCurrentBoard: (board) => set({ currentBoard: board }),

  createBoard: async (title, boardType) => {
    set({ isLoading: true, error: null })

    try {
      const board = await api.createBoard(title, boardType)
      set({ currentBoard: board, isLoading: false })
      return board
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create board'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  getBoard: async (boardId) => {
    set({ isLoading: true, error: null })

    try {
      const board = await api.getBoard(boardId)
      
      if (board) {
        // Get user votes for this board
        const userVotes = await api.getUserVotes(boardId)
        set({ 
          currentBoard: board, 
          isLoading: false,
          userVotes: new Set(userVotes)
        })
      } else {
        set({ currentBoard: null, isLoading: false })
      }
      
      return board
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch board'
      set({ error: message, isLoading: false })
      return null
    }
  },

  updateBoard: async (title, description) => {
    const { currentBoard } = get()
    if (!currentBoard) return

    try {
      const updated = await api.updateBoard(currentBoard.id, { title, description })
      set({ currentBoard: { ...currentBoard, ...updated } })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update board'
      set({ error: message })
      throw error
    }
  },

  deleteBoard: async () => {
    const { currentBoard } = get()
    if (!currentBoard) return

    try {
      await api.deleteBoard(currentBoard.id)
      set({ currentBoard: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete board'
      set({ error: message })
      throw error
    }
  },

  archiveBoard: async () => {
    const { currentBoard } = get()
    if (!currentBoard) throw new Error('No board loaded')

    try {
      const archived = await api.archiveBoard(currentBoard)
      
      // Clear items from local state (board structure remains)
      set({
        currentBoard: {
          ...currentBoard,
          columns: currentBoard.columns.map((col) => ({
            ...col,
            items: [],
          })),
        },
      })

      return archived
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to archive board'
      set({ error: message })
      throw error
    }
  },

  addItem: async (columnId, content, authorName = 'Anonymous') => {
    const { currentBoard } = get()
    if (!currentBoard) throw new Error('No board loaded')

    try {
      const item = await api.createItem(columnId, content, authorName)
      
      // Update local state
      set({
        currentBoard: {
          ...currentBoard,
          columns: currentBoard.columns.map((col) =>
            col.id === columnId
              ? { ...col, items: [...col.items, item] }
              : col
          ),
        },
      })

      return item
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add item'
      set({ error: message })
      throw error
    }
  },

  updateItem: async (itemId, content) => {
    const { currentBoard } = get()
    if (!currentBoard) return

    try {
      await api.updateItem(itemId, content)
      
      // Update local state
      set({
        currentBoard: {
          ...currentBoard,
          columns: currentBoard.columns.map((col) => ({
            ...col,
            items: col.items.map((item) =>
              item.id === itemId ? { ...item, content } : item
            ),
          })),
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update item'
      set({ error: message })
      throw error
    }
  },

  deleteItem: async (itemId) => {
    const { currentBoard } = get()
    if (!currentBoard) return

    try {
      await api.deleteItem(itemId)
      
      // Update local state
      set({
        currentBoard: {
          ...currentBoard,
          columns: currentBoard.columns.map((col) => ({
            ...col,
            items: col.items.filter((item) => item.id !== itemId),
          })),
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete item'
      set({ error: message })
      throw error
    }
  },

  voteItem: async (itemId) => {
    const { currentBoard, userVotes } = get()
    if (!currentBoard) return

    try {
      await api.addVote(itemId)
      
      // Update local state
      const newUserVotes = new Set(userVotes)
      newUserVotes.add(itemId)
      
      set({
        userVotes: newUserVotes,
        currentBoard: {
          ...currentBoard,
          columns: currentBoard.columns.map((col) => ({
            ...col,
            items: col.items.map((item) =>
              item.id === itemId ? { ...item, votes: item.votes + 1 } : item
            ),
          })),
        },
      })
    } catch (error) {
      // Already voted - ignore
      if (error instanceof Error && error.message === 'Already voted') {
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to vote'
      set({ error: message })
    }
  },

  unvoteItem: async (itemId) => {
    const { currentBoard, userVotes } = get()
    if (!currentBoard) return

    try {
      await api.removeVote(itemId)
      
      // Update local state
      const newUserVotes = new Set(userVotes)
      newUserVotes.delete(itemId)
      
      set({
        userVotes: newUserVotes,
        currentBoard: {
          ...currentBoard,
          columns: currentBoard.columns.map((col) => ({
            ...col,
            items: col.items.map((item) =>
              item.id === itemId ? { ...item, votes: Math.max(0, item.votes - 1) } : item
            ),
          })),
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove vote'
      set({ error: message })
    }
  },

  hasVoted: (itemId) => {
    return get().userVotes.has(itemId)
  },

  // Real-time handlers
  handleItemInsert: (item) => {
    const { currentBoard } = get()
    if (!currentBoard) return

    const typedItem = item as Item
    
    // Check if item already exists (to prevent duplicates from local + realtime)
    const itemExists = currentBoard.columns.some((col) =>
      col.items.some((i) => i.id === typedItem.id)
    )
    if (itemExists) return
    
    set({
      currentBoard: {
        ...currentBoard,
        columns: currentBoard.columns.map((col) =>
          col.id === typedItem.column_id
            ? { ...col, items: [...col.items, typedItem] }
            : col
        ),
      },
    })
  },

  handleItemUpdate: (item) => {
    const { currentBoard } = get()
    if (!currentBoard) return

    const typedItem = item as Item
    
    set({
      currentBoard: {
        ...currentBoard,
        columns: currentBoard.columns.map((col) => ({
          ...col,
          items: col.items.map((i) =>
            i.id === typedItem.id ? typedItem : i
          ),
        })),
      },
    })
  },

  handleItemDelete: (itemId) => {
    const { currentBoard } = get()
    if (!currentBoard) return

    set({
      currentBoard: {
        ...currentBoard,
        columns: currentBoard.columns.map((col) => ({
          ...col,
          items: col.items.filter((i) => i.id !== itemId),
        })),
      },
    })
  },

  handleVoteInsert: (vote) => {
    const { currentBoard } = get()
    if (!currentBoard) return

    const { item_id } = vote as { item_id: string }
    
    set({
      currentBoard: {
        ...currentBoard,
        columns: currentBoard.columns.map((col) => ({
          ...col,
          items: col.items.map((item) =>
            item.id === item_id ? { ...item, votes: item.votes + 1 } : item
          ),
        })),
      },
    })
  },

  handleVoteDelete: (itemId) => {
    const { currentBoard } = get()
    if (!currentBoard) return

    set({
      currentBoard: {
        ...currentBoard,
        columns: currentBoard.columns.map((col) => ({
          ...col,
          items: col.items.map((item) =>
            item.id === itemId ? { ...item, votes: Math.max(0, item.votes - 1) } : item
          ),
        })),
      },
    })
  },
}))