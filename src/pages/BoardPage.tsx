import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Users, MoreVertical, ThumbsUp } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { useBoardStore } from '@/hooks/useBoard';
import { useBoardRealtime } from '@/hooks/useRealtime';
import { BOARD_TYPE_CONFIG } from '@/types';

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const {
    currentBoard,
    isLoading,
    getBoard,
    addItem,
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
                    className='rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow'
                  >
                    <p className='text-sm text-gray-700'>{item.content}</p>
                    <div className='mt-2 flex items-center justify-between text-xs text-gray-500'>
                      <span>{item.author_name}</span>
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
    </div>
  );
}
