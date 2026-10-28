<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Groups all parts of the sidebar and shares its open state with them. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes, Ref } from 'vue'
import type { SidebarProviderVariant } from './utils'
import { defaultDocument, useEventListener, useMediaQuery, useVModel } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { TooltipProvider } from 'reka-ui'
import { computed, ref, toRef } from 'vue'
import { provideSidebarContext, SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_COOKIE_NAME, SIDEBAR_KEYBOARD_SHORTCUT } from './utils'

const props = withDefaults(
  defineProps<{
    /** Whether the sidebar starts expanded when `open` is not bound; read from the sidebar cookie when left out. */
    defaultOpen?: boolean
    /** Whether the desktop sidebar is expanded, bound with v-model:open. */
    open?: boolean
    /** `inset` paints the wrapper in the card colour, which `<Sidebar variant="inset">` needs. */
    variant?: SidebarProviderVariant
    class?: HTMLAttributes['class']
  }>(),
  {
    variant: 'default',
    defaultOpen: !defaultDocument?.cookie.includes(`${SIDEBAR_COOKIE_NAME}=false`),
    open: undefined,
  },
)

const emits = defineEmits<{
  'update:open': [open: boolean]
}>()

const isMobile = useMediaQuery('(max-width: 768px)')
const openMobile = ref(false)

const open = useVModel(props, 'open', emits, {
  defaultValue: props.defaultOpen ?? false,
  passive: (props.open === undefined) as false,
}) as Ref<boolean>

function setOpen(value: boolean) {
  open.value = value
  document.cookie = `${SIDEBAR_COOKIE_NAME}=${open.value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
}

function setOpenMobile(value: boolean) {
  openMobile.value = value
}

function toggleSidebar() {
  return isMobile.value ? setOpenMobile(!openMobile.value) : setOpen(!open.value)
}

useEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    toggleSidebar()
  }
})

const state = computed(() => (open.value ? 'expanded' : 'collapsed'))

provideSidebarContext({
  state,
  open,
  setOpen,
  isMobile,
  openMobile,
  setOpenMobile,
  toggleSidebar,
  variant: toRef(props, 'variant'),
})

const sidebarWrapper = cva('fui-sidebar-wrapper group/sidebar-wrapper', {
  variants: {
    variant: {
      default: 'fui-sidebar-wrapper-default',
      inset: 'fui-sidebar-wrapper-inset',
    },
  },
  defaultVariants: { variant: 'default' },
})
</script>

<template>
  <TooltipProvider :delay-duration="0">
    <div data-slot="sidebar-wrapper" :class="[sidebarWrapper({ variant: props.variant }), props.class]" v-bind="$attrs">
      <slot />
    </div>
  </TooltipProvider>
</template>
