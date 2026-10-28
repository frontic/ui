<script lang="ts">
/** Lists team members with roles, and lets the user invite, change roles and remove members. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { TeamMember, TeamRole } from './types'
import { computed, ref } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Avatar, AvatarFallback, AvatarImage } from '@library/components/ui/avatar'
import { Badge } from '@library/components/ui/badge'
import { Button } from '@library/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@library/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@library/components/ui/dropdown-menu'
import { Input } from '@library/components/ui/input'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@library/components/ui/item'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@library/components/ui/select'
import { initials } from '@library/lib/text'

const props = withDefaults(
  defineProps<{
    /** The roles a member can have, shown in the role selects. */
    roles: TeamRole[]
    /** The role nobody can be given or lose: its member's role select and action menu are disabled. */
    ownerRole?: string
    /** The role a new invite starts with. */
    inviteRole?: string
    /** Beside the title, e.g. how many seats are taken. */
    seats?: string
    /** Shown as the card's title. */
    title?: string
    /** Shown under the title. */
    description?: string
    /** Shown in the empty invite email field. */
    invitePlaceholder?: string
    /** Screen-reader label of the invite email field. */
    emailLabel?: string
    /** Screen-reader label of the invite role select. */
    roleLabel?: string
    /** Shown on the button that sends the invite. */
    inviteLabel?: string
    /** Shown on the badge of a member who was invited but has not joined yet. */
    pendingLabel?: string
    /** Shown on the menu item that opens a member's activity. */
    activityLabel?: string
    /** Shown on the menu item that removes a member from the team. */
    removeLabel?: string
    /** Shown on the menu item that sends a pending invite again. */
    resendLabel?: string
    /** Shown on the menu item that withdraws a pending invite. */
    revokeLabel?: string
    /** Screen-reader label of a member's role select. */
    memberRoleLabel?: (member: TeamMember) => string
    /** Screen-reader label of a member's action menu button. */
    memberActionsLabel?: (member: TeamMember) => string
    /** Bare drops the edge, shadow and inset, for a section placed inside another Card. */
    surface?: 'raised' | 'bare'
    class?: HTMLAttributes['class']
  }>(),
  {
    surface: 'raised',
    ownerRole: 'owner',
    title: 'Team',
    description: 'People who can manage your store.',
    invitePlaceholder: 'colleague@example.com',
    emailLabel: 'Email address',
    roleLabel: 'Role',
    inviteLabel: 'Invite',
    pendingLabel: 'Pending',
    activityLabel: 'View activity',
    removeLabel: 'Remove from team',
    resendLabel: 'Resend invite',
    revokeLabel: 'Revoke invite',
    memberRoleLabel: (member: TeamMember) => `Role of ${member.name}`,
    memberActionsLabel: (member: TeamMember) => `Actions for ${member.name}`,
  },
)
const emit = defineEmits<{
  /** Fires with the email and role when the admin invites a new member. */
  invite: [email: string, role: string]
  /** Fires with the member when the admin opens their activity. */
  activity: [member: TeamMember]
  /** Fires with an active member when the admin removes them. */
  remove: [member: TeamMember]
  /** Fires with a pending member when the admin resends their invitation. */
  resend: [member: TeamMember]
  /** Fires with a pending member when the admin revokes their invitation. */
  revoke: [member: TeamMember]
}>()

/** The team's members and pending invites; changing a role updates it. */
const members = defineModel<TeamMember[]>('members', { default: () => [] })

const assignable = computed(() => props.roles.filter((role) => role.value !== props.ownerRole))
const email = ref('')
const role = ref(props.inviteRole ?? assignable.value[0]?.value ?? '')

const initialsOf = (member: TeamMember) => initials(member.name, member.initials)

function invite() {
  if (!email.value) return
  emit('invite', email.value, role.value)
  email.value = ''
}

function setRole(member: TeamMember, value: string) {
  members.value = members.value.map((m) => (m === member ? { ...m, role: value } : m))
}
</script>

<template>
  <Card :surface="surface" :class="props.class">
    <CardHeader>
      <CardTitle as="h3">{{ title }}</CardTitle>
      <CardDescription v-if="description">{{ description }}</CardDescription>
      <CardAction v-if="seats" class="col-start-2 row-span-2 row-start-1 justify-self-end">
        <Badge>{{ seats }}</Badge>
      </CardAction>
    </CardHeader>
    <CardContent class="@container flex flex-col gap-6">
      <form class="flex flex-col gap-2 @md:flex-row" @submit.prevent="invite">
        <Input v-model="email" type="email" :placeholder="invitePlaceholder" :aria-label="emailLabel" />
        <div class="flex gap-2">
          <Select v-model="role">
            <SelectTrigger class="w-32 flex-1 @md:flex-none" :aria-label="roleLabel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in assignable" :key="option.value" :value="option.value">{{ option.label }}</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit">
            <IconPlaceholder lucide="UserPlusIcon" tabler="IconUserPlus" hugeicons="UserAdd01Icon" phosphor="UserPlusIcon" remixicon="RiUserAddLine" data-icon />
            {{ inviteLabel }}
          </Button>
        </div>
      </form>
      <ItemGroup>
        <Item v-for="member in members" :key="member.email" size="sm" variant="outline">
          <ItemMedia>
            <Avatar>
              <AvatarImage v-if="member.avatar" :src="member.avatar" :alt="member.name" />
              <AvatarFallback>{{ initialsOf(member) }}</AvatarFallback>
            </Avatar>
          </ItemMedia>
          <ItemContent class="min-w-40">
            <ItemTitle>{{ member.name }}</ItemTitle>
            <ItemDescription class="truncate">{{ member.email }}</ItemDescription>
          </ItemContent>
          <ItemActions class="ms-auto">
            <Badge v-if="member.pending" variant="primary" size="sm">{{ pendingLabel }}</Badge>
            <Select :model-value="member.role" :disabled="member.role === ownerRole" @update:model-value="setRole(member, String($event))">
              <SelectTrigger size="sm" class="w-28" :aria-label="memberRoleLabel(member)">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in roles" :key="option.value" :value="option.value" :disabled="option.value === ownerRole">{{ option.label }}</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" color="neutral" size="icon-sm" :aria-label="memberActionsLabel(member)" :disabled="member.role === ownerRole">
                  <IconPlaceholder lucide="MoreHorizontalIcon" tabler="IconDots" hugeicons="MoreHorizontalCircle01Icon" phosphor="DotsThreeIcon" remixicon="RiMoreLine" data-icon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem v-if="member.pending" @select="emit('resend', member)">{{ resendLabel }}</DropdownMenuItem>
                <DropdownMenuItem v-else @select="emit('activity', member)">{{ activityLabel }}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem v-if="member.pending" color="destructive" @select="emit('revoke', member)">{{ revokeLabel }}</DropdownMenuItem>
                <DropdownMenuItem v-else color="destructive" @select="emit('remove', member)">{{ removeLabel }}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ItemActions>
        </Item>
      </ItemGroup>
    </CardContent>
  </Card>
</template>
