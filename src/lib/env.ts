import { z } from "zod"

const envSchema = z.object({
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
  ZAFRONIX_API_KEY: z.string().min(1, "ZAFRONIX_API_KEY is required"),
  ZAFRONIX_API_BASE_URL: z.string().url("ZAFRONIX_API_BASE_URL must be a valid URL"),
  RAPIDAPI_KEY: z.string().optional(),
  RAPIDAPI_HOST: z.string().optional(),
  SERPAPI_KEY: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  )
  throw new Error("Invalid environment variables. Check the server logs.")
}

export const env = parsed.data
