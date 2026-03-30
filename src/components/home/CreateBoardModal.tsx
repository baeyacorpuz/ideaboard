import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Modal, Button, Input } from '@/components/ui'
import { BoardTypeSelector } from './BoardTypeSelector'
import { useBoardStore } from '@/hooks/useBoard'
import { BOARD_TYPE_CONFIG } from '@/types'
import type { BoardType } from '@/types'

interface CreateBoardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedBoardType: BoardType
}

export function CreateBoardModal({
  open,
  onOpenChange,
  selectedBoardType,
}: CreateBoardModalProps) {
  const navigate = useNavigate()
  const createBoard = useBoardStore((state) => state.createBoard)
  const [boardType, setBoardType] = useState<BoardType>(selectedBoardType)
  const [title, setTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      const board = await createBoard(title, boardType)
      // Redirect to the board page
      navigate(`/board/${board.id}`)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create board:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const config = BOARD_TYPE_CONFIG[boardType]

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Board"
      description="Choose a board type and give it a name to get started."
      size="lg"
    >
      <div className="space-y-6">
        {/* Board Type Selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Board Type
          </label>
          <BoardTypeSelector value={boardType} onChange={setBoardType} />
        </div>

        {/* Board Title */}
        <div>
          <Input
            label="Board Title (Optional)"
            placeholder={config.name + ' Board'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            helperText="Leave empty for default name"
          />
        </div>

        {/* Preview */}
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="mb-2 text-xs font-medium uppercase text-gray-500">
            Preview
          </p>
          <div className="flex gap-2">
            {config.columns.map((col, idx) => (
              <div
                key={idx}
                className="flex-1 rounded-lg p-3"
                style={{ backgroundColor: col.color + '20' }}
              >
                <div
                  className="mb-2 h-1.5 w-12 rounded-full"
                  style={{ backgroundColor: col.color }}
                />
                <p className="text-sm font-medium text-gray-700">
                  {col.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            isLoading={isCreating}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Create Board
          </Button>
        </div>
      </div>
    </Modal>
  )
}