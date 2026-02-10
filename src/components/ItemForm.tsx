import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ui, itemStatusLabel } from '@/lib/i18n'
import { ITEM_STATUSES } from '@/types/enums'
import type { Item } from '@/types/db'

const itemUpdateSchema = z.object({
  status: z.enum(ITEM_STATUSES as unknown as [string, ...string[]]),
  status_reason: z.string().optional(),
  next_step: z.string().optional(),
  target_date: z.string().optional(),
})

export type ItemUpdateFormValues = z.infer<typeof itemUpdateSchema>

interface ItemFormProps {
  item: Item
  onSubmit: (values: ItemUpdateFormValues) => Promise<void>
  disabled?: boolean
}

export function ItemForm({ item, onSubmit, disabled }: ItemFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ItemUpdateFormValues>({
    resolver: zodResolver(itemUpdateSchema),
    defaultValues: {
      status: item.status,
      status_reason: item.status_reason ?? '',
      next_step: item.next_step ?? '',
      target_date: item.target_date ? item.target_date.slice(0, 10) : '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{ui.status}</label>
        <select
          {...register('status')}
          className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        >
          {ITEM_STATUSES.map((s) => (
            <option key={s} value={s}>
              {itemStatusLabel(s)}
            </option>
          ))}
        </select>
        {errors.status && (
          <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{ui.statusReason}</label>
        <textarea
          {...register('status_reason')}
          rows={2}
          className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{ui.nextStep}</label>
        <input
          type="text"
          {...register('next_step')}
          className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{ui.targetDate}</label>
        <input
          type="date"
          {...register('target_date')}
          className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <button
        type="submit"
        disabled={disabled || isSubmitting}
        className="rounded-lg bg-brand-600 py-2.5 px-5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 shadow-sm"
      >
        {isSubmitting ? ui.saving : ui.saveUpdate}
      </button>
    </form>
  )
}
