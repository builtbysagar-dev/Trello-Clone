// Database types for Trello Clone

export interface Board {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
}

export interface List {
    id: string;
    board_id: string;
    title: string;
    position: number;
    created_at: string;
}

export interface Card {
    id: string;
    list_id: string;
    title: string;
    description: string | null;
    position: number;
    created_at: string;
}

export interface BoardMember {
    id: string;
    board_id: string;
    user_id: string;
    role: 'owner' | 'member';
    joined_at: string;
    // Joined user data (when fetched with user info)
    user_email?: string;
}

export interface BoardInvite {
    id: string;
    board_id: string;
    invite_code: string;
    created_by: string;
    expires_at: string | null;
    max_uses: number | null;
    uses: number;
    created_at: string;
}

// Extended Board type with member info
export interface BoardWithMembers extends Board {
    members?: BoardMember[];
    member_count?: number;
    is_owner?: boolean;
}
