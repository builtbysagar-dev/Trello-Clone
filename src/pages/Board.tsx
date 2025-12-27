import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { supabase } from '../lib/supabase';
import type { Board as BoardType, List as ListType, Card as CardType } from '../types/database';
import { Header } from '../components/layout/Header';
import { List } from '../components/board/List';
import { Card } from '../components/board/Card';
import { CardModal } from '../components/board/CardModal';
import { AddForm } from '../components/board/AddForm';
import { Spinner } from '../components/ui/Spinner';

export function Board() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [board, setBoard] = useState<BoardType | null>(null);
    const [lists, setLists] = useState<ListType[]>([]);
    const [cards, setCards] = useState<CardType[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCard, setActiveCard] = useState<CardType | null>(null);
    const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [boardTitle, setBoardTitle] = useState('');

    // Configure sensors for drag detection
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px movement required before drag starts
            },
        })
    );

    // Fetch board data
    useEffect(() => {
        if (id) {
            fetchBoardData();
        }
    }, [id]);

    const fetchBoardData = async () => {
        setLoading(true);

        // Fetch board
        const { data: boardData, error: boardError } = await supabase
            .from('boards')
            .select('*')
            .eq('id', id)
            .single();

        if (boardError || !boardData) {
            console.error('Error fetching board:', boardError);
            navigate('/dashboard');
            return;
        }

        setBoard(boardData);
        setBoardTitle(boardData.title);

        // Fetch lists
        const { data: listsData, error: listsError } = await supabase
            .from('lists')
            .select('*')
            .eq('board_id', id)
            .order('position');

        if (listsError) {
            console.error('Error fetching lists:', listsError);
        } else {
            setLists(listsData || []);
        }

        // Fetch cards for all lists
        const { data: cardsData, error: cardsError } = await supabase
            .from('cards')
            .select('*')
            .in('list_id', (listsData || []).map((l) => l.id))
            .order('position');

        if (cardsError) {
            console.error('Error fetching cards:', cardsError);
        } else {
            setCards(cardsData || []);
        }

        setLoading(false);
    };

    // Get cards for a specific list
    const getCardsForList = useCallback(
        (listId: string) => cards.filter((c) => c.list_id === listId).sort((a, b) => a.position - b.position),
        [cards]
    );

    // Board title update
    const handleBoardTitleSave = async () => {
        if (boardTitle.trim() && boardTitle !== board?.title && board) {
            await supabase.from('boards').update({ title: boardTitle.trim() }).eq('id', board.id);
            setBoard({ ...board, title: boardTitle.trim() });
        }
        setIsEditingTitle(false);
    };

    // List operations
    const handleAddList = async (title: string) => {
        if (!id) return;
        const newPosition = lists.length;

        const { data, error } = await supabase
            .from('lists')
            .insert({ board_id: id, title, position: newPosition })
            .select()
            .single();

        if (error) {
            console.error('Error creating list:', error);
        } else if (data) {
            setLists([...lists, data]);
        }
    };

    const handleRenameList = async (listId: string, newTitle: string) => {
        const { error } = await supabase.from('lists').update({ title: newTitle }).eq('id', listId);

        if (error) {
            console.error('Error renaming list:', error);
        } else {
            setLists(lists.map((l) => (l.id === listId ? { ...l, title: newTitle } : l)));
        }
    };

    const handleDeleteList = async (listId: string) => {
        const { error } = await supabase.from('lists').delete().eq('id', listId);

        if (error) {
            console.error('Error deleting list:', error);
        } else {
            setLists(lists.filter((l) => l.id !== listId));
            setCards(cards.filter((c) => c.list_id !== listId));
        }
    };

    // Card operations
    const handleAddCard = async (listId: string, title: string) => {
        const listCards = getCardsForList(listId);
        const newPosition = listCards.length;

        const { data, error } = await supabase
            .from('cards')
            .insert({ list_id: listId, title, position: newPosition })
            .select()
            .single();

        if (error) {
            console.error('Error creating card:', error);
        } else if (data) {
            setCards([...cards, data]);
        }
    };

    const handleUpdateCard = async (cardId: string, updates: { title?: string; description?: string | null }) => {
        const { error } = await supabase.from('cards').update(updates).eq('id', cardId);

        if (error) {
            console.error('Error updating card:', error);
        } else {
            setCards(cards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)));
            if (selectedCard?.id === cardId) {
                setSelectedCard({ ...selectedCard, ...updates });
            }
        }
    };

    const handleDeleteCard = async (cardId: string) => {
        const { error } = await supabase.from('cards').delete().eq('id', cardId);

        if (error) {
            console.error('Error deleting card:', error);
        } else {
            setCards(cards.filter((c) => c.id !== cardId));
            setSelectedCard(null);
        }
    };

    // Drag and drop handlers
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const card = cards.find((c) => c.id === active.id);
        if (card) {
            setActiveCard(card);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeCard = cards.find((c) => c.id === active.id);
        if (!activeCard) return;

        // Check if hovering over a different list
        const overList = lists.find((l) => l.id === over.id);
        const overCard = cards.find((c) => c.id === over.id);

        let targetListId: string | null = null;

        if (overList) {
            targetListId = overList.id;
        } else if (overCard) {
            targetListId = overCard.list_id;
        }

        if (targetListId && targetListId !== activeCard.list_id) {
            // Move card to different list (optimistically)
            setCards((prevCards) =>
                prevCards.map((c) =>
                    c.id === activeCard.id ? { ...c, list_id: targetListId! } : c
                )
            );
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveCard(null);

        if (!over) return;

        const activeCard = cards.find((c) => c.id === active.id);
        if (!activeCard) return;

        // Determine the target list
        const overList = lists.find((l) => l.id === over.id);
        const overCard = cards.find((c) => c.id === over.id);

        let targetListId = activeCard.list_id;

        if (overList) {
            targetListId = overList.id;
        } else if (overCard) {
            targetListId = overCard.list_id;
        }

        // Get cards in target list
        const targetListCards = cards
            .filter((c) => c.list_id === targetListId)
            .sort((a, b) => a.position - b.position);

        // Calculate new position
        let newPosition = 0;

        if (overCard && overCard.id !== activeCard.id) {
            const overIndex = targetListCards.findIndex((c) => c.id === overCard.id);
            const activeIndex = targetListCards.findIndex((c) => c.id === activeCard.id);

            if (activeIndex !== -1) {
                // Same list reorder
                const reorderedCards = arrayMove(targetListCards, activeIndex, overIndex);

                // Update positions
                const updates = reorderedCards.map((card, index) => ({
                    id: card.id,
                    position: index,
                }));

                // Optimistic update
                setCards((prevCards) => {
                    const otherCards = prevCards.filter((c) => c.list_id !== targetListId);
                    const updatedCards = reorderedCards.map((c, i) => ({ ...c, position: i }));
                    return [...otherCards, ...updatedCards];
                });

                // Persist to database
                for (const update of updates) {
                    await supabase.from('cards').update({ position: update.position }).eq('id', update.id);
                }
            } else {
                // Moving to new list
                newPosition = overIndex;
            }
        } else if (overList) {
            // Dropping on empty list or at end of list
            newPosition = targetListCards.filter((c) => c.id !== activeCard.id).length;
        }

        // If card moved to a different list
        if (targetListId !== activeCard.list_id || !overCard) {
            // Get cards in target list without the active card
            const targetCards = cards
                .filter((c) => c.list_id === targetListId && c.id !== activeCard.id)
                .sort((a, b) => a.position - b.position);

            // Insert at new position
            const updatedCards = [
                ...targetCards.slice(0, newPosition),
                { ...activeCard, list_id: targetListId, position: newPosition },
                ...targetCards.slice(newPosition),
            ].map((c, i) => ({ ...c, position: i }));

            // Optimistic update for target list
            setCards((prevCards) => {
                const otherCards = prevCards.filter(
                    (c) => c.list_id !== targetListId && c.id !== activeCard.id
                );
                return [...otherCards, ...updatedCards];
            });

            // Also update old list positions
            const oldListCards = cards
                .filter((c) => c.list_id === activeCard.list_id && c.id !== activeCard.id)
                .sort((a, b) => a.position - b.position)
                .map((c, i) => ({ ...c, position: i }));

            if (targetListId !== activeCard.list_id) {
                setCards((prevCards) => {
                    const others = prevCards.filter(
                        (c) => c.list_id !== activeCard.list_id || c.id === activeCard.id
                    );
                    return [...others, ...oldListCards];
                });
            }

            // Persist changes
            await supabase
                .from('cards')
                .update({ list_id: targetListId, position: newPosition })
                .eq('id', activeCard.id);

            // Update other card positions in target list
            for (const card of updatedCards) {
                if (card.id !== activeCard.id) {
                    await supabase.from('cards').update({ position: card.position }).eq('id', card.id);
                }
            }

            // Update old list positions
            if (targetListId !== activeCard.list_id) {
                for (const card of oldListCards) {
                    await supabase.from('cards').update({ position: card.position }).eq('id', card.id);
                }
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!board) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            <Header title={board.title} showBackButton />

            {/* Board header */}
            <div className="px-4 sm:px-6 lg:px-8 py-4">
                {isEditingTitle ? (
                    <input
                        type="text"
                        value={boardTitle}
                        onChange={(e) => setBoardTitle(e.target.value)}
                        onBlur={handleBoardTitleSave}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleBoardTitleSave();
                            if (e.key === 'Escape') {
                                setBoardTitle(board.title);
                                setIsEditingTitle(false);
                            }
                        }}
                        className="text-2xl font-bold bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        autoFocus
                    />
                ) : (
                    <h1
                        onClick={() => setIsEditingTitle(true)}
                        className="text-2xl font-bold text-white cursor-pointer hover:bg-slate-800/50 rounded-lg px-3 py-1 -ml-3 inline-block transition-colors"
                    >
                        {board.title}
                    </h1>
                )}
            </div>

            {/* Board content - horizontal scroll */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 sm:px-6 lg:px-8 pb-4">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex gap-4 items-start h-full min-w-max">
                        {lists.map((list) => (
                            <List
                                key={list.id}
                                list={list}
                                cards={getCardsForList(list.id)}
                                onAddCard={(title) => handleAddCard(list.id, title)}
                                onCardClick={setSelectedCard}
                                onRename={(newTitle) => handleRenameList(list.id, newTitle)}
                                onDelete={() => handleDeleteList(list.id)}
                            />
                        ))}

                        {/* Add list button */}
                        <div className="flex-shrink-0 w-72">
                            <AddForm
                                placeholder="Enter list title..."
                                buttonText="Add a list"
                                onSubmit={handleAddList}
                                variant="list"
                            />
                        </div>
                    </div>

                    {/* Drag overlay */}
                    <DragOverlay>
                        {activeCard && (
                            <div className="opacity-90 rotate-3">
                                <Card card={activeCard} onClick={() => { }} isDragging />
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Card modal */}
            {selectedCard && (
                <CardModal
                    card={selectedCard}
                    onClose={() => setSelectedCard(null)}
                    onUpdate={(updates) => handleUpdateCard(selectedCard.id, updates)}
                    onDelete={() => handleDeleteCard(selectedCard.id)}
                />
            )}
        </div>
    );
}
