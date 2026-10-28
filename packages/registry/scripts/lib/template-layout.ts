// Layout that stays in a template although a recipe property sets its CSS, by file, each utility with the reason no recipe holds it.
// The layout gate passes these; the palette check passes the numeric ones on an element that wears a recipe.

const ANCESTOR = 'an ancestor’s state; no recipe block reads an ancestor'
const ORIENTATION = 'the element’s orientation attribute; its tree has no orientation variant'
const STEPPER = 'the stepper’s orientation, read off an ancestor; no recipe block reads an ancestor'
const TABS = 'the tabs’ orientation, read off an ancestor; no recipe block reads an ancestor'
const COLLAPSED = 'the sidebar’s collapsed state, read off an ancestor; no recipe block reads an ancestor'
const WIDE = 'a 2xl container step; a recipe steps at @sm, @md and @lg only'
const NARROW = 'a max-width query on the named pagination container; a recipe steps up from the nearest container'
const NAMED = 'a query on the named card-header container; a recipe steps at the nearest container'

export const TEMPLATE_LAYOUT: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  'ui/alert-dialog/AlertDialogFooter.vue': {
    'group-data-size-sm/alert-dialog-content:grid': ANCESTOR,
    'group-data-size-sm/alert-dialog-content:grid-cols-2': ANCESTOR,
  },
  'ui/card/CardAction.vue': { '@sm/card-header:justify-self-end': NAMED, '@sm/card-header:row-span-2': NAMED },
  'ui/date-field/DateFieldInput.vue': { 'first:-ms-0.5': 'a first-child pseudo-class; no recipe state matches it' },
  'ui/dialog/DialogContent.vue': { '@2xl:max-w-md': WIDE },
  'ui/field/FieldDescription.vue': { 'nth-last-2:-mt-1': 'an nth-last-child pseudo-class; no recipe state matches it' },
  'ui/field/FieldTitle.vue': { 'items-center': 'FieldLabel wears field-label too and does not centre its items' },
  'ui/input/Input.vue': { 'file:h-7': 'a height on the file button; the file part takes no layout property' },
  'ui/item/ItemTitle.vue': { flex: 'line-clamp-1 beside it sets display too, and flex has to come after it' },
  'ui/pagination/PaginationEllipsis.vue': { '@max-md/pagination:hidden': NARROW },
  'ui/pagination/PaginationItem.vue': { '@max-md/pagination:not-data-active:hidden': NARROW },
  'ui/search/SearchOverlay.vue': { '@2xl:mx-auto': WIDE, '@2xl:max-w-2xl': WIDE },
  'ui/select/SelectValue.vue': { flex: 'line-clamp-1 beside it sets display too, and flex has to come after it' },
  'ui/sidebar/SidebarGroupAction.vue': { 'group-data-collapsible-icon:hidden': COLLAPSED },
  'ui/sidebar/SidebarInset.vue': { 'peer-data-collapsed:ms-2': 'a sibling’s state; no recipe block reads a peer' },
  'ui/sidebar/SidebarMenuAction.vue': { 'group-data-collapsible-icon:hidden': COLLAPSED },
  'ui/sidebar/SidebarMenuBadge.vue': { 'group-data-collapsible-icon:hidden': COLLAPSED },
  'ui/sidebar/SidebarMenuSub.vue': { 'group-data-collapsible-icon:hidden': COLLAPSED },
  'ui/sidebar/SidebarMenuSubButton.vue': { 'group-data-collapsible-icon:hidden': COLLAPSED },
  'ui/slider/SliderControl.vue': {
    'data-vertical:h-full': ORIENTATION,
    'data-vertical:min-h-40': ORIENTATION,
    'data-vertical:w-auto': ORIENTATION,
    'data-vertical:flex-col': ORIENTATION,
  },
  'ui/stepper/Stepper.vue': {
    'gap-y-3': 'a row gap; no recipe property sets row-gap alone',
    'data-vertical:gap-y-0': 'a row gap behind the orientation attribute; no recipe property sets row-gap alone',
    'data-vertical:flex-col': ORIENTATION,
    'data-vertical:flex-nowrap': ORIENTATION,
  },
  'ui/stepper/StepperIndicator.vue': { 'group-data-vertical/stepper:row-span-2': STEPPER },
  'ui/stepper/StepperItem.vue': {
    'group-data-horizontal/stepper:@md:items-start': STEPPER,
    'group-data-horizontal/stepper:@md:flex-1': STEPPER,
    'group-data-horizontal/stepper:@md:justify-center': STEPPER,
    'group-data-vertical/stepper:flex-col': STEPPER,
    'group-data-vertical/stepper:items-stretch': STEPPER,
  },
  'ui/stepper/StepperSeparator.vue': {
    'group-data-horizontal/stepper:@md:mx-0': STEPPER,
    'group-data-horizontal/stepper:@md:w-full': STEPPER,
    'group-data-vertical/stepper:mx-0': STEPPER,
    'group-data-vertical/stepper:h-full': STEPPER,
    'group-data-vertical/stepper:w-px': STEPPER,
  },
  'ui/stepper/StepperTrigger.vue': {
    'group-data-vertical/stepper:grid': STEPPER,
    'group-data-vertical/stepper:grid-cols-1': STEPPER,
    'group-data-vertical/stepper:items-start': STEPPER,
    'group-data-vertical/stepper:text-start': STEPPER,
  },
  'ui/tabs/Tabs.vue': { 'data-horizontal:flex-col': ORIENTATION },
  'ui/tabs/TabsList.vue': { 'group-data-vertical/tabs:h-fit': TABS, 'group-data-vertical/tabs:flex-col': TABS },
  'ui/tabs/TabsTrigger.vue': { 'group-data-vertical/tabs:w-full': TABS, 'group-data-vertical/tabs:justify-start': TABS },
  'ui/toggle-group/ToggleGroup.vue': { 'data-vertical:flex-col': ORIENTATION, 'data-vertical:items-stretch': ORIENTATION },
}

/** The utilities a file keeps in its template, which the layout gate and the palette check pass. */
export const keptLayout = (path: string): ReadonlySet<string> => new Set(Object.keys(TEMPLATE_LAYOUT[path] ?? {}))
