import { Candidate, FilterOptions } from '../../types';
import { CandidateCard } from './CandidateCard';

interface CandidateListProps {
    candidates: Candidate[];
    filters: FilterOptions;
    loading: boolean;
}

export function CandidateList({ candidates, filters, loading }: CandidateListProps) {
    // Apply client-side filtering and searching
    const filteredCandidates = candidates.filter((candidate) => {
        // Status filter
        if (filters.status && candidate.status !== filters.status) {
            return false;
        }

        // Position filter
        if (filters.position && !candidate.applied_position.toLowerCase().includes(filters.position.toLowerCase())) {
            return false;
        }

        // Date range filter
        if (filters.dateFrom) {
            const candidateDate = new Date(candidate.created_at);
            const fromDate = new Date(filters.dateFrom);
            if (candidateDate < fromDate) return false;
        }

        if (filters.dateTo) {
            const candidateDate = new Date(candidate.created_at);
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            if (candidateDate > toDate) return false;
        }

        // Search filter (fuzzy matching)
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchScore = calculateFuzzyScore(candidate, searchLower);
            if (matchScore === 0) return false;
        }

        return true;
    });

    // Sort candidates
    const sortedCandidates = [...filteredCandidates].sort((a, b) => {
        let comparison = 0;

        if (filters.sortBy === 'created_at') {
            comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        } else if (filters.sortBy === 'full_name') {
            comparison = a.full_name.localeCompare(b.full_name);
        } else if (filters.sortBy === 'matching_score') {
            comparison = b.matching_score - a.matching_score;
        }

        // Apply fuzzy search score for relevance sorting when searching
        if (filters.search) {
            const scoreA = calculateFuzzyScore(a, filters.search.toLowerCase());
            const scoreB = calculateFuzzyScore(b, filters.search.toLowerCase());
            if (scoreA !== scoreB) {
                return filters.sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
            }
        }

        return filters.sortOrder === 'desc' ? comparison : -comparison;
    });

    if (loading) {
        return (
            <div className="empty-state">
                <div className="loading-spinner" style={{ width: 40, height: 40 }}></div>
                <p>Loading candidates...</p>
            </div>
        );
    }

    if (sortedCandidates.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h3 className="empty-state-title">
                    {candidates.length === 0 ? 'No candidates yet' : 'No matching candidates'}
                </h3>
                <p className="empty-state-text">
                    {candidates.length === 0
                        ? 'Add your first candidate using the form on the left.'
                        : 'Try adjusting your filters to see more results.'}
                </p>
            </div>
        );
    }

    return (
        <div className="candidate-grid">
            {sortedCandidates.map((candidate) => (
                <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
        </div>
    );
}

// Fuzzy matching algorithm for search
function calculateFuzzyScore(candidate: Candidate, searchTerm: string): number {
    let score = 0;
    const fields = [
        { value: candidate.full_name, weight: 3 },
        { value: candidate.applied_position, weight: 2 },
        { value: candidate.skills.join(' '), weight: 2 },
        { value: candidate.status, weight: 1 },
    ];

    for (const field of fields) {
        const fieldLower = field.value.toLowerCase();

        // Exact match
        if (fieldLower.includes(searchTerm)) {
            score += field.weight * 10;
        }

        // Word-by-word match
        const searchWords = searchTerm.split(/\s+/);
        const fieldWords = fieldLower.split(/\s+/);

        for (const searchWord of searchWords) {
            for (const fieldWord of fieldWords) {
                if (fieldWord.startsWith(searchWord)) {
                    score += field.weight * 5;
                } else if (fieldWord.includes(searchWord)) {
                    score += field.weight * 2;
                }
            }
        }
    }

    return score;
}
