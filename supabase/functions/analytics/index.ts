// Edge Function: analytics
// Returns statistics about candidates

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

        const allCandidates = candidates || [];
        const totalCandidates = allCandidates.length;

        // Calculate status distribution
        const statusCounts: Record<string, number> = {};
        for (const candidate of allCandidates) {
            statusCounts[candidate.status] = (statusCounts[candidate.status] || 0) + 1;
        }

        const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count,
            percentage: totalCandidates > 0 ? Math.round((count / totalCandidates) * 100) : 0,
        }));

        // Calculate top 3 positions
        const positionCounts: Record<string, number> = {};
        for (const candidate of allCandidates) {
            positionCounts[candidate.applied_position] =
                (positionCounts[candidate.applied_position] || 0) + 1;
        }

        const topPositions = Object.entries(positionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([position, count]) => ({ position, count }));

        // Get candidates from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentCandidates = allCandidates
            .filter((c) => new Date(c.created_at) >= sevenDaysAgo)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const analytics = {
            total_candidates: totalCandidates,
            status_distribution: statusDistribution,
            top_positions: topPositions,
            recent_candidates: recentCandidates,
        };

        return new Response(
            JSON.stringify(analytics),
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
