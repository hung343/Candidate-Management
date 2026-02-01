import { FilterOptions, CandidateStatus } from '../../types';

interface FilterBarProps {
    filters: FilterOptions;
    onChange: (filters: FilterOptions) => void;
}

const STATUS_OPTIONS: (CandidateStatus | '')[] = ['', 'New', 'Interviewing', 'Hired', 'Rejected'];

export function FilterBar({ filters, onChange }: FilterBarProps) {
    const updateFilter = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
        onChange({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        onChange({
            search: '',
            status: '',
            position: '',
            dateFrom: '',
            dateTo: '',
            sortBy: 'created_at',
            sortOrder: 'desc',
        });
    };

    const hasActiveFilters = filters.search || filters.status || filters.position || filters.dateFrom || filters.dateTo;

    return (
        <div className="filter-bar">
            <div className="filter-row">
                <input
                    type="text"
                    className="filter-input"
                    placeholder="🔍 Search candidates..."
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    style={{ gridColumn: 'span 2' }}
                />
            </div>

            <div className="filter-row">
                <select
                    className="filter-input"
                    value={filters.status}
                    onChange={(e) => updateFilter('status', e.target.value as CandidateStatus | '')}
                >
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.filter(Boolean).map((status) => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>

                <input
                    type="text"
                    className="filter-input"
                    placeholder="Position..."
                    value={filters.position}
                    onChange={(e) => updateFilter('position', e.target.value)}
                />
            </div>

            <div className="filter-row">
                <input
                    type="date"
                    className="filter-input"
                    value={filters.dateFrom}
                    onChange={(e) => updateFilter('dateFrom', e.target.value)}
                    title="From date"
                />

                <input
                    type="date"
                    className="filter-input"
                    value={filters.dateTo}
                    onChange={(e) => updateFilter('dateTo', e.target.value)}
                    title="To date"
                />
            </div>

            <div className="filter-row">
                <select
                    className="filter-input"
                    value={filters.sortBy}
                    onChange={(e) => updateFilter('sortBy', e.target.value as FilterOptions['sortBy'])}
                >
                    <option value="created_at">Sort by Date</option>
                    <option value="full_name">Sort by Name</option>
                    <option value="matching_score">Sort by Match Score</option>
                </select>

                <select
                    className="filter-input"
                    value={filters.sortOrder}
                    onChange={(e) => updateFilter('sortOrder', e.target.value as 'asc' | 'desc')}
                >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                </select>
            </div>

            {hasActiveFilters && (
                <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                    ✕ Clear Filters
                </button>
            )}
        </div>
    );
}
