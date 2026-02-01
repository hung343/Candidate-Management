import { useState, useEffect } from 'react';
import { useCandidates } from '../../hooks/useCandidates';
import { AnalyticsData } from '../../types';

export function Analytics() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const { getAnalytics } = useCandidates();

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);
        const data = await getAnalytics();
        setAnalytics(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="card">
                <h2 className="section-title">📊 Analytics</h2>
                <div className="text-center" style={{ padding: 'var(--spacing-lg)' }}>
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="card">
                <h2 className="section-title">📊 Analytics</h2>
                <p className="text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    Analytics will be available once you configure the Edge Function.
                </p>
                <button className="btn btn-secondary btn-sm btn-full mt-md" onClick={loadAnalytics}>
                    🔄 Refresh
                </button>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="flex justify-between items-center mb-md">
                <h2 className="section-title" style={{ marginBottom: 0 }}>📊 Analytics</h2>
                <button className="btn btn-secondary btn-sm" onClick={loadAnalytics}>
                    🔄
                </button>
            </div>

            <div className="analytics-grid">
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-value">{analytics.total_candidates}</div>
                    <div className="stat-label">Total Candidates</div>
                </div>

                {analytics.status_distribution.map((stat) => (
                    <div key={stat.status} className="stat-card">
                        <div className="stat-icon">
                            {stat.status === 'New' && '🆕'}
                            {stat.status === 'Interviewing' && '💬'}
                            {stat.status === 'Hired' && '✅'}
                            {stat.status === 'Rejected' && '❌'}
                        </div>
                        <div className="stat-value">{stat.count}</div>
                        <div className="stat-label">{stat.status} ({stat.percentage}%)</div>
                    </div>
                ))}
            </div>

            {analytics.top_positions.length > 0 && (
                <div className="mt-lg">
                    <h3 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                        🏆 Top Positions
                    </h3>
                    <div className="flex flex-col gap-sm">
                        {analytics.top_positions.map((pos, index) => (
                            <div key={pos.position} className="flex justify-between items-center">
                                <span>{index + 1}. {pos.position}</span>
                                <span className="skill-tag">{pos.count} candidates</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {analytics.recent_candidates.length > 0 && (
                <div className="mt-lg">
                    <h3 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                        🕐 Recent (Last 7 Days)
                    </h3>
                    <div className="flex flex-col gap-sm">
                        {analytics.recent_candidates.slice(0, 3).map((candidate) => (
                            <div key={candidate.id} className="flex justify-between items-center">
                                <span>{candidate.full_name}</span>
                                <span className={`status-badge ${candidate.status.toLowerCase()}`}>
                                    {candidate.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
