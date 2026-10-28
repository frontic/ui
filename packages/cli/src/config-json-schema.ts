import { z } from 'zod'
import { rawConfigSchema } from '@/src/schema'

/** components.json as JSON Schema: what an editor validates the file against and what the site's settings page lists. */
export const configJsonSchema = () => z.toJSONSchema(rawConfigSchema, { target: 'draft-07', io: 'input' })
