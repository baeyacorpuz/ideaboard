import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Users, MoreVertical, ThumbsUp, Trash2, Archive, History, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, Badge, Modal } from '@/components/ui';
import { useBoardStore } from '@/hooks/useBoard';
import { useBoardRealtime } from '@/hooks/useRealtime';
import { getArchivedBoards } from '@/lib/api/archive';
import { BOARD_TYPE_CONFIG } from '@/types';
import type { ArchivedBoard } from '@/types';

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const {
    currentBoard,
    isLoading,
    getBoard,
    addItem,
    deleteItem,
    archiveBoard,
    voteItem,
    unvoteItem,
    hasVoted,
    handleItemInsert,
    handleItemUpdate,
    handleItemDelete,
    handleVoteInsert,
    handleVoteDelete,
  } = useBoardStore();

  const [newItemText, setNewItemText] = useState<Record<string, string>>({});
  const [authorName, setAuthorName] = useState(() => {
    // Get author name from localStorage or use default
    return localStorage.getItem('ideaboard_author_name') || '';
  });
  const [showNameInput, setShowNameInput] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [archives, setArchives] = useState<ArchivedBoard[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [expandedArchive, setExpandedArchive] = useState<string | null>(null);

  // Load board data
  useEffect(() => {
    if (boardId) {
      getBoard(boardId);
    }
  }, [boardId, getBoard]);

  // Subscribe to real-time updates
  useBoardRealtime(boardId || '', {
    onItemInsert: (item) => handleItemInsert(item as never),
    onItemUpdate: (item) => handleItemUpdate(item as never),
    onItemDelete: (itemId) => handleItemDelete(itemId),
    onVoteInsert: (vote) => handleVoteInsert(vote as never),
    onVoteDelete: (itemId) => handleVoteDelete(itemId),
  });

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      // Could use a toast notification here
      alert('Link copied to clipboard!');
    } catch {
      console.log('Share URL:', url);
    }
  };

  const handleAddItem = async (columnId: string) => {
    const text = newItemText[columnId];
    if (!text?.trim()) return;

    // Check if author name is set
    const name = authorName.trim() || 'Anonymous';

    try {
      await addItem(columnId, text, name);
      setNewItemText((prev) => ({ ...prev, [columnId]: '' }));
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const handleVote = async (itemId: string) => {
    try {
      if (hasVoted(itemId)) {
        await unvoteItem(itemId);
      } else {
        await voteItem(itemId);
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem(itemId);
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleArchive = async () => {
    if (!currentBoard) return;
    
    const confirmed = window.confirm(
      'This will save the current board to history and clear all items. The board will be ready for a new session. Continue?'
    );
    if (!confirmed) return;

    setIsArchiving(true);
    try {
      await archiveBoard();
      // Refresh history after archiving
      loadHistory();
      alert('Board archived successfully! You can view it in history.');
    } catch (error) {
      console.error('Failed to archive board:', error);
      alert('Failed to archive board. Please try again.');
    } finally {
      setIsArchiving(false);
    }
  };

  const loadHistory = async () => {
    if (!boardId) return;
    
    setIsLoadingHistory(true);
    try {
      const data = await getArchivedBoards(boardId);
      setArchives(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleOpenHistory = () => {
    setShowHistory(true);
    loadHistory();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSaveName = () => {
    if (authorName.trim()) {
      localStorage.setItem('ideaboard_author_name', authorName.trim());
      setShowNameInput(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mx-auto' />
          <p className='text-gray-600'>Loading board...</p>
        </div>
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='mb-4 text-2xl font-bold text-gray-900'>
            Board not found
          </h1>
          <p className='mb-6 text-gray-600'>
            The board you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const boardConfig = BOARD_TYPE_CONFIG[currentBoard.board_type];

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='sticky top-0 z-10 border-b border-gray-200 bg-white'>
        <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
          {/* Left side */}
          <div className='flex items-center gap-4'>
            <Link
              to='/'
              className='flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors'
            >
              <ArrowLeft className='h-5 w-5' />
              <span className='hidden sm:inline'>Back</span>
            </Link>
            <div className='h-6 w-px bg-gray-200' />
            <div>
              <h1 className='text-lg font-semibold text-gray-900'>
                {currentBoard.title}
              </h1>
              <p className='text-sm text-gray-500'>{boardConfig.name}</p>
            </div>
          </div>

          {/* Right side */}
          <div className='flex items-center gap-3'>
            {/* Author name */}
            {authorName && !showNameInput ? (
              <button
                onClick={() => setShowNameInput(true)}
                className='text-sm text-gray-500 hover:text-gray-700'
              >
                Posting as: <span className='font-medium'>{authorName}</span>
              </button>
            ) : showNameInput ? (
              <div className='flex items-center gap-2'>
                <input
                  type='text'
                  placeholder='Your name'
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className='rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20'
                  autoFocus
                />
                <Button size='sm' onClick={handleSaveName}>
                  Save
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setShowNameInput(true)}
                className='text-sm text-purple-600 hover:text-purple-700'
              >
                Set your name
              </button>
            )}

            <div className='flex items-center gap-2 text-sm text-gray-500'>
              <Users className='h-4 w-4' />
              <span>Live</span>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={handleOpenHistory}
              leftIcon={<History className='h-4 w-4' />}
            >
              History
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={handleArchive}
              disabled={isArchiving}
              leftIcon={<Archive className='h-4 w-4' />}
            >
              {isArchiving ? 'Archiving...' : 'Archive'}
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={handleShare}
              leftIcon={<Share2 className='h-4 w-4' />}
            >
              Share
            </Button>
            <Button variant='ghost' size='sm'>
              <MoreVertical className='h-5 w-5' />
            </Button>
          </div>
        </div>
      </header>

      {/* Board Content */}
      <main className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        {/* Columns */}
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {currentBoard.columns?.map((column) => (
            <div key={column.id} className='rounded-xl bg-white p-4 shadow-sm'>
              {/* Column Header */}
              <div className='mb-4 flex items-center gap-2'>
                <div
                  className='h-3 w-3 rounded-full'
                  style={{ backgroundColor: column.color }}
                />
                <h2 className='font-semibold text-gray-900'>{column.title}</h2>
                <Badge size='sm'>{column.items?.length || 0}</Badge>
              </div>

              {/* Items */}
              <div className='space-y-2'>
                {column.items?.map((item) => (
                  <div
                    key={item.id}
                    className='group rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow'
                  >
                    <p className='text-sm text-gray-700'>{item.content}</p>
                    <div className='mt-2 flex items-center justify-between text-xs text-gray-500'>
                      <span>{item.author_name}</span>
                      <div className='flex items-center gap-2'>
                        <button
                          onClick={() => handleVote(item.id)}
                          className={`flex items-center gap-1 rounded px-2 py-1 transition-colors ${
                            hasVoted(item.id)
                              ? 'bg-purple-100 text-purple-700'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <ThumbsUp
                            className={`h-3 w-3 ${hasVoted(item.id) ? 'fill-current' : ''}`}
                          />
                          <span>{item.votes}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className='flex items-center gap-1 rounded px-2 py-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors'
                          title='Delete item'
                        >
                          <Trash2 className='h-3 w-3' />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Item Input */}
                <div className='mt-2'>
                  <input
                    type='text'
                    placeholder='Add an item...'
                    value={newItemText[column.id] || ''}
                    onChange={(e) =>
                      setNewItemText((prev) => ({
                        ...prev,
                        [column.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddItem(column.id);
                      }
                    }}
                    className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20'
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* History Modal */}
      <Modal
        open={showHistory}
        onOpenChange={setShowHistory}
        title='Board History'
        description='View past archived sessions of this board.'
        size='lg'
      >
        {isLoadingHistory ? (
          <div className='flex items-center justify-center py-8'>
            <div className='h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent' />
          </div>
        ) : archives.length === 0 ? (
          <div className='py-8 text-center'>
            <History className='mx-auto mb-3 h-10 w-10 text-gray-400' />
            <p className='text-gray-500'>No archived sessions yet.</p>
            <p className='mt-1 text-sm text-gray-400'>
              Archive this board to save its current state.
            </p>
          </div>
        ) : (
          <div className='max-h-96 space-y-3 overflow-y-auto'>
            {archives.map((archive) => (
              <div key={archive.id} className='rounded-lg border border-gray-200 p-3'>
                <button
                  onClick={() =>
                    setExpandedArchive(
                      expandedArchive === archive.id ? null : archive.id
                    )
                  }
                  className='flex w-full items-center justify-between text-left'
                >
                  <div>
                    <div className='font-medium text-gray-900'>
                      {archive.title}
                    </div>
                    <div className='text-sm text-gray-500'>
                      {formatDate(archive.archived_at)}
                    </div>
                  </div>
                  {expandedArchive === archive.id ? (
                    <ChevronUp className='h-5 w-5 text-gray-400' />
                  ) : (
                    <ChevronDown className='h-5 w-5 text-gray-400' />
                  )}
                </button>

                {expandedArchive === archive.id && (
                  <div className='mt-3 grid grid-cols-3 gap-2'>
                    {archive.snapshot_data.columns.map((col) => (
                      <div
                        key={col.id}
                        className='rounded p-2 text-sm'
                        style={{ backgroundColor: col.color + '15' }}
                      >
                        <div
                          className='mb-1 h-2 w-8 rounded'
                          style={{ backgroundColor: col.color }}
                        />
                        <div className='font-medium' style={{ color: col.color }}>
                          {col.items.length} {col.title}
                        </div>
                        {col.items.length > 0 && (
                          <ul className='mt-1 space-y-1 text-xs text-gray-600'>
                            {col.items.slice(0, 3).map((item) => (
                              <li key={item.id} className='truncate'>
                                • {item.content}
                              </li>
                            ))}
                            {col.items.length > 3 && (
                              <li className='text-gray-400'>
                                +{col.items.length - 3} more
                              </li>
                            )}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
