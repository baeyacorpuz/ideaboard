import { cn } from '@/lib/utils'
import type { BoardType } from '@/types'
import { BOARD_TYPE_CONFIG } from '@/types'

interface BoardTypeSelectorProps {
  value: BoardType
  onChange: (type: BoardType) => void
}

export function BoardTypeSelector({ value, onChange }: BoardTypeSelectorProps) {
  const boardTypes = Object.entries(BOARD_TYPE_CONFIG) as [BoardType, typeof BOARD_TYPE_CONFIG[BoardType]][]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {boardTypes.map(([type, config]) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={cn(
            'group relative rounded-xl border-2 p-4 text-left transition-all duration-200',
            'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
            value === type
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          )}
        >
          {/* Color indicator */}
          <div className="mb-3 flex gap-1">
            {config.columns.slice(0, 3).map((col, idx) => (
              <div
                key={idx}
                className="h-2 w-6 rounded-full"
                style={{ backgroundColor: col.color }}
              />
            ))}
          </div>

          {/* Title */}
          <h3
            className={cn(
              'font-semibold',
              value === type
                ? 'text-purple-700'
                : 'text-gray-900'
            )}
          >
            {config.name}
          </h3>

          {/* Description */}
          <p className="mt-1 text-sm text-gray-500">
            {config.description}
          </p>

          {/* Selected indicator */}
          {value === type && (
            <div className="absolute right-3 top-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-white">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}