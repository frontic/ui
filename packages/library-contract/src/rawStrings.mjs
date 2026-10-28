// No raw text in library components: template text, literal expressions, named attributes.
import vueI18n from '@intlify/eslint-plugin-vue-i18n'

export const RAW_TEXT = '@intlify/vue-i18n/no-raw-text'

const ATTRIBUTES = ['alt', 'title', 'placeholder', 'aria-label', 'aria-description', 'aria-roledescription', 'aria-valuetext', 'aria-placeholder']

// keep in sync with apps/admin-ui/eslint.config.mjs
const IGNORED_TEXT = ['+', '@', 'x', '-', '(', ')', '[', ']', '[]', '[?]', '?', '/', ',', '.', '•', '·', ':', '←', '"', '→', '⌘', '...', '%', 'ms']

export const RAW_TEXT_HINT = 'A library component carries no text of its own: take it as a prop or a slot; a string prop may default to a literal.'

/** One flat-config block. Examples are sample content and stay out. */
export function rawStringsConfig(files = ['library/components/**/*.vue']) {
  return {
    files,
    ignores: ['**/*.example.vue'],
    plugins: { '@intlify/vue-i18n': vueI18n },
    rules: {
      [RAW_TEXT]: ['error', { attributes: { '/.+/': ATTRIBUTES }, ignoreText: IGNORED_TEXT }],
    },
  }
}
