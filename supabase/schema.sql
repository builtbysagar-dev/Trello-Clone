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

-- Board members table (tracks who has access to which board)
CREATE TABLE IF NOT EXISTS board_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(board_id, user_id)
);

-- Board invites table (invite links like Discord)
CREATE TABLE IF NOT EXISTS board_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  uses INTEGER DEFAULT 0,
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
CREATE INDEX IF NOT EXISTS idx_board_members_board_id ON board_members(board_id);
CREATE INDEX IF NOT EXISTS idx_board_members_user_id ON board_members(user_id);
CREATE INDEX IF NOT EXISTS idx_board_invites_code ON board_invites(invite_code);

-- =============================================
-- HELPER FUNCTION: Check if user has access to board
-- =============================================

CREATE OR REPLACE FUNCTION user_has_board_access(board_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM boards WHERE id = board_uuid AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM board_members WHERE board_id = board_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_invites ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES FOR BOARDS
-- Users can access boards they own OR are members of
-- =============================================

-- Drop existing policies if they exist (for clean re-run)
DROP POLICY IF EXISTS "Users can view own boards" ON boards;
DROP POLICY IF EXISTS "Users can create own boards" ON boards;
DROP POLICY IF EXISTS "Users can update own boards" ON boards;
DROP POLICY IF EXISTS "Users can delete own boards" ON boards;
DROP POLICY IF EXISTS "Users can view accessible boards" ON boards;
DROP POLICY IF EXISTS "Users can update accessible boards" ON boards;
DROP POLICY IF EXISTS "Owners can delete own boards" ON boards;

-- Policy: Users can view boards they own or are members of
CREATE POLICY "Users can view accessible boards" ON boards
  FOR SELECT
  USING (user_has_board_access(id));

-- Policy: Users can create their own boards
CREATE POLICY "Users can create own boards" ON boards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update boards they own or are members of
CREATE POLICY "Users can update accessible boards" ON boards
  FOR UPDATE
  USING (user_has_board_access(id))
  WITH CHECK (user_has_board_access(id));

-- Policy: Only owners can delete boards
CREATE POLICY "Owners can delete own boards" ON boards
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES FOR LISTS
-- Access cascades through board access
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view lists in own boards" ON lists;
DROP POLICY IF EXISTS "Users can create lists in own boards" ON lists;
DROP POLICY IF EXISTS "Users can update lists in own boards" ON lists;
DROP POLICY IF EXISTS "Users can delete lists in own boards" ON lists;
DROP POLICY IF EXISTS "Users can view lists in accessible boards" ON lists;
DROP POLICY IF EXISTS "Users can create lists in accessible boards" ON lists;
DROP POLICY IF EXISTS "Users can update lists in accessible boards" ON lists;
DROP POLICY IF EXISTS "Users can delete lists in accessible boards" ON lists;

-- Policy: Users can view lists in accessible boards
CREATE POLICY "Users can view lists in accessible boards" ON lists
  FOR SELECT
  USING (user_has_board_access(board_id));

-- Policy: Users can create lists in accessible boards
CREATE POLICY "Users can create lists in accessible boards" ON lists
  FOR INSERT
  WITH CHECK (user_has_board_access(board_id));

-- Policy: Users can update lists in accessible boards
CREATE POLICY "Users can update lists in accessible boards" ON lists
  FOR UPDATE
  USING (user_has_board_access(board_id))
  WITH CHECK (user_has_board_access(board_id));

-- Policy: Users can delete lists in accessible boards
CREATE POLICY "Users can delete lists in accessible boards" ON lists
  FOR DELETE
  USING (user_has_board_access(board_id));

-- =============================================
-- RLS POLICIES FOR CARDS
-- Access cascades through list -> board access
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view cards in own boards" ON cards;
DROP POLICY IF EXISTS "Users can create cards in own boards" ON cards;
DROP POLICY IF EXISTS "Users can update cards in own boards" ON cards;
DROP POLICY IF EXISTS "Users can delete cards in own boards" ON cards;
DROP POLICY IF EXISTS "Users can view cards in accessible boards" ON cards;
DROP POLICY IF EXISTS "Users can create cards in accessible boards" ON cards;
DROP POLICY IF EXISTS "Users can update cards in accessible boards" ON cards;
DROP POLICY IF EXISTS "Users can delete cards in accessible boards" ON cards;

-- Policy: Users can view cards in accessible boards
CREATE POLICY "Users can view cards in accessible boards" ON cards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = cards.list_id 
      AND user_has_board_access(lists.board_id)
    )
  );

-- Policy: Users can create cards in accessible boards
CREATE POLICY "Users can create cards in accessible boards" ON cards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = cards.list_id 
      AND user_has_board_access(lists.board_id)
    )
  );

-- Policy: Users can update cards in accessible boards
CREATE POLICY "Users can update cards in accessible boards" ON cards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = cards.list_id 
      AND user_has_board_access(lists.board_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = cards.list_id 
      AND user_has_board_access(lists.board_id)
    )
  );

-- Policy: Users can delete cards in accessible boards
CREATE POLICY "Users can delete cards in accessible boards" ON cards
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = cards.list_id 
      AND user_has_board_access(lists.board_id)
    )
  );

-- =============================================
-- RLS POLICIES FOR BOARD_MEMBERS
-- =============================================

DROP POLICY IF EXISTS "Users can view board members" ON board_members;
DROP POLICY IF EXISTS "Owners can add board members" ON board_members;
DROP POLICY IF EXISTS "Owners can remove board members" ON board_members;
DROP POLICY IF EXISTS "Users can join boards via invite" ON board_members;

-- Policy: Users can view members of boards they have access to
CREATE POLICY "Users can view board members" ON board_members
  FOR SELECT
  USING (user_has_board_access(board_id));

-- Policy: Only board owners can add members
CREATE POLICY "Owners can add board members" ON board_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = board_members.board_id 
      AND boards.user_id = auth.uid()
    )
    OR 
    -- Allow users to add themselves (for join via invite)
    (auth.uid() = user_id AND role = 'member')
  );

-- Policy: Only board owners can remove members (or members can leave)
CREATE POLICY "Owners can remove board members" ON board_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = board_members.board_id 
      AND boards.user_id = auth.uid()
    )
    OR
    -- Members can remove themselves (leave board)
    auth.uid() = user_id
  );

-- =============================================
-- RLS POLICIES FOR BOARD_INVITES
-- =============================================

DROP POLICY IF EXISTS "Owners can view board invites" ON board_invites;
DROP POLICY IF EXISTS "Anyone can view invite by code" ON board_invites;
DROP POLICY IF EXISTS "Owners can create board invites" ON board_invites;
DROP POLICY IF EXISTS "Owners can update board invites" ON board_invites;
DROP POLICY IF EXISTS "Users can increment invite uses" ON board_invites;
DROP POLICY IF EXISTS "Owners can delete board invites" ON board_invites;

-- Policy: Anyone can view invites (for joining)
CREATE POLICY "Anyone can view invites" ON board_invites
  FOR SELECT
  USING (true);

-- Policy: Only board owners can create invites
CREATE POLICY "Owners can create board invites" ON board_invites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = board_invites.board_id 
      AND boards.user_id = auth.uid()
    )
  );

-- Policy: Anyone can update invites (for incrementing uses)
CREATE POLICY "Anyone can update invite uses" ON board_invites
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Only board owners can delete invites
CREATE POLICY "Owners can delete board invites" ON board_invites
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = board_invites.board_id 
      AND boards.user_id = auth.uid()
    )
  );

-- =============================================
-- TRIGGER: Auto-add owner to board_members when board is created
-- =============================================

CREATE OR REPLACE FUNCTION add_board_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO board_members (board_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_board_created ON boards;
CREATE TRIGGER on_board_created
  AFTER INSERT ON boards
  FOR EACH ROW
  EXECUTE FUNCTION add_board_owner_as_member();

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

-- If you see this without errors, the schema is set up correctly!
-- You can now use the Trello Clone application with team collaboration!
