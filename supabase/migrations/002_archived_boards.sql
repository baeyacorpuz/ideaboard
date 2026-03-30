-- Archived Boards table (stores snapshots of boards)
CREATE TABLE IF NOT EXISTS archived_boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  board_type TEXT NOT NULL,
  snapshot_data JSONB NOT NULL, -- Stores the full board state (columns + items)
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  archived_by TEXT -- Session ID of user who archived
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_archived_boards_original_id ON archived_boards(original_board_id);
CREATE INDEX IF NOT EXISTS idx_archived_boards_archived_at ON archived_boards(archived_at DESC);

-- Enable RLS
ALTER TABLE archived_boards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read on archived_boards" ON archived_boards
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on archived_boards" ON archived_boards
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete on archived_boards" ON archived_boards
  FOR DELETE USING (true);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE archived_boards;