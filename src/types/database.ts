// Database types for Supabase tables

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

// Extended types with nested data
export interface ListWithCards extends List {
    cards: Card[];
}

export interface BoardWithLists extends Board {
    lists: ListWithCards[];
}

// Form data types
export interface CreateBoardData {
    title: string;
}

export interface CreateListData {
    board_id: string;
    title: string;
    position: number;
}

export interface CreateCardData {
    list_id: string;
    title: string;
    position: number;
    description?: string;
}

export interface UpdateCardData {
    title?: string;
    description?: string | null;
    list_id?: string;
    position?: number;
}

export interface UpdateListData {
    title?: string;
    position?: number;
}
