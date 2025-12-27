import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Board } from '../types/database';
import { Header } from '../components/layout/Header';
import { BoardCard } from '../components/board/BoardCard';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';

export function Dashboard() {
    const { user } = useAuth();
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
    const [boardTitle, setBoardTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch boards on mount
    useEffect(() => {
        fetchBoards();
    }, [user]);

    const fetchBoards = async () => {
        if (!user) return;

        setLoading(true);
        const { data, error } = await supabase
            .from('boards')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching boards:', error);
        } else {
            setBoards(data || []);
        }
        setLoading(false);
    };

    const handleCreateBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!boardTitle.trim() || !user) return;

        setIsSubmitting(true);
        const { data, error } = await supabase
            .from('boards')
            .insert({ title: boardTitle.trim(), user_id: user.id })
            .select()
            .single();

        if (error) {
            console.error('Error creating board:', error);
        } else if (data) {
            setBoards([data, ...boards]);
            setShowCreateModal(false);
            setBoardTitle('');
        }
        setIsSubmitting(false);
    };

    const handleRenameBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!boardTitle.trim() || !selectedBoard) return;

        setIsSubmitting(true);
        const { error } = await supabase
            .from('boards')
            .update({ title: boardTitle.trim() })
            .eq('id', selectedBoard.id);

        if (error) {
            console.error('Error renaming board:', error);
        } else {
            setBoards(boards.map(b =>
                b.id === selectedBoard.id ? { ...b, title: boardTitle.trim() } : b
            ));
            setShowRenameModal(false);
            setBoardTitle('');
            setSelectedBoard(null);
        }
        setIsSubmitting(false);
    };

    const handleDeleteBoard = async () => {
        if (!selectedBoard) return;

        setIsSubmitting(true);
        const { error } = await supabase
            .from('boards')
            .delete()
            .eq('id', selectedBoard.id);

        if (error) {
            console.error('Error deleting board:', error);
        } else {
            setBoards(boards.filter(b => b.id !== selectedBoard.id));
            setShowDeleteModal(false);
            setSelectedBoard(null);
        }
        setIsSubmitting(false);
    };

    const openRenameModal = (board: Board) => {
        setSelectedBoard(board);
        setBoardTitle(board.title);
        setShowRenameModal(true);
    };

    const openDeleteModal = (board: Board) => {
        setSelectedBoard(board);
        setShowDeleteModal(true);
    };

    return (
        <div className="min-h-screen bg-slate-950">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">My Boards</h1>
                        <p className="text-slate-400 mt-1">Organize your projects and tasks</p>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Board
                    </Button>
                </div>

                {/* Boards grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Spinner size="lg" />
                    </div>
                ) : boards.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800 rounded-2xl mb-6">
                            <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">No boards yet</h2>
                        <p className="text-slate-400 mb-6">Create your first board to get started</p>
                        <Button onClick={() => setShowCreateModal(true)}>
                            Create a Board
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {boards.map((board) => (
                            <BoardCard
                                key={board.id}
                                board={board}
                                onRename={openRenameModal}
                                onDelete={openDeleteModal}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Create Board Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => { setShowCreateModal(false); setBoardTitle(''); }}
                title="Create New Board"
            >
                <form onSubmit={handleCreateBoard} className="space-y-4">
                    <Input
                        label="Board Title"
                        placeholder="Enter board title..."
                        value={boardTitle}
                        onChange={(e) => setBoardTitle(e.target.value)}
                        autoFocus
                    />
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => { setShowCreateModal(false); setBoardTitle(''); }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isSubmitting}>
                            Create Board
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Rename Board Modal */}
            <Modal
                isOpen={showRenameModal}
                onClose={() => { setShowRenameModal(false); setBoardTitle(''); setSelectedBoard(null); }}
                title="Rename Board"
            >
                <form onSubmit={handleRenameBoard} className="space-y-4">
                    <Input
                        label="Board Title"
                        placeholder="Enter new title..."
                        value={boardTitle}
                        onChange={(e) => setBoardTitle(e.target.value)}
                        autoFocus
                    />
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => { setShowRenameModal(false); setBoardTitle(''); setSelectedBoard(null); }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isSubmitting}>
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Board Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); setSelectedBoard(null); }}
                title="Delete Board"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-slate-300">
                        Are you sure you want to delete <strong className="text-white">"{selectedBoard?.title}"</strong>?
                        This will permanently delete all lists and cards in this board.
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => { setShowDeleteModal(false); setSelectedBoard(null); }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="danger"
                            onClick={handleDeleteBoard}
                            isLoading={isSubmitting}
                        >
                            Delete Board
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
