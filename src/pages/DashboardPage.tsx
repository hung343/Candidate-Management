import { useState } from 'react';
import { Header } from '../components/Layout/Header';
import { CandidateForm } from '../components/Dashboard/CandidateForm';
import { CandidateList } from '../components/Dashboard/CandidateList';
import { FilterBar } from '../components/Dashboard/FilterBar';
import { Analytics } from '../components/Dashboard/Analytics';
import { useRealtime } from '../hooks/useRealtime';
import { FilterOptions } from '../types';

export function DashboardPage() {
    const { candidates, loading } = useRealtime();
    const [filters, setFilters] = useState<FilterOptions>({
        search: '',
        status: '',
        position: '',
        dateFrom: '',
        dateTo: '',
        sortBy: 'created_at',
        sortOrder: 'desc',
    });

    return (
        <div className="app-container">
            <Header />

            <main className="page-container">
                <div className="dashboard">
                    <aside className="dashboard-sidebar">
                        <CandidateForm />
                        <Analytics />
                    </aside>

                    <section className="dashboard-main">
                        <FilterBar filters={filters} onChange={setFilters} />

                        <div>
                            <h2 className="section-title">
                                👥 Candidates
                                <span style={{
                                    fontSize: 'var(--font-size-sm)',
                                    fontWeight: 'normal',
                                    color: 'var(--color-text-secondary)'
                                }}>
                                    ({candidates.length} total)
                                </span>
                            </h2>

                            <CandidateList
                                candidates={candidates}
                                filters={filters}
                                loading={loading}
                            />
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
