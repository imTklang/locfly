import { z } from 'zod'

const today = new Date().toISOString().slice(0, 10)

export const searchSchema = z
  .object({
    location: z.string().min(2, 'Informe a cidade ou aeroporto'),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
      .refine((d) => d >= today, 'A data de retirada deve ser hoje ou futura'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  })
  .refine((d) => d.endDate > d.startDate, {
    message: 'A data de devolução deve ser após a retirada',
    path: ['endDate'],
  })

export type SearchFormValues = z.infer<typeof searchSchema>
