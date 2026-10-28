import type { ComputedRef, InjectionKey } from 'vue'

export type AvatarSize = 'sm' | 'md' | 'lg'

export const AVATAR_SIZE: InjectionKey<ComputedRef<AvatarSize>> = Symbol('avatar-size')
/** The size an AvatarGroup gives its avatars and count; provided only inside a group. */
export const AVATAR_GROUP: InjectionKey<ComputedRef<AvatarSize | undefined>> = Symbol('avatar-group')
