import { z } from "zod"

export const subscriptionKindSchema = z.enum(["streaming", "gaming", "software"])
export const subscriptionStatusSchema = z.enum(["active", "paused", "cancelled"])
export const billingCycleSchema = z.enum(["monthly", "quarterly", "annual"])

export const subscriptionSchema = z.object({
  name: z.string().min(1, "Requerido"),
  kind: subscriptionKindSchema,
  monthly_price: z.number().min(0, "Debe ser 0 o mayor"),
  billing_cycle: billingCycleSchema.default("monthly"),
  renewal_date: z.string(),
  account_id: z.string().uuid("Selecciona una cuenta"),
  username: z.string().optional().default(""),
  status: subscriptionStatusSchema.default("active"),
})

export type SubscriptionKind = z.infer<typeof subscriptionKindSchema>
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>
export type BillingCycle = z.infer<typeof billingCycleSchema>
export type SubscriptionForm = z.infer<typeof subscriptionSchema>

export const gamePlatformSchema = z.enum(["PC", "PS5", "Xbox", "Switch", "Mobile"])
export const gameStatusSchema = z.enum(["owned", "wishlist", "playing", "finished"])

export const gameSchema = z.object({
  title: z.string().min(1, "Requerido"),
  platform: gamePlatformSchema,
  status: gameStatusSchema.default("owned"),
  purchase_date: z.string().optional().default(""),
  purchase_price: z.number().min(0).default(0),
  cover_url: z.string().optional().default(""),
})

export type GamePlatform = z.infer<typeof gamePlatformSchema>
export type GameStatus = z.infer<typeof gameStatusSchema>
export type GameForm = z.infer<typeof gameSchema>

export const watchlistKindSchema = z.enum(["movie", "tv"])
export const watchlistStatusSchema = z.enum(["pending", "watching", "watched"])

export const watchlistItemSchema = z.object({
  title: z.string().min(1, "Requerido"),
  kind: watchlistKindSchema,
  status: watchlistStatusSchema.default("pending"),
  rating: z.number().min(0).max(10).default(0),
})

export type WatchlistKind = z.infer<typeof watchlistKindSchema>
export type WatchlistStatus = z.infer<typeof watchlistStatusSchema>
export type WatchlistItemForm = z.infer<typeof watchlistItemSchema>

export const SUBSCRIPTION_KIND_LABELS: Record<SubscriptionKind, string> = {
  streaming: "Streaming",
  gaming: "Gaming",
  software: "Software",
}

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: "Activa",
  paused: "Pausada",
  cancelled: "Cancelada",
}

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: "Mensual",
  quarterly: "Trimestral",
  annual: "Anual",
}

export const GAME_PLATFORM_LABELS: Record<GamePlatform, string> = {
  PC: "PC",
  PS5: "PS5",
  Xbox: "Xbox",
  Switch: "Switch",
  Mobile: "Móvil",
}

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  owned: "Comprado",
  wishlist: "Deseado",
  playing: "Jugando",
  finished: "Terminado",
}

export const WATCHLIST_KIND_LABELS: Record<WatchlistKind, string> = {
  movie: "Película",
  tv: "Serie",
}

export const WATCHLIST_STATUS_LABELS: Record<WatchlistStatus, string> = {
  pending: "Pendiente",
  watching: "Viendo",
  watched: "Visto",
}
