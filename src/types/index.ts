// Type definitions for Candidate Management System

export interface Candidate {
  id: string;
  user_id: string;
  full_name: string;
  applied_position: string;
  status: CandidateStatus;
  resume_url: string | null;
  skills: string[];
  matching_score: number;
  created_at: string;
}

export type CandidateStatus = 'New' | 'Interviewing' | 'Hired' | 'Rejected';

export interface CandidateFormData {
  full_name: string;
  applied_position: string;
  skills: string[];
  resume: File | null;
}

export interface AnalyticsData {
  total_candidates: number;
  status_distribution: {
    status: CandidateStatus;
    count: number;
    percentage: number;
  }[];
  top_positions: {
    position: string;
    count: number;
  }[];
  recent_candidates: Candidate[];
}

export interface FilterOptions {
  search: string;
  status: CandidateStatus | '';
  position: string;
  dateFrom: string;
  dateTo: string;
  sortBy: 'created_at' | 'full_name' | 'matching_score';
  sortOrder: 'asc' | 'desc';
}

export interface User {
  id: string;
  email: string;
}
