<script setup lang="ts">
import { ref } from 'vue'
import { TeamMembers, type TeamMember, type TeamRole } from '.'

defineOptions({ inheritAttrs: false })

const avatar = (n: number) =>
  `https://static.frontic.com/cdn-cgi/image/width=128,format=auto/ui/avatars/${n}.jpg`

const roles: TeamRole[] = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'support', label: 'Support' },
]

const members = ref<TeamMember[]>([
  {
    name: 'Lena Berg',
    email: 'lena@basecamp.example',
    role: 'owner',
    avatar: avatar(10),
  },
  {
    name: 'Jonas Keller',
    email: 'jonas@basecamp.example',
    role: 'admin',
    avatar: avatar(4),
  },
  { name: 'Mira Okafor', email: 'mira@basecamp.example', role: 'editor' },
  {
    name: 'Tom Haas',
    email: 'tom@basecamp.example',
    role: 'support',
    avatar: avatar(5),
  },
  {
    name: 'Sara Lind',
    email: 'sara.lind@example.com',
    role: 'editor',
    pending: true,
  },
])

function invite(email: string, role: string) {
  const local = email.split('@')[0]!
  members.value = [
    ...members.value,
    {
      name: local.charAt(0).toUpperCase() + local.slice(1),
      email,
      role,
      pending: true,
    },
  ]
}
</script>

<template>
  <div class="mx-auto w-full max-w-5xl">
    <TeamMembers
      v-model:members="members"
      :roles="roles"
      invite-role="editor"
      :seats="`${members.length} of 10 seats`"
      description="People who can manage Basecamp Store."
      invite-placeholder="colleague@basecamp.example"
      @invite="invite"
      @revoke="(member) => (members = members.filter((m) => m !== member))"
      @remove="(member) => (members = members.filter((m) => m !== member))"
      v-bind="$attrs" />
  </div>
</template>
