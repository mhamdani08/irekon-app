export interface DashboardSummaryResponse {
  total_transactions: number;
  match_rate_percentage: number;
  discrepancy_amount: number;
  discrepancy_count: number;
  pending_approvals: number;
}

export interface ReconTrendPoint {
  date: string;
  matched_count: number;
  mismatch_count: number;
  unmatched_count: number;
}

export interface ProfileBreakdownItem {
  profile_id: number;
  profile_name: string;
  percentage: number;
  total_records: number;
}

export interface RecentRunItem {
  run_id: string;
  profile_name: string;
  total_data: number;
  matched_data: number;
  status: string;
  created_at: string;
}