import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Candidate, CandidateFormData, CandidateStatus } from '../types';
import { useAuth } from './useAuth';

export function useCandidates() {
    const { user, session } = useAuth();
    const [uploading, setUploading] = useState(false);

    // Upload resume to Supabase Storage
    const uploadResume = async (file: File): Promise<string | null> => {
        if (!user) return null;

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(fileName, file);

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return null;
        }

        const { data } = supabase.storage.from('resumes').getPublicUrl(fileName);
        return data.publicUrl;
    };

    // Add candidate via Edge Function
    const addCandidate = async (formData: CandidateFormData): Promise<{ data: Candidate | null; error: string | null }> => {
        if (!user || !session) {
            return { data: null, error: 'Not authenticated' };
        }

        setUploading(true);

        try {
            // Upload resume first
            let resumeUrl: string | null = null;
            if (formData.resume) {
                resumeUrl = await uploadResume(formData.resume);
                if (!resumeUrl) {
                    return { data: null, error: 'Failed to upload resume' };
                }
            }

            // Call Edge Function
            const { data, error } = await supabase.functions.invoke('add-candidate', {
                body: {
                    full_name: formData.full_name,
                    applied_position: formData.applied_position,
                    skills: formData.skills,
                    resume_url: resumeUrl,
                },
            });

            if (error) {
                return { data: null, error: error.message };
            }

            return { data: data.candidate, error: null };
        } catch (err) {
            return { data: null, error: (err as Error).message };
        } finally {
            setUploading(false);
        }
    };

    // Update candidate status
    const updateStatus = async (id: string, status: CandidateStatus): Promise<{ error: string | null }> => {
        const { error } = await supabase
            .from('candidates')
            .update({ status })
            .eq('id', id);

        if (error) {
            return { error: error.message };
        }
        return { error: null };
    };

    // Delete candidate
    const deleteCandidate = async (id: string): Promise<{ error: string | null }> => {
        const { error } = await supabase
            .from('candidates')
            .delete()
            .eq('id', id);

        if (error) {
            return { error: error.message };
        }
        return { error: null };
    };

    // Get analytics from Edge Function
    const getAnalytics = useCallback(async () => {
        const { data, error } = await supabase.functions.invoke('analytics');
        if (error) {
            console.error('Analytics error:', error);
            return null;
        }
        return data;
    }, []);

    // Get recommendations from Edge Function
    const getRecommendations = useCallback(async (position: string) => {
        const { data, error } = await supabase.functions.invoke('recommend', {
            body: { position },
        });
        if (error) {
            console.error('Recommendations error:', error);
            return [];
        }
        return data.recommendations || [];
    }, []);

    return {
        uploading,
        addCandidate,
        updateStatus,
        deleteCandidate,
        getAnalytics,
        getRecommendations,
    };
}
