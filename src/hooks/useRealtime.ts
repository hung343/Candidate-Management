import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Candidate } from '../types';
import { useAuth } from './useAuth';

export function useRealtime() {
    const { user } = useAuth();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch initial candidates
    const fetchCandidates = async () => {
        if (!user) return;

        setLoading(true);
        const { data, error } = await supabase
            .from('candidates')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching candidates:', error);
        } else {
            setCandidates(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!user) {
            setCandidates([]);
            setLoading(false);
            return;
        }

        fetchCandidates();

        // Subscribe to realtime changes
        const channel = supabase
            .channel('candidates-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'candidates',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setCandidates(prev => [payload.new as Candidate, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setCandidates(prev =>
                            prev.map(c => (c.id === payload.new.id ? payload.new as Candidate : c))
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setCandidates(prev => prev.filter(c => c.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return { candidates, loading, refetch: fetchCandidates };
}
