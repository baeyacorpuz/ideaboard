import { supabase } from '@/lib/supabase'
import type { Item, ItemInsert } from '@/types'

/**
 * Create a new item in a column
 */
export async function createItem(
  columnId: string,
  content: string,
  authorName: string = 'Anonymous'
): Promise<Item> {
  // Get the current max position for items in this column
  const { data: existingItems } = await supabase
    .from('items')
    .select('position')
    .eq('column_id', columnId)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = existingItems && existingItems.length > 0 
    ? existingItems[0].position + 1 
    : 0

  const { data, error } = await supabase
    .from('items')
    .insert({
      column_id: columnId,
      content,
      author_name: authorName,
      position: nextPosition,
    } as ItemInsert)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to create item')

  return data
}

/**
 * Update an item
 */
export async function updateItem(
  itemId: string,
  content: string
): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .update({ content })
    .eq('id', itemId)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to update item')

  return data
}

/**
 * Delete an item
 */
export async function deleteItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', itemId)

  if (error) throw error
}

/**
 * Move an item to a different column
 */
export async function moveItem(
  itemId: string,
  targetColumnId: string,
  newPosition: number
): Promise<void> {
  const { error } = await supabase
    .from('items')
    .update({
      column_id: targetColumnId,
      position: newPosition,
    })
    .eq('id', itemId)

  if (error) throw error
}

/**
 * Reorder items within a column
 */
export async function reorderItems(
  columnId: string,
  itemIds: string[]
): Promise<void> {
  // Update positions for all items
  const updates = itemIds.map((id, index) => ({
    id,
    position: index,
  }))

  for (const update of updates) {
    const { error } = await supabase
      .from('items')
      .update({ position: update.position })
      .eq('id', update.id)

    if (error) throw error
  }
}