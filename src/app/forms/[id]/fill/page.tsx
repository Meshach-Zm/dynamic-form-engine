import { notFound } from 'next/navigation'
import { FormRenderer } from '@/components/form-renderer/FormRenderer'
import type { JsonSchema } from '@/types/form'

interface FormVersion {
    id: string
    versionNumber: number
    schema: JsonSchema
}

interface FormTemplate {
    id: string
    name: string
    latestVersion: FormVersion | null
}

async function getForm(
    formId: string,
): Promise<FormTemplate | null> {
    const base =
        process.env.NEXT_PUBLIC_BASE_URL ??
        'http://localhost:3000'

    const res = await fetch(
        `${base}/api/forms/${formId}`,
        {
            cache: 'no-store',
        },
    )

    if (!res.ok) {
        return null
    }

    const json = await res.json()

    return json.data
}

export default async function FillFormPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const form = await getForm(id)

    if (!form || !form.latestVersion) {
        notFound()
    }

    return (
        <main className="mx-auto max-w-4xl px-6 py-10">
            <header className="mb-8 border-b border-black/10 pb-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                    Dynamic Form
                </p>

                <h1 className="mt-3 text-3xl font-black uppercase leading-[0.95] tracking-[0.08em] md:text-4xl">
                    {form.name}
                </h1>

                <p className="mt-3 text-sm text-neutral-600">
                    Version {form.latestVersion.versionNumber}
                </p>
            </header>

            <FormRenderer
                schema={form.latestVersion.schema}
                formVersionId={form.latestVersion.id}
                formName={form.name}
            />
        </main>
    )
}