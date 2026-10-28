<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <AvatarGroup v-bind="$attrs">
    <Avatar v-bind="$attrs">
      <AvatarImage
        src="https://static.frontic.com/cdn-cgi/image/width=128,format=auto/ui/avatars/1.jpg"
        alt="Shop owner" />
      <AvatarFallback>FR</AvatarFallback>
      <AvatarBadge />
    </Avatar>
    <Avatar>
      <AvatarImage
        src="https://static.frontic.com/cdn-cgi/image/width=128,format=auto/ui/avatars/2.jpg"
        alt="Store manager" />
      <AvatarFallback>SM</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>LB</AvatarFallback>
    </Avatar>
    <AvatarGroupCount>+3</AvatarGroupCount>
  </AvatarGroup>
</template>
