import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card as CardType } from '../../types/database';

interface CardProps {
    card: CardType;
    onClick: () => void;
    isDragging?: boolean;
}

export function Card({ card, onClick, isDragging = false }: CardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({ id: card.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const actualIsDragging = isDragging || isSortableDragging;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={`group p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-slate-500 rounded-lg cursor-pointer transition-all duration-200 ${actualIsDragging ? 'opacity-50 shadow-2xl ring-2 ring-primary-500' : ''
                }`}
        >
            <p className="text-sm text-white font-medium mb-1">{card.title}</p>
            {card.description && (
                <div className="flex items-center gap-1 text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                </div>
            )}
        </div>
    );
}
