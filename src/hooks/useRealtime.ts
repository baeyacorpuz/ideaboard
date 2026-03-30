import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

type TableName = 'boards' | 'columns' | 'items' | 'votes'

interface RealtimeConfig {
  table: TableName
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  onInsert?: (payload: unknown) => void
  onUpdate?: (payload: unknown) => void
  onDelete?: (payload: unknown) => void
}

/**
 * Hook to subscribe to real-time changes on a table
 */
export function useRealtime(config: RealtimeConfig) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const channel = supabase.channel(`${config.table}_changes`)

    channel.on(
      'postgres_changes',
      {
        event: config.event || '*',
        schema: 'public',
        table: config.table,
      },
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload

        switch (eventType) {
          case 'INSERT':
            config.onInsert?.(newRecord)
            break
          case 'UPDATE':
            config.onUpdate?.(newRecord)
            break
          case 'DELETE':
            config.onDelete?.(oldRecord)
            break
        }
      }
    )

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to ${config.table} changes`)
      }
    })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.table, config.event])

  return channelRef
}

/**
 * Hook to subscribe to all changes for a specific board
 */
export function useBoardRealtime(
  boardId: string,
  handlers: {
    onItemInsert?: (item: unknown) => void
    onItemUpdate?: (item: unknown) => void
    onItemDelete?: (itemId: string) => void
    onVoteInsert?: (vote: unknown) => void
    onVoteDelete?: (voteId: string) => void
  }
) {
  useEffect(() => {
    const channel = supabase.channel(`board:${boardId}`)

    // Subscribe to items changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'items',
      },
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload

        switch (eventType) {
          case 'INSERT':
            handlers.onItemInsert?.(newRecord)
            break
          case 'UPDATE':
            handlers.onItemUpdate?.(newRecord)
            break
          case 'DELETE':
            handlers.onItemDelete?.((oldRecord as { id: string }).id)
            break
        }
      }
    )

    // Subscribe to votes changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'votes',
      },
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload

        switch (eventType) {
          case 'INSERT':
            handlers.onVoteInsert?.(newRecord)
            break
          case 'DELETE':
            handlers.onVoteDelete?.((oldRecord as { id: string }).id)
            break
        }
      }
    )

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to board ${boardId} changes`)
      }
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [boardId, handlers])
}