import { useState } from 'react';
import type { Card as CardType } from '../../types/database';
import { Button } from '../ui/Button';

interface CardModalProps {
    card: CardType;
    onClose: () => void;
    onUpdate: (updates: { title?: string; description?: string }) => void;
    onDelete: () => void;
}

export function CardModal({ card, onClose, onUpdate, onDelete }: CardModalProps) {
    const [title, setTitle] = useState(card.title);
    const [description, setDescription] = useState(card.description || '');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleTitleSave = () => {
        if (title.trim() && title !== card.title) {
            onUpdate({ title: title.trim() });
        }
        setIsEditingTitle(false);
    };

    const handleDescriptionSave = () => {
        if (description !== (card.description || '')) {
            onUpdate({ description: description || undefined });
        }
        setIsEditingDescription(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent, saveFunc: () => void) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveFunc();
        }
        if (e.key === 'Escape') {
            setTitle(card.title);
            setDescription(card.description || '');
            setIsEditingTitle(false);
            setIsEditingDescription(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
            <div className="w-full max-w-2xl bg-slate-800 border border-slate-700 rounded-xl shadow-2xl animate-slideUp">
                {/* Header */}
                <div className="flex items-start gap-4 p-6 border-b border-slate-700">
                    <div className="flex-shrink-0 p-2 bg-slate-700 rounded-lg">
                        <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        {isEditingTitle ? (
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleTitleSave}
                                onKeyDown={(e) => handleKeyDown(e, handleTitleSave)}
                                className="w-full px-2 py-1 -ml-2 bg-slate-700 border border-slate-600 rounded text-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                autoFocus
                            />
                        ) : (
                            <h2
                                onClick={() => setIsEditingTitle(true)}
                                className="text-lg font-semibold text-white cursor-pointer hover:bg-slate-700/50 rounded px-2 py-1 -ml-2 transition-colors"
                            >
                                {card.title}
                            </h2>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Description */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                            Description
                        </label>
                        {isEditingDescription ? (
                            <div className="space-y-2">
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onBlur={handleDescriptionSave}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            setDescription(card.description || '');
                                            setIsEditingDescription(false);
                                        }
                                    }}
                                    placeholder="Add a more detailed description..."
                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    rows={4}
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleDescriptionSave}>
                                        Save
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            setDescription(card.description || '');
                                            setIsEditingDescription(false);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => setIsEditingDescription(true)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${description
                                    ? 'bg-slate-700/30 hover:bg-slate-700/50 text-slate-300'
                                    : 'bg-slate-700/50 hover:bg-slate-700 text-slate-400'
                                    }`}
                            >
                                {description || 'Add a more detailed description...'}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-700">
                        {showDeleteConfirm ? (
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-slate-400">Delete this card?</span>
                                <Button size="sm" variant="danger" onClick={onDelete}>
                                    Delete
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Card
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
