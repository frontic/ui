<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Lets the shopper change email and password, switch two-factor on and delete the account. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useId } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Alert, AlertDescription, AlertTitle } from '@library/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@library/components/ui/alert-dialog'
import { Button } from '@library/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@library/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@library/components/ui/field'
import { Input } from '@library/components/ui/input'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@library/components/ui/item'
import { Switch } from '@library/components/ui/switch'

const props = withDefaults(
  defineProps<{
    /** The card's heading. */
    title?: string
    /** Shown under the heading. */
    description?: string
    /** A pending change to confirm, shown as a notice above the fields. */
    noticeTitle?: string
    /** Shown under the notice's title. */
    noticeDescription?: string
    /** The address the account has now; the email's change button stays off while the field holds it. */
    currentEmail?: string
    /** Shown above the email field. */
    emailLabel?: string
    /** Shown above the password field. */
    passwordLabel?: string
    /** Under the password, e.g. when it was last changed. */
    passwordHint?: string
    /** Shown on the buttons that save a new email or password. */
    changeLabel?: string
    /** Names the email's change button for screen readers. */
    changeEmailLabel?: string
    /** Names the password's change button for screen readers. */
    changePasswordLabel?: string
    /** Shown beside the two-factor switch. */
    twoFactorLabel?: string
    /** Under the two-factor switch, e.g. which method is set up. */
    twoFactorHint?: string
    /** Shown as the title of the row that deletes the account. */
    deleteTitle?: string
    /** Shown under the delete row's title, e.g. what deleting erases. */
    deleteDescription?: string
    /** Shown on the button that deletes the account. */
    deleteLabel?: string
    /** Asks the shopper to confirm before `delete` fires; false fires it on the first click, for a flow that confirms on its own, e.g. by asking for the password again. */
    confirm?: boolean
    /** The confirmation's heading. */
    confirmTitle?: string
    /** The confirmation's text, saying what deleting erases. */
    confirmDescription?: string
    /** Shown on the confirmation's button that keeps the account. */
    cancelLabel?: string
    /** Shown on the confirmation's button that deletes the account. */
    confirmLabel?: string
    /** Bare drops the edge, shadow and inset, for a section placed inside another Card. */
    surface?: 'raised' | 'bare'
    class?: HTMLAttributes['class']
  }>(),
  {
    surface: 'raised',
    title: 'Sign-in & security',
    description: 'How you get into your account.',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    changeLabel: 'Change',
    changeEmailLabel: 'Change email',
    changePasswordLabel: 'Change password',
    twoFactorLabel: 'Two-factor authentication',
    deleteTitle: 'Delete account',
    deleteDescription: 'Erases orders and saved addresses.',
    deleteLabel: 'Delete',
    confirm: true,
    confirmTitle: 'Delete your account?',
    confirmDescription: 'Your orders and saved addresses are erased for good. This cannot be undone.',
    cancelLabel: 'Keep account',
    confirmLabel: 'Delete account',
  },
)
const emit = defineEmits<{
  /** Fires with the entered email when the customer asks to change their email address. */
  changeEmail: [email: string]
  /** Fires with the entered password when the customer asks to change their password. */
  changePassword: [password: string]
  /** Fires when the customer confirms deleting their account, or on the first click when `confirm` is false. */
  delete: []
}>()

/** The email in the email field, sent with `changeEmail`. */
const email = defineModel<string>('email', { default: '' })
/** The new password typed into the password field, sent with `changePassword`. */
const password = defineModel<string>('password', { default: '' })
/** Whether two-factor authentication is switched on. */
const twoFactor = defineModel<boolean>('twoFactor', { default: false })

const id = useId()
</script>

<template>
  <Card :surface="surface" :class="props.class">
    <CardHeader>
      <CardTitle as="h3">{{ title }}</CardTitle>
      <CardDescription v-if="description">{{ description }}</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="flex flex-col gap-6">
        <Alert v-if="noticeTitle" variant="info">
          <template #icon
            ><IconPlaceholder lucide="MailCheckIcon" tabler="IconMailCheck" hugeicons="MailValidation01Icon" phosphor="EnvelopeSimpleIcon" remixicon="RiMailCheckLine" data-icon
          /></template>
          <AlertTitle>{{ noticeTitle }}</AlertTitle>
          <AlertDescription v-if="noticeDescription">{{ noticeDescription }}</AlertDescription>
        </Alert>
        <Field>
          <FieldLabel :for="`${id}-email`">{{ emailLabel }}</FieldLabel>
          <div class="flex gap-2">
            <Input :id="`${id}-email`" v-model="email" type="email" autocomplete="email" />
            <Button variant="outline" color="neutral" :aria-label="changeEmailLabel" :disabled="!email || email === currentEmail" @click="emit('changeEmail', email)">{{ changeLabel }}</Button>
          </div>
        </Field>
        <Field>
          <FieldLabel :for="`${id}-password`">{{ passwordLabel }}</FieldLabel>
          <div class="flex gap-2">
            <Input :id="`${id}-password`" v-model="password" type="password" autocomplete="new-password" />
            <Button variant="outline" color="neutral" :aria-label="changePasswordLabel" :disabled="!password" @click="emit('changePassword', password)">{{ changeLabel }}</Button>
          </div>
          <FieldDescription v-if="passwordHint">{{ passwordHint }}</FieldDescription>
        </Field>
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel :for="`${id}-2fa`">{{ twoFactorLabel }}</FieldLabel>
            <FieldDescription v-if="twoFactorHint">{{ twoFactorHint }}</FieldDescription>
          </FieldContent>
          <Switch :id="`${id}-2fa`" v-model="twoFactor" />
        </Field>
        <Item variant="outline" size="sm">
          <ItemContent>
            <ItemTitle>
              <span data-slot="account-access-delete-title" class="fui-account-access-delete-title">{{ deleteTitle }}</span>
            </ItemTitle>
            <ItemDescription v-if="deleteDescription">{{ deleteDescription }}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <AlertDialog v-if="confirm">
              <AlertDialogTrigger as-child>
                <Button variant="soft" color="destructive" size="sm">{{ deleteLabel }}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{{ confirmTitle }}</AlertDialogTitle>
                  <AlertDialogDescription>{{ confirmDescription }}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{{ cancelLabel }}</AlertDialogCancel>
                  <AlertDialogAction color="destructive" @click="emit('delete')">{{ confirmLabel }}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button v-else variant="soft" color="destructive" size="sm" @click="emit('delete')">{{ deleteLabel }}</Button>
          </ItemActions>
        </Item>
      </div>
    </CardContent>
  </Card>
</template>
