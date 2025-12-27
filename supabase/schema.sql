-- =============================================
-- SUPABASE SCHEMA FOR TRELLO CLONE
-- Run this SQL in your Supabase SQL Editor
-- =============================================

-- Enable UUID extension (usually enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lists table
CREATE TABLE IF NOT EXISTS lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES for better performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_board_id ON lists(board_id);
CREATE INDEX IF NOT EXISTS idx_lists_position ON lists(board_id, position);
CREATE INDEX IF NOT EXISTS idx_cards_list_id ON cards(list_id);
CREATE INDEX IF NOT EXISTS idx_cards_position ON cards(list_id, position);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES FOR BOARDS
-- Users can only access their own boards
-- =============================================

-- Policy: Users can view their own boards
CREATE POLICY "Users can view own boards" ON boards
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own boards
CREATE POLICY "Users can create own boards" ON boards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own boards
CREATE POLICY "Users can update own boards" ON boards
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own boards
CREATE POLICY "Users can delete own boards" ON boards
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES FOR LISTS
-- Access cascades through board ownership
-- =============================================

-- Policy: Users can view lists in their boards
CREATE POLICY "Users can view lists in own boards" ON lists
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = lists.board_id 
      AND boards.user_id = auth.uid()
    )
  );

-- Policy: Users can create lists in their boards
CREATE POLICY "Users can create lists in own boards" ON lists
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = lists.board_id 
      AND boards.user_id = auth.uid()
    )
  );

-- Policy: Users can update lists in their boards
CREATE POLICY "Users can update lists in own boards" ON lists
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = lists.board_id 
      AND boards.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = lists.board_id 
      AND boards.user_id = auth.uid()
    )
  );

-- Policy: Users can delete lists in their boards
CREATE POLICY "Users can delete lists in own boards" ON lists
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = lists.board_id 
      AND boards.user_id = auth.uid()
    )
  );

-- =============================================
-- RLS POLICIES FOR CARDS
-- Access cascades through list -> board ownership
-- =============================================

-- Policy: Users can view cards in their boards
CREATE POLICY "Users can view cards in own boards" ON cards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lists
      JOIN boards ON boards.id = lists.board_id
      WHERE lists.id = cards.list_id 
      AND boards.user_id = auth.uid()
    )
  );

-- Policy: Users can create cards in their boards
CREATE POLICY "Users can create cards in own boards" ON cards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists
      JOIN boards ON boards.id = lists.board_id
      WHERE lists.id = cards.list_id 
      AND boards.user_id = auth.uid()
    )
  );

-- Policy: Users can update cards in their boards
CREATE POLICY "Users can update cards in own boards" ON cards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM lists
      JOIN boards ON boards.id = lists.board_id
      WHERE lists.id = cards.list_id 
      AND boards.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists
      JOIN boards ON boards.id = lists.board_id
      WHERE lists.id = cards.list_id 
      AND boards.user_id = auth.uid()
    )
  );

-- Policy: Users can delete cards in their boards
CREATE POLICY "Users can delete cards in own boards" ON cards
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM lists
      JOIN boards ON boards.id = lists.board_id
      WHERE lists.id = cards.list_id 
      AND boards.user_id = auth.uid()
    )
  );

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

-- If you see this without errors, the schema is set up correctly!
-- You can now use the Trello Clone application.
