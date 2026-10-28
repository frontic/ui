import * as icons from '@lucide/vue'
import { defineComponent, h, type Component } from 'vue'

/** Source-only stand-in: the build replaces every use with the named @lucide/vue icon. */
export const IconPlaceholder = defineComponent({
  name: 'IconPlaceholder',
  props: {
    lucide: { type: String, required: true },
    tabler: { type: String, required: true },
    hugeicons: { type: String, required: true },
    phosphor: { type: String, required: true },
    remixicon: { type: String, required: true },
  },
  setup(props) {
    return () => {
      const icon = (icons as unknown as Record<string, Component | undefined>)[props.lucide]
      return icon ? h(icon) : null
    }
  },
})
