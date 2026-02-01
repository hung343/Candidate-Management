import { Candidate, CandidateStatus } from '../../types';
import { useCandidates } from '../../hooks/useCandidates';

interface CandidateCardProps {
    candidate: Candidate;
}

const STATUS_OPTIONS: CandidateStatus[] = ['New', 'Interviewing', 'Hired', 'Rejected'];

export function CandidateCard({ candidate }: CandidateCardProps) {
    const { updateStatus, deleteCandidate } = useCandidates();

    const handleStatusChange = async (newStatus: CandidateStatus) => {
        await updateStatus(candidate.id, newStatus);
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this candidate?')) {
            await deleteCandidate(candidate.id);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="candidate-card fade-in">
            <div className="candidate-info">
                <h3>{candidate.full_name}</h3>
                <p className="candidate-position">📋 {candidate.applied_position}</p>

                <div className="candidate-meta">
                    <span>📅 {formatDate(candidate.created_at)}</span>
                    {candidate.matching_score > 0 && (
                        <span>⭐ Score: {candidate.matching_score.toFixed(0)}%</span>
                    )}
                </div>

                {candidate.skills && candidate.skills.length > 0 && (
                    <div className="candidate-skills">
                        {candidate.skills.map((skill, index) => (
                            <span key={index} className="skill-tag">{skill}</span>
                        ))}
                    </div>
                )}

                {candidate.resume_url && (
                    <a
                        href={candidate.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="resume-link mt-md"
                    >
                        📄 View Resume
                    </a>
                )}
            </div>

            <div className="candidate-actions">
                <select
                    className="status-select"
                    value={candidate.status}
                    onChange={(e) => handleStatusChange(e.target.value as CandidateStatus)}
                >
                    {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>

                <span className={`status-badge ${candidate.status.toLowerCase()}`}>
                    {candidate.status}
                </span>

                <button onClick={handleDelete} className="btn btn-danger btn-sm">
                    🗑️ Delete
                </button>
            </div>
        </div>
    );
}
