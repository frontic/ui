export interface TeamMember {
  name: string
  email: string
  /** The value of one of the roles. */
  role: string
  /** The member's picture, shown in the avatar. */
  avatar?: string
  /** Avatar fallback; the name's initials when left out. */
  initials?: string
  /** Invited, not yet joined. */
  pending?: boolean
}

export interface TeamRole {
  value: string
  label: string
}
