import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { FieldValidateFn, FieldValidateResult } from 'reka-ui'

/** A schema in the Standard Schema shape: Zod 4, Valibot and ArkType all are. */
export type StandardSchema = StandardSchemaV1
/** One problem a schema reports, at the path of the value it is about. */
export type StandardSchemaIssue = StandardSchemaV1.Issue

/** The form's values with dotted names as nested objects, so `address.city` meets a nested schema. */
function nested(values: Record<string, unknown>) {
  const root: Record<string, unknown> = {}
  for (const [name, value] of Object.entries(values)) {
    const keys = name.split('.')
    let node = root
    for (const key of keys.slice(0, -1)) node = (node[key] ??= {}) as Record<string, unknown>
    node[keys.at(-1)!] = value
  }
  return root
}

const dotted = (issue: StandardSchemaIssue) => (issue.path ?? []).map((segment) => String(typeof segment === 'object' ? segment.key : segment)).join('.')

/** A field shows an issue whose path is its name, `address.city`, or lies inside it. */
const claims = (name: string, issue: StandardSchemaIssue) => {
  const path = dotted(issue)
  return path === name || path.startsWith(`${name}.`)
}

const messagesFor = (name: string, issues: ReadonlyArray<StandardSchemaIssue> = []): FieldValidateResult => issues.filter((issue) => claims(name, issue)).map((issue) => issue.message)

/** A Field validator from a form schema: runs the schema on the form's values and keeps the messages for this field's name. Stays sync for a sync schema, so a submit sees the result. */
export function schemaValidate(schema: StandardSchema, name: string): FieldValidateFn {
  return (_value, formValues) => {
    const result = schema['~standard'].validate(nested(formValues))
    return 'then' in result ? result.then(({ issues }) => messagesFor(name, issues)) : messagesFor(name, result.issues)
  }
}

/** The messages of the issues no field of the form's values claims: a check on the whole object, or a key without a field. */
export async function unclaimed(schema: StandardSchema, values: Record<string, unknown>): Promise<string[]> {
  const { issues = [] } = await schema['~standard'].validate(nested(values))
  const names = Object.keys(values)
  return issues.filter((issue) => !names.some((name) => claims(name, issue))).map((issue) => issue.message)
}
