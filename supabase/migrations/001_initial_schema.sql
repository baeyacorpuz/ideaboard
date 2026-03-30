-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT 'Untitled Board',
  description TEXT,
  board_type TEXT NOT NULL DEFAULT 'retro' CHECK (board_type IN ('retro', 'brainstorm', 'start-stop-continue', 'freeform')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  is_active BOOLEAN DEFAULT TRUE
);

-- Columns table
CREATE TABLE IF NOT EXISTS columns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8b5cf6',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  column_id UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_name TEXT DEFAULT 'Anonymous',
  votes INTEGER DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, voter_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_columns_board_id ON columns(board_id);
CREATE INDEX IF NOT EXISTS idx_items_column_id ON items(column_id);
CREATE INDEX IF NOT EXISTS idx_votes_item_id ON votes(item_id);
CREATE INDEX IF NOT EXISTS idx_boards_created_at ON boards(created_at DESC);

-- Enable Row Level Security
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boards (public read/write for anonymous access)
CREATE POLICY "Allow public read on boards" ON boards
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on boards" ON boards
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on boards" ON boards
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on boards" ON boards
  FOR DELETE USING (true);

-- RLS Policies for columns
CREATE POLICY "Allow public read on columns" ON columns
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on columns" ON columns
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on columns" ON columns
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on columns" ON columns
  FOR DELETE USING (true);

-- RLS Policies for items
CREATE POLICY "Allow public read on items" ON items
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on items" ON items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on items" ON items
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on items" ON items
  FOR DELETE USING (true);

-- RLS Policies for votes
CREATE POLICY "Allow public read on votes" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on votes" ON votes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete on votes" ON votes
  FOR DELETE USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on boards
CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on items
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE boards;
ALTER PUBLICATION supabase_realtime ADD TABLE columns;
ALTER PUBLICATION supabase_realtime ADD TABLE items;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;

-- Function to increment vote count
CREATE OR REPLACE FUNCTION increment_vote_count(item_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE items SET votes = votes + 1 WHERE id = item_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement vote count
CREATE OR REPLACE FUNCTION decrement_vote_count(item_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE items SET votes = GREATEST(0, votes - 1) WHERE id = item_id;
END;
$$ LANGUAGE plpgsql;