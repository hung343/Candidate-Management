// Edge Function: add-candidate
// Handles adding new candidates with validation and matching score calculation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Job requirements for matching score calculation
const JOB_REQUIREMENTS: Record<string, string[]> = {
    "Frontend Developer": ["React", "TypeScript", "JavaScript", "CSS", "HTML"],
    "Backend Developer": ["Node.js", "Python", "SQL", "REST API", "Docker"],
    "Full Stack Developer": ["React", "Node.js", "TypeScript", "SQL", "Docker"],
    "Data Scientist": ["Python", "SQL", "Machine Learning", "TensorFlow", "Pandas"],
    "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux"],
    "Mobile Developer": ["React Native", "TypeScript", "iOS", "Android", "REST API"],
};

function calculateMatchingScore(position: string, skills: string[]): number {
    // Find matching job requirements
    const requirements = Object.entries(JOB_REQUIREMENTS).find(([job]) =>
        position.toLowerCase().includes(job.toLowerCase()) ||
        job.toLowerCase().includes(position.toLowerCase())
    );

    if (!requirements) {
        // Default: calculate based on skill count
        return Math.min(skills.length * 10, 100);
    }

    const [, requiredSkills] = requirements;
    const skillsLower = skills.map((s) => s.toLowerCase());
    const matchedSkills = requiredSkills.filter((req) =>
        skillsLower.some((skill) =>
            skill.includes(req.toLowerCase()) || req.toLowerCase().includes(skill)
        )
    );

    return Math.round((matchedSkills.length / requiredSkills.length) * 100);
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
        const { full_name, applied_position, skills, resume_url } = body;

        // Validate required fields
        if (!full_name || typeof full_name !== "string" || full_name.trim().length === 0) {
            return new Response(
                JSON.stringify({ error: "Full name is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!applied_position || typeof applied_position !== "string" || applied_position.trim().length === 0) {
            return new Response(
                JSON.stringify({ error: "Applied position is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Validate skills array
        const validSkills = Array.isArray(skills)
            ? skills.filter((s) => typeof s === "string" && s.trim().length > 0)
            : [];

        // Calculate matching score
        const matchingScore = calculateMatchingScore(applied_position, validSkills);

        // Insert candidate
        const { data: candidate, error: insertError } = await supabaseClient
            .from("candidates")
            .insert({
                user_id: user.id,
                full_name: full_name.trim(),
                applied_position: applied_position.trim(),
                skills: validSkills,
                resume_url: resume_url || null,
                matching_score: matchingScore,
                status: "New",
            })
            .select()
            .single();

        if (insertError) {
            console.error("Insert error:", insertError);
            return new Response(
                JSON.stringify({ error: insertError.message }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ candidate, matching_score: matchingScore }),
            { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
