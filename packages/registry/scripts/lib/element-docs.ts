/** What the data attributes and CSS variables on our parts mean. A data attribute is keyed by name, or `Component.attribute` where the component that sets it means something else by it. */

const OPEN = ['open', 'closed']
const CHECKED = ['checked', 'unchecked', 'indeterminate']
const ORIENTATION = ['horizontal', 'vertical']
const STEP = ['active', 'completed', 'inactive']

/** Values Reka computes in a helper. */
export const VALUE_FUNCTIONS: Record<string, string[]> = {
  getOpenState: OPEN,
  getState: CHECKED,
  getCheckedState: CHECKED,
}

/** Values Reka computes elsewhere than in the binding, keyed `Component.attribute`, else by attribute. */
export const DATA_ATTRIBUTE_VALUES: Record<string, string[]> = {
  'data-orientation': ORIENTATION,
  'data-side': ['top', 'right', 'bottom', 'left'],
  'data-align': ['start', 'center', 'end'],
  'AccordionContent.data-state': OPEN,
  'AccordionItem.data-state': OPEN,
  'AccordionTrigger.data-state': OPEN,
  'MenuRadioItem.data-state': ['checked', 'unchecked'],
  'Toggle.data-state': ['on', 'off'],
  'ProgressRoot.data-state': ['indeterminate', 'loading', 'complete'],
  'StepperItem.data-state': STEP,
  'StepperSeparator.data-state': STEP,
  'StepperTrigger.data-state': STEP,
  'SplitterResizeHandle.data-state': ['drag', 'hover', 'inactive'],
  'SplitterResizeHandle.data-resize-handle-state': ['drag', 'hover', 'inactive'],
  'TooltipTrigger.data-state': ['closed', 'delayed-open', 'instant-open'],
  'NavigationMenuContentImpl.data-motion': ['from-start', 'from-end', 'to-start', 'to-end'],
  'SelectContent.data-align-trigger': ['true', 'false'],
  'data-swipe-direction': ['up', 'down', 'left', 'right'],
  'FieldSeparator.data-content': ['true', 'false'],
  'SplitterResizeHandle.data-panel-resize-handle-enabled': ['true', 'false'],
}

const CALENDAR_VALUE = 'The date the cell holds, as `YYYY-MM-DD`.'

export const DATA_ATTRIBUTE_DESCRIPTIONS: Record<string, string> = {
  'data-state': 'The state the part is in, one value per state.',
  'data-variant': 'The variant the part is drawn with.',
  'data-color': 'The colour the part is drawn in.',
  'data-size': 'The size the part is drawn at.',
  'data-surface': 'The surface the part is drawn as: raised on its own, bare inside another surface.',
  'data-spacing': 'The space between the items, from `spacing`.',
  'data-disabled': 'Present while the part is disabled.',
  'data-orientation': 'The direction the part is laid out in.',
  'data-sidebar': 'Names the sidebar element, so other sidebar parts can style against it.',
  'data-inset': 'Present when `inset` indents the item to line up with items that have an icon.',
  'data-readonly': 'Present while the part is read-only.',
  'data-vertical': 'Present when the part is laid out vertically.',
  'data-horizontal': 'Present when the part is laid out horizontally.',
  'data-selected': 'Present while the item is selected.',
  'data-active': 'Present while the item is the active one.',
  'InputOTPSlot.data-active': 'Present on the slot the caret is in.',
  'PaginationLink.data-active': 'Present on the link to the current page.',
  'StepperTitle.data-current': "Present on the current step's title, the one a narrow row still shows.",
  'CalendarCellTrigger.data-value': CALENDAR_VALUE,
  'RangeCalendarCellTrigger.data-value': CALENDAR_VALUE,
  'ProgressRoot.data-value': 'The current progress; absent while indeterminate.',
  'data-size-md': 'Present when `size` is `md`.',
  'data-size-sm': 'Present when `size` is `sm`.',
  'data-size-lg': 'Present when `size` is `lg`.',
  'data-panel-group-id': 'The id of the panel group, shared by its panels and handles.',
  'data-invalid': 'Present while the value is invalid.',
  'data-unavailable': 'Present when the date cannot be picked.',
  'data-type': 'What the item is: a `page` link or an `ellipsis`.',
  'data-today': "Present on today's date.",
  'data-side': 'The side the content opened on: the one `side` asks for, unless there was no room.',
  'data-align': 'How the content lines up with its trigger: as `align` asks, unless there was no room.',
  'data-pressed': 'Present while the button is held down.',
  'data-placeholder': 'Present while no value is chosen and the placeholder shows.',
  'SelectValue.data-placeholder': 'Holds the placeholder text while no value is chosen.',
  'data-outside-view': "Present when the date lies outside the cell's month.",
  'data-outside-visible-view': 'Present when the date lies outside every month on display.',
  'data-highlighted': 'Present while the item is highlighted by the pointer or the keyboard.',
  'RangeCalendarCellTrigger.data-highlighted': 'Present while the date lies in the range being picked.',
  'data-highlighted-start': 'Present on the first date of the range being picked.',
  'data-highlighted-end': 'Present on the last date of the range being picked.',
  'data-selection-start': 'Present on the first date of the selected range.',
  'data-selection-end': 'Present on the last date of the selected range.',
  'data-grace-area-trigger': 'Marks the trigger, so the pointer can cross to the content without closing it.',
  'data-focused': 'Present while the date has keyboard focus.',
  'data-complete': 'Present once every input is filled.',
  'data-searchable': 'Present when the list has a search field.',
  'data-scrollbarimpl': 'Marks the scrollbar element.',
  'data-resize-handle': 'Marks the resize handle.',
  'data-resize-handle-state': 'What the pointer is doing with the handle.',
  'data-resize-handle-active': 'Present while the handle is being moved, naming whether by `pointer` or `keyboard`.',
  'data-panel': 'Marks a panel.',
  'data-panel-id': "The panel's id.",
  'data-panel-size': "The panel's size, as a percentage of the group with one decimal.",
  'data-panel-collapsible': 'Present when the panel can collapse.',
  'data-panel-group': 'Marks the panel group.',
  'data-panel-resize-handle-id': "The handle's id.",
  'data-panel-resize-handle-enabled': '`false` while the handle is disabled.',
  'data-navigation-menu-trigger': 'Marks the trigger.',
  'data-menu-item': 'Marks the item.',
  'data-motion': 'The direction the content animates in from or out to as the active item changes.',
  'data-max': "The progress bar's maximum.",
  'data-linear': 'Present when the steps must be completed in order.',
  'data-join-x': 'Present when the items sit flush side by side: `spacing` is 0.',
  'data-join-y': 'Present when the items sit flush, stacked: `spacing` is 0.',
  'data-empty': 'Present while no option matches the search.',
  'data-dismissable-layer': 'Marks a layer that closes on Escape or a click outside it.',
  'data-content': '`true` when the separator has text in it.',
  'data-swipe-direction': 'The direction the drawer is swiped to close, which is also the edge it slides in from.',
  'data-swiping': 'Present while the drawer is being dragged.',
  'data-nested-drawer-open': 'Present while another drawer is open on top of this one.',
  'data-alert-action': "Marks the alert's action, so the alert leaves room for it.",
  'data-align-trigger': '`true` when the content opens over the trigger, its selected item lined up with it (`position="item-aligned"`).',
}

/** What a CSS variable holds, by the pattern of its name; Reka names them `--reka-<component>-<what>`. */
const VARIABLES: [RegExp, string][] = [
  [/-content-transform-origin$/, 'The point the content grows from, on the side facing its trigger, for its open and close animation.'],
  [/-content-available-width$/, 'The width the content has between its trigger and the edge of the screen.'],
  [/-content-available-height$/, 'The height the content has between its trigger and the edge of the screen.'],
  [/-trigger-width$/, "The trigger's width, to size the content to match."],
  [/-trigger-height$/, "The trigger's height."],
  [/-(?:collapsible|accordion)-content-height$/, "The content's height while open, for animating it open and closed."],
  [/-(?:collapsible|accordion)-content-width$/, "The content's width while open, for animating it open and closed."],
]

/** Variables no name pattern covers. */
const VARIABLE_DESCRIPTIONS: Record<string, string> = {
  '--drawer-swipe-movement-x': 'How far the drawer has been dragged sideways, in pixels.',
  '--drawer-swipe-movement-y': 'How far the drawer has been dragged up or down, in pixels.',
  '--drawer-snap-point-offset': 'How far the drawer sits from fully open at its current snap point, in pixels.',
  '--drawer-height': "The drawer's height, in pixels.",
  '--drawer-frontmost-height': 'The height of the frontmost drawer in a stack, so the ones behind can match it.',
  '--drawer-swipe-progress': 'How far a swipe has gone towards closing the drawer, from 0 to 1.',
  '--drawer-swipe-strength': 'How fast the last swipe was released, from 0.1 to 1, to scale the closing transition.',
  '--nested-drawers': 'How many drawers are open on top of this one, for scaling it back behind them.',
  '--reka-navigation-menu-viewport-width': "The open content's width, so the viewport can animate to it.",
  '--reka-navigation-menu-viewport-height': "The open content's height, so the viewport can animate to it.",
  '--reka-navigation-menu-viewport-left': "The open content's left offset, in pixels.",
  '--reka-navigation-menu-viewport-top': "The open content's top offset, in pixels.",
  '--reka-navigation-menu-indicator-size': "The active trigger's width, so the indicator can match it.",
  '--reka-navigation-menu-indicator-position': "The active trigger's offset along the list, in pixels.",
  '--reka-scroll-area-corner-width': 'The width of the corner where the two scrollbars meet, in pixels.',
  '--reka-scroll-area-corner-height': 'The height of the corner where the two scrollbars meet, in pixels.',
  '--reka-scroll-area-thumb-width': "The thumb's width on a horizontal scrollbar, in pixels.",
  '--reka-scroll-area-thumb-height': "The thumb's height on a vertical scrollbar, in pixels.",
}

export const variableDescription = (name: string): string | undefined => VARIABLE_DESCRIPTIONS[name] ?? VARIABLES.find(([pattern]) => pattern.test(name))?.[1]
