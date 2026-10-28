// zod and nothing else: project-config.ts reads the defaults, and the ui site loads that module.
import { z } from 'zod'

export const CHECK_RULES = ['drift', 'raw-text', 'contrast', 'missing-token', 'axis-collision'] as const
const severity = z.enum(['error', 'warn', 'off'])

export const checkSchema = z
  .strictObject(
    {
    contrast: z.enum(['AA', 'AAA']).default('AA').meta({ description: 'The WCAG level for colour contrast. AA holds text to 4.5:1 and large text to 3:1; AAA to 7:1 and 4.5:1. Icons and the focus ring need 3:1 under both.' }),
    rules: z
      .strictObject(
        {
          drift: z.enum(['error', 'warn'], { error: (issue) => (issue.input === 'off' ? 'cannot be off; use "warn"' : 'one of "error", "warn"') }).default('error')
            .meta({ description: 'A class the brand’s theme does not define, or a `<script>` that does not parse. Can be `warn`, never `off`.' }),
          'raw-text': severity.default('warn').meta({ description: 'Text written into an installed item instead of passed in as a prop or a slot.' }),
          contrast: severity.default('error').meta({ description: 'A recipe colour or a brand token pair below the contrast level.' }),
          'missing-token': severity.default('error').meta({ description: 'A recipe reference to a token brand.json does not define.' }),
          'axis-collision': severity
            .default('warn')
            .meta({ description: 'Two values of different axes that set one property to different values with no `with` pair between them, so the later axis wins by order.' }),
        },
        { error: (issue) => (issue.code === 'unrecognized_keys' ? `no rule ${issue.keys.join(', ')}; one of ${CHECK_RULES.join(', ')}` : undefined) },
      )
      .prefault({})
      .meta({ description: 'How each kind of finding counts: `error` fails `check`, `warn` reports it, `off` skips it.' }),
    },
    { error: (issue) => (issue.code === 'unrecognized_keys' ? `no setting ${issue.keys.join(', ')}; check takes contrast and rules` : undefined) },
  )
  .prefault({})

/** The check block a new components.json carries: every rule at its default. */
export const DEFAULT_CHECK = checkSchema.parse(undefined)

export type CheckRule = (typeof CHECK_RULES)[number]
export type Severity = z.infer<typeof severity>
