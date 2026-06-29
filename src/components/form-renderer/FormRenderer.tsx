'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';

interface Props {
  schema: any;
  formVersionId: string;
  formName: string;
  formId: string;
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-500">
        {label}
        {required && <span className="ml-1 text-neutral-900">*</span>}
      </span>
      {children}
    </label>
  );
}

export default function FormRenderer({ schema, formVersionId, formName, formId }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverErrors, setServerErrors] = useState<any[]>([]);
  const [fileUploads, setFileUploads] = useState<Record<string, File | File[]>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data: Record<string, unknown>) => {
    setStatus('loading');
    setServerErrors([]);

    try {
      const hasFiles = Object.keys(fileUploads).length > 0;
      const payload = { ...data };

      for (const [key, value] of Object.entries(fileUploads)) {
        if (Array.isArray(value)) {
          payload[key] = value.map((file: File) => file.name);
        } else if (value instanceof File) {
          payload[key] = value.name;
        }
      }

      if (hasFiles) {
        const formData = new FormData();
        formData.append('payload', JSON.stringify(payload));

        for (const [fieldName, files] of Object.entries(fileUploads)) {
          if (Array.isArray(files)) {
            files.forEach((file) => {
              formData.append(`${fieldName}[]`, file);
            });
          } else {
            formData.append(fieldName, files);
          }
        }

        const res = await fetch(
          `/api/forms/${formId}/versions/${formVersionId}/submissions`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const json = await res.json();

        if (!res.ok) {
          if (res.status === 422 && json.details) {
            const fieldErrors = json.details.map((err: any) => ({
              field: err.instancePath?.replace('/', '') || 'form',
              message: err.message || 'Validation error',
            }));
            setServerErrors(fieldErrors);
          } else {
            setServerErrors([
              {
                field: 'form',
                message: json.error ?? 'Submission failed.',
              },
            ]);
          }
          setStatus('error');
          return;
        }

        setStatus('success');
        reset();
        setFileUploads({});
        setTimeout(() => {
          router.push(`/forms/${formId}`);
        }, 1500);
        return;
      }

      const res = await fetch(
        `/api/forms/${formId}/versions/${formVersionId}/submissions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 422 && json.details) {
          const fieldErrors = json.details.map((err: any) => ({
            field: err.instancePath?.replace('/', '') || 'form',
            message: err.message || 'Validation error',
          }));
          setServerErrors(fieldErrors);
        } else {
          setServerErrors([
            {
              field: 'form',
              message: json.error ?? 'Submission failed.',
            },
          ]);
        }
        setStatus('error');
        return;
      }

      setStatus('success');
      reset();
      setTimeout(() => {
        router.push(`/forms/${formId}`);
      }, 1500);
    } catch (error) {
      console.error('Submit error:', error);
      setServerErrors([
        { field: 'form', message: 'Network error. Try again.' },
      ]);
      setStatus('error');
    }
  };

  const handleFileChange = (key: string, files: FileList | null, multiple: boolean = false) => {
    if (files && files.length > 0) {
      if (multiple) {
        const existingFiles = (fileUploads[key] as File[]) || [];
        const newFiles = Array.from(files);
        const allFiles = [...existingFiles, ...newFiles];
        setFileUploads(prev => ({ ...prev, [key]: allFiles }));
        setValue(key, allFiles.map(f => f.name));
      } else {
        const file = files[0];
        setFileUploads(prev => ({ ...prev, [key]: file }));
        setValue(key, file.name);
      }
    } else if (!multiple) {
      const newUploads = { ...fileUploads };
      delete newUploads[key];
      setFileUploads(newUploads);
      setValue(key, undefined);
    }
  };

  const removeSingleFile = (key: string, index?: number) => {
    const files = fileUploads[key];

    if (Array.isArray(files)) {
      if (index !== undefined) {
        const newFiles = files.filter((_, i) => i !== index);
        if (newFiles.length === 0) {
          const newUploads = { ...fileUploads };
          delete newUploads[key];
          setFileUploads(newUploads);
          setValue(key, undefined);
        } else {
          setFileUploads(prev => ({ ...prev, [key]: newFiles }));
          setValue(key, newFiles.map(f => f.name));
        }
      }
    } else {
      const newUploads = { ...fileUploads };
      delete newUploads[key];
      setFileUploads(newUploads);
      setValue(key, undefined);
      if (fileInputRefs.current[key]) {
        fileInputRefs.current[key]!.value = '';
      }
    }
  };

  const clearAllFiles = (key: string) => {
    const newUploads = { ...fileUploads };
    delete newUploads[key];
    setFileUploads(newUploads);
    setValue(key, undefined);
    if (fileInputRefs.current[key]) {
      fileInputRefs.current[key]!.value = '';
    }
  };

  if (!schema || !schema.properties) {
    return (
      <section className="border border-black/10 bg-white p-8 md:p-10">
        <div className="text-center text-neutral-500">
          <p className="text-sm">No form schema found.</p>
          <p className="text-xs mt-2">Schema data: {schema ? JSON.stringify(schema) : 'null'}</p>
        </div>
      </section>
    );
  }

  const required = schema.required ?? [];
  const fields = Object.entries(schema.properties);
  const formTitle = schema.title || formName;

  return (
    <section className="border border-black/10 bg-white p-8 md:p-10">
      <div className="border-b border-black/10 pb-8">
        <p className="text-sm font-medium text-neutral-500">
          Form Submission
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          {formTitle}
        </h1>
        {schema.description && (
          <p className="mt-2 text-sm text-neutral-500">{schema.description}</p>
        )}
      </div>

      {status === 'success' && (
        <div
          role="alert"
          className="mt-6 border border-black/10 bg-neutral-900 px-4 py-3 text-sm text-white"
        >
          Submitted successfully. Redirecting...
        </div>
      )}

      {status === 'error' &&
        serverErrors.find((e: any) => e.field === 'form') && (
          <div
            role="alert"
            className="mt-6 border border-neutral-900 px-4 py-3 text-sm"
          >
            {serverErrors.find((e: any) => e.field === 'form')?.message}
          </div>
        )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-8 space-y-6"
        encType={Object.keys(fileUploads).length > 0 ? 'multipart/form-data' : 'application/json'}
      >
        {fields.map(([key, field]: [string, any]) => {
          const isRequired = required.includes(key);
          const fieldError = serverErrors.find((e: any) => e.field === key);

          const inputClasses = `w-full border px-4 py-3 text-sm outline-none transition ${fieldError ? 'border-neutral-900' : 'border-black/10'
            } focus:border-neutral-900`;

          const label = field.title || field.description || key;

          // File upload detection
          const isFileField =
            field.type === 'file' ||
            field.format === 'file' ||
            field.format === 'data-url' ||
            field.widget === 'file' ||
            field['x-widget'] === 'file' ||
            field.accept !== undefined ||
            key.toLowerCase().includes('file') ||
            key.toLowerCase().includes('resume') ||
            key.toLowerCase().includes('upload') ||
            key.toLowerCase().includes('profilepicture') ||
            key.toLowerCase().includes('verificationdocs');

          const isFileArray = field.type === 'array' && field.items?.format === 'data-url';

          if (isFileField || isFileArray) {
            const accept = field.accept || field.items?.accept || '*/*';
            const maxSize = field.maxSize || field.items?.maxSize || 10 * 1024 * 1024;
            const maxSizeMB = Math.round(maxSize / (1024 * 1024));
            const multiple = isFileArray || field.multiple || key.toLowerCase().includes('verification');

            const currentFiles = fileUploads[key];
            const isArray = Array.isArray(currentFiles);
            const fileCount = isArray ? currentFiles.length : (currentFiles ? 1 : 0);

            return (
              <div key={key} className="space-y-2">
                <Field label={label} required={isRequired}>
                  <div className="relative">
                    <input
                      type="file"
                      accept={accept}
                      multiple={multiple}
                      className="hidden"
                      ref={(el) => {
                        if (el) fileInputRefs.current[key] = el;
                      }}
                      onChange={(e) => {
                        handleFileChange(key, e.target.files, multiple);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[key]?.click()}
                      className="w-full border border-black/10 border-dashed px-4 py-8 text-center transition hover:border-neutral-900 hover:bg-neutral-50"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <i className="ti ti-upload text-2xl text-neutral-400" />
                        <span className="text-sm text-neutral-500">
                          {fileCount > 0
                            ? `${fileCount} file(s) selected${isArray ? ' (click to add more)' : ''}`
                            : `Click to upload${multiple ? ' (multiple files)' : ''}`}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {accept !== '*/*' ? `Accepted: ${accept}` : 'Any file type'} • Max {maxSizeMB}MB
                          {multiple && ' • Multiple files allowed'}
                        </span>
                      </div>
                    </button>

                    {isArray && fileCount > 0 && (
                      <div className="mt-2 space-y-1">
                        {currentFiles.map((file: File, index: number) => (
                          <div key={index} className="flex items-center justify-between bg-neutral-50 px-3 py-2 text-sm">
                            <span className="truncate text-neutral-600">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeSingleFile(key, index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => clearAllFiles(key)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Clear all
                        </button>
                      </div>
                    )}

                    {!isArray && currentFiles && (
                      <div className="mt-2 flex items-center justify-between bg-neutral-50 px-3 py-2">
                        <span className="truncate text-sm text-neutral-600">{(currentFiles as File).name}</span>
                        <button
                          type="button"
                          onClick={() => removeSingleFile(key)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                  <input
                    type="hidden"
                    {...register(key, {
                      required: isRequired ? 'Please upload a file' : false,
                    })}
                  />
                </Field>
                {field.description && (
                  <p className="text-xs text-neutral-500">{field.description}</p>
                )}
                {errors[key] && (
                  <p role="alert" className="text-sm text-red-600">
                    {errors[key]?.message as string}
                  </p>
                )}
                {fieldError && (
                  <p role="alert" className="text-sm text-red-600">
                    {fieldError.message}
                  </p>
                )}
              </div>
            );
          }

          // Boolean (Checkbox)
          if (field.type === 'boolean') {
            return (
              <div key={key} className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-5 w-5 border border-black/20 accent-neutral-900"
                    {...register(key, {
                      required: isRequired ? 'Required' : false,
                    })}
                  />
                  <div>
                    <span className="text-sm font-medium">
                      {label}
                      {isRequired && <span className="ml-1 text-neutral-900">*</span>}
                    </span>
                    {field.description && (
                      <p className="text-xs text-neutral-500">{field.description}</p>
                    )}
                  </div>
                </label>
                {errors[key] && (
                  <p role="alert" className="text-sm text-red-600">
                    {errors[key]?.message as string}
                  </p>
                )}
                {fieldError && (
                  <p role="alert" className="text-sm text-red-600">
                    {fieldError.message}
                  </p>
                )}
              </div>
            );
          }

          // OneOf / AnyOf
          if (field.oneOf && Array.isArray(field.oneOf)) {
            const options = field.oneOf.map((opt: any) => ({
              value: opt.const || opt.enum?.[0] || '',
              label: opt.title || opt.description || opt.const || 'Option',
            }));

            return (
              <div key={key} className="space-y-2">
                <Field label={label} required={isRequired}>
                  <select
                    className={inputClasses}
                    {...register(key, {
                      required: isRequired ? 'Required' : false,
                    })}
                  >
                    <option value="">Select...</option>
                    {options.map((opt: any) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>
                {errors[key] && (
                  <p role="alert" className="text-sm text-red-600">
                    {errors[key]?.message as string}
                  </p>
                )}
                {fieldError && (
                  <p role="alert" className="text-sm text-red-600">
                    {fieldError.message}
                  </p>
                )}
              </div>
            );
          }

          // Enum
          if (field.enum && Array.isArray(field.enum)) {
            return (
              <div key={key} className="space-y-2">
                <Field label={label} required={isRequired}>
                  <select
                    className={inputClasses}
                    {...register(key, {
                      required: isRequired ? 'Required' : false,
                    })}
                  >
                    <option value="">Select...</option>
                    {field.enum.map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
                {field.description && (
                  <p className="text-xs text-neutral-500">{field.description}</p>
                )}
                {errors[key] && (
                  <p role="alert" className="text-sm text-red-600">
                    {errors[key]?.message as string}
                  </p>
                )}
                {fieldError && (
                  <p role="alert" className="text-sm text-red-600">
                    {fieldError.message}
                  </p>
                )}
              </div>
            );
          }

          // Textarea
          if (field.type === 'string' && (field.maxLength || 0) > 100) {
            const registerOptions: any = {
              required: isRequired ? 'Required' : false,
            };
            if (field.minLength) registerOptions.minLength = field.minLength;
            if (field.maxLength) registerOptions.maxLength = field.maxLength;
            if (field.pattern) registerOptions.pattern = new RegExp(field.pattern);

            return (
              <div key={key} className="space-y-2">
                <Field label={label} required={isRequired}>
                  <textarea
                    rows={5}
                    className={`${inputClasses} min-h-[100px] resize-y`}
                    {...register(key, registerOptions)}
                  />
                </Field>
                {field.description && (
                  <p className="text-xs text-neutral-500">{field.description}</p>
                )}
                {field.maxLength && (
                  <p className="text-xs text-neutral-400">Max {field.maxLength} characters</p>
                )}
                {errors[key] && (
                  <p role="alert" className="text-sm text-red-600">
                    {errors[key]?.message as string}
                  </p>
                )}
                {fieldError && (
                  <p role="alert" className="text-sm text-red-600">
                    {fieldError.message}
                  </p>
                )}
              </div>
            );
          }

          // Default Input
          const registerOptions: any = {
            required: isRequired ? 'Required' : false,
          };
          if (field.minimum !== undefined) registerOptions.min = field.minimum;
          if (field.maximum !== undefined) registerOptions.max = field.maximum;
          if (field.minLength) registerOptions.minLength = field.minLength;
          if (field.maxLength) registerOptions.maxLength = field.maxLength;
          if (field.pattern) registerOptions.pattern = new RegExp(field.pattern);
          if (field.type === 'integer' || field.type === 'number') registerOptions.valueAsNumber = true;

          return (
            <div key={key} className="space-y-2">
              <Field label={label} required={isRequired}>
                <input
                  type={
                    field.format === 'email'
                      ? 'email'
                      : field.format === 'date'
                        ? 'date'
                        : field.format === 'datetime'
                          ? 'datetime-local'
                          : field.type === 'integer' || field.type === 'number'
                            ? 'number'
                            : field.type === 'password' || key === 'password'
                              ? 'password'
                              : 'text'
                  }
                  className={inputClasses}
                  {...register(key, registerOptions)}
                />
              </Field>
              {field.description && (
                <p className="text-xs text-neutral-500">{field.description}</p>
              )}
              {field.minLength && field.type === 'string' && (
                <p className="text-xs text-neutral-400">Min {field.minLength} characters</p>
              )}
              {errors[key] && (
                <p role="alert" className="text-sm text-red-600">
                  {errors[key]?.message as string}
                </p>
              )}
              {fieldError && (
                <p role="alert" className="text-sm text-red-600">
                  {fieldError.message}
                </p>
              )}
            </div>
          );
        })}

        <div className="flex flex-wrap items-center gap-3 border-t border-black/10 pt-8">
          <button
            type="button"
            onClick={() => router.push(`/forms/${formId}`)}
            className="border border-black/10 px-6 py-4 text-sm font-medium transition hover:border-neutral-900"
          >
            Back to Form
          </button>

          <Link
            href="/forms"
            className="border border-black/10 px-6 py-4 text-sm font-medium transition hover:border-neutral-900"
          >
            All Forms
          </Link>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-neutral-900 px-10 py-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-500"
          >
            {status === 'loading' ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </section>
  );
}