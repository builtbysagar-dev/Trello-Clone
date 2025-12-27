import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { BoardMember } from '../../types/database';
import { Spinner } from '../ui/Spinner';

interface MembersListProps {
    boardId: string;
    ownerId: string;
    onMemberRemoved?: () => void;
}

interface MemberWithEmail extends BoardMember {
    email?: string;
}

export function MembersList({ boardId, ownerId, onMemberRemoved }: MembersListProps) {
    const { user } = useAuth();
    const [members, setMembers] = useState<MemberWithEmail[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<string | null>(null);

    const isOwner = user?.id === ownerId;

    useEffect(() => {
        fetchMembers();
    }, [boardId]);

    const fetchMembers = async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from('board_members')
            .select('*')
            .eq('board_id', boardId)
            .order('joined_at', { ascending: true });

        if (error) {
            console.error('Error fetching members:', error);
        } else {
            setMembers(data || []);
        }

        setLoading(false);
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!isOwner) return;

        setRemovingId(memberId);

        const { error } = await supabase
            .from('board_members')
            .delete()
            .eq('id', memberId);

        if (error) {
            console.error('Error removing member:', error);
        } else {
            setMembers(members.filter(m => m.id !== memberId));
            onMemberRemoved?.();
        }

        setRemovingId(null);
    };

    // Get initials from email
    const getInitials = (email?: string): string => {
        if (!email) return '?';
        return email.charAt(0).toUpperCase();
    };

    // Get avatar color based on user id
    const getAvatarColor = (userId: string): string => {
        const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-orange-500',
            'bg-pink-500',
            'bg-cyan-500',
            'bg-amber-500',
            'bg-rose-500',
        ];
        const index = userId.charCodeAt(0) % colors.length;
        return colors[index];
    };

    if (loading) {
        return (
            <div className="flex justify-center py-2">
                <Spinner size="sm" />
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1">
            {members.slice(0, 5).map((member) => (
                <div
                    key={member.id}
                    className="group relative"
                >
                    <div
                        className={`w-8 h-8 rounded-full ${getAvatarColor(member.user_id)} flex items-center justify-center text-white text-sm font-medium ring-2 ring-slate-800`}
                        title={member.user_id}
                    >
                        {getInitials(member.email || member.user_id)}
                    </div>

                    {/* Role badge for owner */}
                    {member.role === 'owner' && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </div>
                    )}

                    {/* Remove button (visible on hover for owner, for non-owner members) */}
                    {isOwner && member.role !== 'owner' && (
                        <button
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={removingId === member.id}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex"
                        >
                            {removingId === member.id ? (
                                <Spinner size="sm" />
                            ) : (
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>
                    )}
                </div>
            ))}

            {/* Show +X if more than 5 members */}
            {members.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-medium ring-2 ring-slate-800">
                    +{members.length - 5}
                </div>
            )}
        </div>
    );
}
