import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { getAllArchivedBoards, deleteArchivedBoard } from '@/lib/api/archive'
import { BOARD_TYPE_CONFIG } from '@/types'
import type { ArchivedBoard } from '@/types'

export function HistoryPage() {
  const [archives, setArchives] = useState<ArchivedBoard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadArchives()
  }, [])

  const loadArchives = async () => {
    try {
      setIsLoading(true)
      const data = await getAllArchivedBoards()
      setArchives(data)
    } catch (err) {
      setError('Failed to load history')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (archiveId: string) => {
    if (!window.confirm('Are you sure you want to delete this archive?')) return

    try {
      await deleteArchivedBoard(archiveId)
      setArchives(archives.filter((a) => a.id !== archiveId))
    } catch (err) {
      console.error('Failed to delete archive:', err)
      alert('Failed to delete archive')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getItemCount = (archive: ArchivedBoard) => {
    return archive.snapshot_data.columns.reduce(
      (total, col) => total + col.items.length,
      0
    )
  }

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mx-auto' />
          <p className='text-gray-600'>Loading history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='sticky top-0 z-10 border-b border-gray-200 bg-white'>
        <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-4'>
            <Link
              to='/'
              className='flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors'
            >
              <ArrowLeft className='h-5 w-5' />
              <span>Back</span>
            </Link>
            <div className='h-6 w-px bg-gray-200' />
            <h1 className='text-lg font-semibold text-gray-900'>
              Board History
            </h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        {error && (
          <div className='mb-4 rounded-lg bg-red-50 p-4 text-red-700'>
            {error}
          </div>
        )}

        {archives.length === 0 ? (
          <div className='rounded-lg bg-white p-8 text-center shadow-sm'>
            <Calendar className='mx-auto mb-4 h-12 w-12 text-gray-400' />
            <h2 className='mb-2 text-lg font-semibold text-gray-900'>
              No archived boards
            </h2>
            <p className='text-gray-500'>
              When you archive a board, it will appear here.
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            {archives.map((archive) => {
              const boardConfig = BOARD_TYPE_CONFIG[archive.board_type]
              const itemCount = getItemCount(archive)

              return (
                <div
                  key={archive.id}
                  className='rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-shadow'
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <h3 className='font-semibold text-gray-900'>
                          {archive.title}
                        </h3>
                        <span className='rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700'>
                          {boardConfig.name}
                        </span>
                      </div>
                      <div className='flex items-center gap-4 text-sm text-gray-500'>
                        <span className='flex items-center gap-1'>
                          <Calendar className='h-4 w-4' />
                          {formatDate(archive.archived_at)}
                        </span>
                        <span>{itemCount} items</span>
                      </div>

                      {/* Preview columns */}
                      <div className='mt-3 flex gap-2'>
                        {archive.snapshot_data.columns.map((col) => (
                          <div
                            key={col.id}
                            className='rounded px-2 py-1 text-xs'
                            style={{ backgroundColor: col.color + '20' }}
                          >
                            <span style={{ color: col.color }}>{col.items.length}</span>{' '}
                            {col.title}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleDelete(archive.id)}
                      className='text-gray-400 hover:text-red-600'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}