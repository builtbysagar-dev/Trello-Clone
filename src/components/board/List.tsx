import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { List as ListType, Card as CardType } from '../../types/database';
import { Card } from './Card';
import { AddForm } from './AddForm';

interface ListProps {
    list: ListType;
    cards: CardType[];
    onAddCard: (title: string) => void;
    onCardClick: (card: CardType) => void;
    onRename: (newTitle: string) => void;
    onDelete: () => void;
}

export function List({
    list,
    cards,
    onAddCard,
    onCardClick,
    onRename,
    onDelete,
}: ListProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(list.title);
    const [showMenu, setShowMenu] = useState(false);

    const { setNodeRef, isOver } = useDroppable({
        id: list.id,
    });

    const handleTitleSave = () => {
        if (title.trim() && title !== list.title) {
            onRename(title.trim());
        } else {
            setTitle(list.title);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleTitleSave();
        }
        if (e.key === 'Escape') {
            setTitle(list.title);
            setIsEditing(false);
        }
    };

    return (
        <div
            className={`flex-shrink-0 w-72 flex flex-col max-h-full bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl transition-colors ${isOver ? 'ring-2 ring-primary-500 bg-slate-800' : ''
                }`}
        >
            {/* List header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
                {isEditing ? (
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={handleKeyDown}
                        className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        autoFocus
                    />
                ) : (
                    <h3
                        onClick={() => setIsEditing(true)}
                        className="text-sm font-semibold text-white cursor-pointer hover:bg-slate-700/50 rounded px-2 py-1 -ml-2 transition-colors"
                    >
                        {list.title}
                    </h3>
                )}

                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>

                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 top-full mt-1 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-20">
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        setIsEditing(true);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Rename
                                </button>
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        onDelete();
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Cards container */}
            <div
                ref={setNodeRef}
                className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[50px]"
            >
                <SortableContext
                    items={cards.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {cards.map((card) => (
                        <Card key={card.id} card={card} onClick={() => onCardClick(card)} />
                    ))}
                </SortableContext>
            </div>

            {/* Add card form */}
            <div className="p-2 border-t border-slate-700/50">
                <AddForm
                    placeholder="Enter a title for this card..."
                    buttonText="Add a card"
                    onSubmit={onAddCard}
                    variant="card"
                />
            </div>
        </div>
    );
}
