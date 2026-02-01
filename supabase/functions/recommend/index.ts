// Edge Function: recommend
// Recommends top 3 candidates for a given position based on skill similarity

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Job requirements for recommendation algorithm
const JOB_REQUIREMENTS: Record<string, string[]> = {
    "Frontend Developer": ["React", "TypeScript", "JavaScript", "CSS", "HTML", "Vue.js", "Angular"],
    "Backend Developer": ["Node.js", "Python", "Java", "SQL", "REST API", "Docker", "MongoDB"],
    "Full Stack Developer": ["React", "Node.js", "TypeScript", "SQL", "Docker", "MongoDB", "AWS"],
    "Data Scientist": ["Python", "SQL", "Machine Learning", "TensorFlow", "Pandas", "R", "Statistics"],
    "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Terraform", "Jenkins"],
    "Mobile Developer": ["React Native", "TypeScript", "iOS", "Android", "REST API", "Swift", "Kotlin"],
    "UI/UX Designer": ["Figma", "Sketch", "Adobe XD", "CSS", "User Research", "Prototyping"],
    "QA Engineer": ["Selenium", "Jest", "Cypress", "Manual Testing", "API Testing", "SQL"],
};

interface Candidate {
    id: string;
    full_name: string;
    applied_position: string;
    skills: string[];
    status: string;
    resume_url: string | null;
    matching_score: number;
    created_at: string;
}

function calculateSimilarityScore(position: string, candidateSkills: string[]): number {
    // Find matching job requirements
    const matchingJob = Object.entries(JOB_REQUIREMENTS).find(([job]) =>
        position.toLowerCase().includes(job.toLowerCase()) ||
        job.toLowerCase().includes(position.toLowerCase())
    );

    let requiredSkills: string[];

    if (matchingJob) {
        requiredSkills = matchingJob[1];
    } else {
        // Extract keywords from position
        const keywords = position.toLowerCase().split(/[\s,\-\/]+/);
        requiredSkills = [];

        // Match with known skills from all jobs
        const allSkills = Object.values(JOB_REQUIREMENTS).flat();
        for (const skill of allSkills) {
            if (keywords.some(kw => skill.toLowerCase().includes(kw) || kw.includes(skill.toLowerCase()))) {
                requiredSkills.push(skill);
            }
        }

        if (requiredSkills.length === 0) {
            // Default to common skills
            requiredSkills = ["JavaScript", "Python", "SQL", "Communication"];
        }
    }

    // Calculate Jaccard similarity with weighted matching
    const candidateSkillsLower = candidateSkills.map(s => s.toLowerCase());
    let matchedCount = 0;
    let partialMatchCount = 0;

    for (const required of requiredSkills) {
        const reqLower = required.toLowerCase();

        // Exact match
        if (candidateSkillsLower.includes(reqLower)) {
            matchedCount += 1;
        }
        // Partial match (e.g., "React" matches "React Native")
        else if (candidateSkillsLower.some(s => s.includes(reqLower) || reqLower.includes(s))) {
            partialMatchCount += 0.5;
        }
    }

    const totalScore = matchedCount + partialMatchCount;
    const maxPossible = requiredSkills.length;

    // Calculate percentage score (0-100)
    return Math.round((totalScore / maxPossible) * 100);
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            {
                global: {
                    headers: { Authorization: req.headers.get("Authorization")! },
                },
            }
        );

        // Get current user
        const {
            data: { user },
            error: authError,
        } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Parse request body
        const body = await req.json();
        const { position } = body;

        if (!position || typeof position !== "string") {
            return new Response(
                JSON.stringify({ error: "Position is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Fetch all candidates for this user
        const { data: candidates, error: fetchError } = await supabaseClient
            .from("candidates")
            .select("*")
            .eq("user_id", user.id);

        if (fetchError) {
            return new Response(
                JSON.stringify({ error: fetchError.message }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const allCandidates = (candidates as Candidate[]) || [];

        // Calculate similarity scores for each candidate
        const scoredCandidates = allCandidates.map(candidate => ({
            ...candidate,
            similarity_score: calculateSimilarityScore(position, candidate.skills || []),
        }));

        // Sort by similarity score (descending) and get top 3
        const recommendations = scoredCandidates
            .filter(c => c.similarity_score > 0)
            .sort((a, b) => {
                // Primary sort: similarity score
                if (b.similarity_score !== a.similarity_score) {
                    return b.similarity_score - a.similarity_score;
                }
                // Secondary sort: matching score
                if (b.matching_score !== a.matching_score) {
                    return b.matching_score - a.matching_score;
                }
                // Tertiary sort: newer candidates first
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            })
            .slice(0, 3);

        return new Response(
            JSON.stringify({
                position,
                recommendations,
                total_candidates_analyzed: allCandidates.length,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
