'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'

import type {
  JsonSchema,
  ValidationError,
} from '@/types/form'

interface Props {
  schema: JsonSchema
  formVersionId: string
  formName: string
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
        {label}
        {required && (
          <span className="ml-1 text-black">*</span>
        )}
      </span>

      {children}
    </label>
  )
}

export function FormRenderer({
  schema,
  formVersionId,
  formName,
}: Props) {
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')

  const [serverErrors, setServerErrors] = useState<
    ValidationError[]
  >([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  const onSubmit = async (
    data: Record<string, unknown>,
  ) => {
    setStatus('loading')
    setServerErrors([])

    try {
      const res = await fetch(
        `/api/forms/version/${formVersionId}/submissions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payload: data,
          }),
        },
      )

      const json = await res.json()

      if (!res.ok) {
        setServerErrors(
          json.details ?? [
            {
              field: 'form',
              message:
                json.error ?? 'Failed.',
            },
          ],
        )

        setStatus('error')
        return
      }

      setStatus('success')
      reset()
    } catch {
      setServerErrors([
        {
          field: 'form',
          message:
            'Network error. Try again.',
        },
      ])

      setStatus('error')
    }
  }

  const required = schema.required ?? []
  const fields = Object.entries(schema.properties)

  return (
    <section className="border border-black/10 bg-white p-8 md:p-10">
      <div className="border-b border-black/10 pb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
          Form Submission
        </p>

        <h1 className="mt-3 text-3xl font-black uppercase leading-[0.95] tracking-[0.08em] md:text-4xl">
          {formName}
        </h1>
      </div>

      {status === 'success' && (
        <div
          role="alert"
          className="mt-6 border border-black/10 bg-black px-4 py-3 text-sm text-white"
        >
          Submitted successfully.
        </div>
      )}

      {status === 'error' &&
        serverErrors.find(
          e => e.field === 'form',
        ) && (
          <div
            role="alert"
            className="mt-6 border border-black px-4 py-3 text-sm"
          >
            {
              serverErrors.find(
                e => e.field === 'form',
              )?.message
            }
          </div>
        )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-8 space-y-6"
      >
        {fields.map(([key, field]) => {
          const isRequired =
            required.includes(key)

          const fieldError =
            serverErrors.find(
              e => e.field === key,
            )

          const inputClasses =
            `w-full border px-4 py-3 text-sm outline-none transition ${fieldError
              ? 'border-black'
              : 'border-black/10'
            } focus:border-black`

          return (
            <div
              key={key}
              className="space-y-2"
            >
              <Field
                label={
                  field.description ??
                  key
                }
                required={isRequired}
              >
                {field.enum ? (
                  <select
                    id={key}
                    className={inputClasses}
                    {...register(key, {
                      required:
                        isRequired
                          ? 'Required'
                          : false,
                    })}
                  >
                    <option value="">
                      Select…
                    </option>

                    {field.enum.map(
                      option => (
                        <option
                          key={option}
                          value={option}
                        >
                          {option}
                        </option>
                      ),
                    )}
                  </select>
                ) : field.type ===
                  'string' &&
                  (field.maxLength ??
                    0) > 200 ? (
                  <textarea
                    id={key}
                    rows={5}
                    className={`${inputClasses} min-h-[140px] resize-y`}
                    {...register(key, {
                      required:
                        isRequired
                          ? 'Required'
                          : false,
                      minLength:
                        field.minLength
                          ? {
                            value:
                              field.minLength,
                            message: `Min ${field.minLength} chars`,
                          }
                          : undefined,
                      maxLength:
                        field.maxLength
                          ? {
                            value:
                              field.maxLength,
                            message: `Max ${field.maxLength} chars`,
                          }
                          : undefined,
                    })}
                  />
                ) : field.type ===
                  'boolean' ? (
                  <input
                    id={key}
                    type="checkbox"
                    className="h-4 w-4 border border-black/20"
                    {...register(key, {
                      required:
                        isRequired
                          ? 'Required'
                          : false,
                    })}
                  />
                ) : (
                  <input
                    id={key}
                    type={
                      field.format ===
                        'email'
                        ? 'email'
                        : field.type ===
                          'integer' ||
                          field.type ===
                          'number'
                          ? 'number'
                          : 'text'
                    }
                    className={
                      inputClasses
                    }
                    {...register(key, {
                      required:
                        isRequired
                          ? 'Required'
                          : false,
                      min:
                        field.minimum !==
                          undefined
                          ? {
                            value:
                              field.minimum,
                            message: `Min ${field.minimum}`,
                          }
                          : undefined,
                      max:
                        field.maximum !==
                          undefined
                          ? {
                            value:
                              field.maximum,
                            message: `Max ${field.maximum}`,
                          }
                          : undefined,
                      minLength:
                        field.minLength
                          ? {
                            value:
                              field.minLength,
                            message: `Min ${field.minLength} chars`,
                          }
                          : undefined,
                      valueAsNumber:
                        field.type ===
                        'integer' ||
                        field.type ===
                        'number',
                    })}
                  />
                )}
              </Field>

              {errors[key] && (
                <p
                  role="alert"
                  className="text-sm text-red-600"
                >
                  {
                    errors[key]
                      ?.message as string
                  }
                </p>
              )}

              {fieldError && (
                <p
                  role="alert"
                  className="text-sm text-red-600"
                >
                  {fieldError.message}
                </p>
              )}
            </div>
          )
        })}

        <div className="border-t border-black/10 pt-8">
          <button
            type="submit"
            disabled={
              status === 'loading'
            }
            className="bg-black px-10 py-4 text-sm font-semibold text-white disabled:bg-neutral-200 disabled:text-neutral-500"
          >
            {status === 'loading'
              ? 'Submitting...'
              : 'Submit'}
          </button>
        </div>
      </form>
    </section>
  )
}