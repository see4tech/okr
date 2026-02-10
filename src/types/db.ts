export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Profile {
  id: string
  email: string | null
  role: string
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  icon: string | null
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  member_role: string
  created_at: string
}

export interface Period {
  id: string
  name: string
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}

export interface Objective {
  id: string
  team_id: string
  period_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Item {
  id: string
  team_id: string
  objective_id: string | null
  title: string
  owner_id: string | null
  status: string
  status_reason: string | null
  blockers_summary: string | null
  help_needed_summary: string | null
  next_step: string | null
  target_date: string | null
  last_update_at: string | null
  created_at: string
  updated_at: string
}

export interface ItemUpdate {
  id: string
  item_id: string
  updated_by: string
  snapshot: Json
  created_at: string
}

export interface Blocker {
  id: string
  item_id: string
  title: string
  detail: string | null
  severity: string
  status: string
  owner_id: string | null
  eta: string | null
  created_at: string
  updated_at: string
}

export interface HelpRequest {
  id: string
  item_id: string
  requested_by: string
  type: string
  detail: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  item_id: string
  author_id: string
  body: string
  created_at: string
}

// Joined types for UI
export interface ItemWithCounts extends Item {
  open_blockers_count?: number
  open_help_requests_count?: number
  owner_email?: string | null
  objective_title?: string | null
}

export interface ItemUpdateWithAuthor extends ItemUpdate {
  author_email?: string | null
}
