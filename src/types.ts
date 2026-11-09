export type Role = 'Admin' | 'Editor' | 'Reviewer' | 'Viewer'
export type Status = 'verified' | 'conditional' | 'conflict' | 'unverified'
export type AssetType = 'Image' | 'Video' | 'Audio' | 'Illustration' | 'Font' | 'Logo' | 'Other'
export type Verification = 'verified' | 'pending' | 'unverified' | 'rejected'

export interface User { id: string; name: string; email: string; role: Role }
export interface Permission {
  id: string; assetId: string; rightsHolder: string; licenseType: string
  permittedUses: string[]; restrictedUses: string[]; permittedChannels: string[]; permittedRegions: string[]
  commercial: boolean | null; expiration: string | null; attribution: string | null; approvalRequired: boolean
  restrictions: string; docs: string | null; verification: Verification
  reviewerId: string | null; lastReviewed: string | null; history: { at: string; by: string; note: string }[]
}
export interface Asset { id: string; name: string; type: AssetType; creator: string; source: string; fileName: string; permissionId: string | null; addedAt: string }
export interface ProjectAsset {
  id: string; assetId: string; track: 'Video' | 'Image' | 'Audio' | 'Graphics'
  start: number; len: number; context: string; attributionAdded?: boolean; approvalObtained?: boolean
}
export interface ActionRecord { id: string; title: string; assetName: string; status: 'accepted' | 'rejected' | 'review'; at: string; by: string }
export interface Project {
  id: string; name: string; description: string; client: string; category: string; ownerId: string
  usages: string[]; channels: string[]; region: string; commercial: boolean; scope: string
  start: string; end: string; updatedAt: string; assets: ProjectAsset[]
  recStatus: Record<string, 'accepted' | 'rejected' | 'review'>; actions: ActionRecord[]; lastChecked: string
}
export type ReviewSection = 'verification' | 'clarification' | 'approval'
export type Grant = { kind: 'use' | 'channel' | 'region' | 'commercial' | 'expiry' | 'approval'; value?: string }
export interface Review {
  id: string; assetId: string; projectId: string; section: ReviewSection; reason: string; missing: string[]
  reviewerId: string; createdAt: string; priority: 'High' | 'Medium' | 'Low'
  status: 'open' | 'resolved' | 'unresolved' | 'rejected'; notes: { at: string; by: string; text: string }[]; grant?: Grant
}
export interface AuditEntry { id: string; userId: string; action: string; entityType: string; entityId: string; ts: string }
export interface Notice { id: string; kind: 'verify' | 'conflict' | 'expiry' | 'docs' | 'rec' | 'check'; text: string; ts: string; read: boolean; link: string }

export type Effect =
  | { k: 'replace'; withId: string | null } | { k: 'remove' } | { k: 'project'; patch: Partial<Project> }
  | { k: 'attribution' } | { k: 'review'; section: ReviewSection; grant?: Grant }
export type Action = 'replace' | 'remove' | 'request_permission' | 'change_usage' | 'add_attribution' | 'human_review'
export interface Rec {
  id: string; findingId: string; assetId: string; action: Action; title: string; proposed: string; reason: string
  segment: string; creative: string; permission: string; effort: 'Low' | 'Medium' | 'High'; followUp: string; effect: Effect
}
export interface Issue {
  type: 'unverified' | 'expired' | 'usage' | 'channel' | 'region' | 'commercial' | 'attribution' | 'approval'
  value?: string; status: Exclude<Status, 'verified'>; title: string; explanation: string; why: string
  evidence: string; severity: 'High' | 'Medium' | 'Low'; next: string
}
export interface Finding extends Issue { id: string; projectId: string; assetId: string; paId: string }
export interface State {
  users: User[]; meId: string | null; workspace: { id: string; name: string; orgType: string }
  projects: Project[]; assets: Asset[]; permissions: Permission[]; reviews: Review[]; audit: AuditEntry[]; notices: Notice[]
  onboarded: boolean
}
