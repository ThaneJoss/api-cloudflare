import { z } from 'zod'

export const contactPayloadSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  message: z.string().trim().min(1).max(5000),
})

export type ContactPayload = z.infer<typeof contactPayloadSchema>
