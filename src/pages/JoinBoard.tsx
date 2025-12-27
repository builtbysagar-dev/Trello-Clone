import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

interface InviteInfo {
    board_id: string;
    board_title: string;
    invite_code: string;
    is_valid: boolean;
    already_member: boolean;
}

export function JoinBoard() {
    const { inviteCode } = useParams<{ inviteCode: string }>();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading) {
            fetchInviteInfo();
        }
    }, [inviteCode, authLoading, user]);

    const fetchInviteInfo = async () => {
        if (!inviteCode) {
            setError('Invalid invite link');
            setLoading(false);
            return;
        }

        setLoading(true);

        // Fetch invite details
        const { data: invite, error: inviteError } = await supabase
            .from('board_invites')
            .select('*, boards(id, title)')
            .eq('invite_code', inviteCode)
            .single();

        if (inviteError || !invite) {
            setError('This invite link is invalid or has expired');
            setLoading(false);
            return;
        }

        // Check if invite is still valid
        if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
            setError('This invite link has expired');
            setLoading(false);
            return;
        }

        if (invite.max_uses && invite.uses >= invite.max_uses) {
            setError('This invite link has reached its maximum uses');
            setLoading(false);
            return;
        }

        // Check if user is already a member
        let alreadyMember = false;
        if (user) {
            const { data: membership } = await supabase
                .from('board_members')
                .select('id')
                .eq('board_id', invite.board_id)
                .eq('user_id', user.id)
                .single();

            alreadyMember = !!membership;
        }

        const boardData = invite.boards as { id: string; title: string };

        setInviteInfo({
            board_id: invite.board_id,
            board_title: boardData?.title || 'Unknown Board',
            invite_code: invite.invite_code,
            is_valid: true,
            already_member: alreadyMember,
        });

        setLoading(false);
    };

    const handleJoin = async () => {
        if (!user || !inviteInfo) return;

        setJoining(true);

        // Add user as member
        const { error: memberError } = await supabase
            .from('board_members')
            .insert({
                board_id: inviteInfo.board_id,
                user_id: user.id,
                role: 'member',
            });

        if (memberError) {
            console.error('Error joining board:', memberError);
            setError('Failed to join board. Please try again.');
            setJoining(false);
            return;
        }

        // Increment invite uses
        await supabase
            .from('board_invites')
            .update({ uses: supabase.rpc('increment_uses', { invite_code: inviteInfo.invite_code }) })
            .eq('invite_code', inviteInfo.invite_code);

        // Navigate to the board
        navigate(`/board/${inviteInfo.board_id}`);
    };

    // Show loading state
    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/20 rounded-full mb-6">
                        <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Sign in to join</h1>
                    <p className="text-slate-400 mb-6">
                        You need to sign in to join this board
                    </p>
                    <div className="flex flex-col gap-3">
                        <Link to={`/login?redirect=/join/${inviteCode}`}>
                            <Button className="w-full">Sign In</Button>
                        </Link>
                        <Link to={`/signup?redirect=/join/${inviteCode}`}>
                            <Button variant="secondary" className="w-full">Create Account</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6">
                        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Invalid Invite</h1>
                    <p className="text-slate-400 mb-6">{error}</p>
                    <Link to="/dashboard">
                        <Button>Go to Dashboard</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Already a member
    if (inviteInfo?.already_member) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-6">
                        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">You're already a member!</h1>
                    <p className="text-slate-400 mb-6">
                        You already have access to <strong className="text-white">{inviteInfo.board_title}</strong>
                    </p>
                    <Link to={`/board/${inviteInfo.board_id}`}>
                        <Button>Open Board</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Show join prompt
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/20 rounded-full mb-6">
                    <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">You've been invited!</h1>
                <p className="text-slate-400 mb-6">
                    You've been invited to join <strong className="text-white">{inviteInfo?.board_title}</strong>
                </p>
                <Button onClick={handleJoin} isLoading={joining} className="w-full">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Join Board
                </Button>
            </div>
        </div>
    );
}
