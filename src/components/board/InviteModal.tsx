import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import type { BoardInvite } from '../../types/database';

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    boardId: string;
    boardTitle: string;
}

// Generate a random invite code (8 characters)
function generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export function InviteModal({ isOpen, onClose, boardId, boardTitle }: InviteModalProps) {
    const [invite, setInvite] = useState<BoardInvite | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    // Fetch or create invite on mount
    useEffect(() => {
        if (isOpen) {
            fetchInvite();
        }
    }, [isOpen, boardId]);

    const fetchInvite = async () => {
        setLoading(true);

        // Try to get existing invite
        const { data, error } = await supabase
            .from('board_invites')
            .select('*')
            .eq('board_id', boardId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching invite:', error);
        }

        if (data) {
            setInvite(data);
        }

        setLoading(false);
    };

    const generateNewInvite = async () => {
        setGenerating(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const inviteCode = generateInviteCode();

        const { data, error } = await supabase
            .from('board_invites')
            .insert({
                board_id: boardId,
                invite_code: inviteCode,
                created_by: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating invite:', error);
        } else if (data) {
            setInvite(data);
        }

        setGenerating(false);
    };

    const copyToClipboard = async () => {
        if (!invite) return;

        const inviteUrl = `${window.location.origin}/join/${invite.invite_code}`;

        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const inviteUrl = invite
        ? `${window.location.origin}/join/${invite.invite_code}`
        : '';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Invite to ${boardTitle}`} size="md">
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Spinner />
                    </div>
                ) : invite ? (
                    <>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">
                                Share this link to invite teammates
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={inviteUrl}
                                    className="flex-1 bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none"
                                />
                                <Button onClick={copyToClipboard} variant="secondary">
                                    {copied ? (
                                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-700">
                            <p className="text-xs text-slate-400 mb-3">
                                Uses: {invite.uses}{invite.max_uses ? ` / ${invite.max_uses}` : ''}
                            </p>
                            <Button
                                onClick={generateNewInvite}
                                variant="ghost"
                                size="sm"
                                isLoading={generating}
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Generate New Link
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700/50 rounded-full mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <p className="text-slate-300 mb-4">No invite link yet</p>
                        <Button onClick={generateNewInvite} isLoading={generating}>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Generate Invite Link
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
