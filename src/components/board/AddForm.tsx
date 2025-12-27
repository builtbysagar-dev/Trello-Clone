import React, { useState, useRef, useEffect } from 'react';

interface AddFormProps {
    placeholder: string;
    buttonText: string;
    onSubmit: (value: string) => void;
    onCancel?: () => void;
    isOpen?: boolean;
    variant?: 'list' | 'card';
}

export function AddForm({
    placeholder,
    buttonText,
    onSubmit,
    onCancel,
    isOpen: controlledIsOpen,
    variant = 'card',
}: AddFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    const actualIsOpen = controlledIsOpen !== undefined ? controlledIsOpen : isOpen;

    useEffect(() => {
        if (actualIsOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [actualIsOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim()) {
            onSubmit(value.trim());
            setValue('');
            if (controlledIsOpen === undefined) {
                setIsOpen(false);
            }
        }
    };

    const handleCancel = () => {
        setValue('');
        if (controlledIsOpen === undefined) {
            setIsOpen(false);
        }
        onCancel?.();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (!actualIsOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors ${variant === 'list' ? 'bg-slate-800/50 border border-dashed border-slate-700' : ''
                    }`}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>{buttonText}</span>
            </button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-2">
            {variant === 'card' ? (
                <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows={2}
                />
            ) : (
                <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
            )}
            <div className="flex items-center gap-2">
                <button
                    type="submit"
                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    Add
                </button>
                <button
                    type="button"
                    onClick={handleCancel}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </form>
    );
}
