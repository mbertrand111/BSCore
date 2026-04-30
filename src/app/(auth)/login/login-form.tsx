'use client'

import type React from 'react'
import { useActionState } from 'react'
import { Button } from '@/shared/ui/primitives/Button'
import { Input } from '@/shared/ui/primitives/Input'
import { FormLayout, FormField } from '@/shared/ui/patterns/FormLayout'
import { loginAction } from './actions'
import { LOGIN_INITIAL_STATE, type LoginFormState } from './state'

export interface LoginFormProps {
  /** Server-validated returnTo path. Round-tripped via a hidden field. */
  returnTo: string
}

export function LoginForm({ returnTo }: LoginFormProps): React.JSX.Element {
  const [state, formAction, isPending] = useActionState<LoginFormState, FormData>(
    loginAction,
    LOGIN_INITIAL_STATE,
  )

  const emailError = state.fieldErrors?.email
  const passwordError = state.fieldErrors?.password

  return (
    <FormLayout
      action={formAction}
      noValidate
      globalError={
        state.error !== null ? (
          <span data-testid="login-error">{state.error}</span>
        ) : undefined
      }
    >
      <input type="hidden" name="returnTo" value={returnTo} />

      <FormField
        label="Adresse e-mail"
        htmlFor="login-email"
        required
        {...(emailError !== undefined ? { error: emailError } : {})}
      >
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email ?? ''}
          state={emailError !== undefined ? 'error' : 'default'}
          aria-invalid={emailError !== undefined ? true : undefined}
          aria-describedby={emailError !== undefined ? 'login-email-error' : undefined}
          data-testid="login-email-input"
          disabled={isPending}
        />
      </FormField>

      <FormField
        label="Mot de passe"
        htmlFor="login-password"
        required
        {...(passwordError !== undefined ? { error: passwordError } : {})}
      >
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          state={passwordError !== undefined ? 'error' : 'default'}
          aria-invalid={passwordError !== undefined ? true : undefined}
          aria-describedby={passwordError !== undefined ? 'login-password-error' : undefined}
          data-testid="login-password-input"
          disabled={isPending}
        />
      </FormField>

      <Button
        type="submit"
        intent="primary"
        size="md"
        loading={isPending}
        data-testid="login-submit"
        className="w-full"
      >
        {isPending ? 'Connexion…' : 'Se connecter'}
      </Button>
    </FormLayout>
  )
}
