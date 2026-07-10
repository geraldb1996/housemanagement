export const queryKeys = {
  household: {
    all: ["household"] as const,
    detail: (id: string) => ["household", id] as const,
    members: (id: string) => ["household", id, "members"] as const,
    settings: (id: string) => ["household", id, "settings"] as const,
  },
  profiles: {
    mine: ["profiles", "me"] as const,
    byId: (id: string) => ["profiles", id] as const,
  },
  accounts: {
    all: (householdId: string) => ["accounts", householdId] as const,
    detail: (id: string) => ["accounts", "detail", id] as const,
    active: (householdId: string) => ["accounts", householdId, "active"] as const,
    balances: (householdId: string) => ["accounts", householdId, "balances"] as const,
  },
  categories: {
    all: (householdId: string) => ["categories", householdId] as const,
    byKind: (householdId: string, kind: string) => ["categories", householdId, kind] as const,
  },
  paymentCycles: {
    all: (householdId: string) => ["payment-cycles", householdId] as const,
  },
  people: {
    all: (householdId: string) => ["people", householdId] as const,
  },
  transactions: {
    all: (householdId: string) => ["transactions", householdId] as const,
    list: (householdId: string, filters: Record<string, unknown>) =>
      ["transactions", householdId, "list", filters] as const,
    detail: (id: string) => ["transactions", "detail", id] as const,
    splits: (transactionId: string) => ["transactions", "splits", transactionId] as const,
    byAccount: (accountId: string) => ["transactions", "account", accountId] as const,
  },
  paymentObligations: {
    all: (householdId: string) => ["obligations", householdId] as const,
    detail: (id: string) => ["obligations", "detail", id] as const,
    payments: (obligationId: string) => ["obligations", "payments", obligationId] as const,
    open: (householdId: string) => ["obligations", householdId, "open"] as const,
  },
  budgets: {
    all: (householdId: string) => ["budgets", householdId] as const,
    detail: (id: string) => ["budgets", "detail", id] as const,
    lines: (budgetId: string) => ["budgets", "lines", budgetId] as const,
    byMonth: (householdId: string, month: string) => ["budgets", householdId, month] as const,
  },
  monthlyClosings: {
    all: (householdId: string) => ["monthly-closings", householdId] as const,
  },
  shoppingLists: {
    all: (householdId: string) => ["shopping-lists", householdId] as const,
    detail: (id: string) => ["shopping-lists", "detail", id] as const,
    items: (listId: string) => ["shopping-lists", "items", listId] as const,
  },
  products: {
    all: (householdId: string) => ["products", householdId] as const,
    favorites: (householdId: string) => ["products", householdId, "favorites"] as const,
  },
  shoppingCategories: {
    all: (householdId: string) => ["shopping-categories", householdId] as const,
  },
  subscriptions: {
    all: (householdId: string) => ["subscriptions", householdId] as const,
    detail: (id: string) => ["subscriptions", "detail", id] as const,
    active: (householdId: string) => ["subscriptions", householdId, "active"] as const,
  },
  games: {
    all: (householdId: string) => ["games", householdId] as const,
  },
  watchlist: {
    all: (householdId: string) => ["watchlist", householdId] as const,
  },
  documentFolders: {
    all: (householdId: string) => ["document-folders", householdId] as const,
    tree: (householdId: string) => ["document-folders", householdId, "tree"] as const,
  },
  documents: {
    all: (householdId: string) => ["documents", householdId] as const,
    byFolder: (folderId: string) => ["documents", "folder", folderId] as const,
    detail: (id: string) => ["documents", "detail", id] as const,
  },
  inventory: {
    all: (householdId: string) => ["inventory", householdId] as const,
    detail: (id: string) => ["inventory", "detail", id] as const,
    maintenance: (itemId: string) => ["inventory", "maintenance", itemId] as const,
  },
  pets: {
    all: (householdId: string) => ["pets", householdId] as const,
    detail: (id: string) => ["pets", "detail", id] as const,
    medicalRecords: (petId: string) => ["pets", "medical-records", petId] as const,
    vaccinations: (petId: string) => ["pets", "vaccinations", petId] as const,
  },
  vehicles: {
    all: (householdId: string) => ["vehicles", householdId] as const,
    detail: (id: string) => ["vehicles", "detail", id] as const,
    serviceRecords: (vehicleId: string) => ["vehicles", "service-records", vehicleId] as const,
  },
  tags: {
    all: (householdId: string) => ["tags", householdId] as const,
  },
  exchangeRates: {
    household: (householdId: string) => ["exchange-rates", householdId] as const,
  },
  reminders: {
    all: (householdId: string) => ["reminders", householdId] as const,
    upcoming: (householdId: string) => ["reminders", householdId, "upcoming"] as const,
  },
  notifications: {
    all: (householdId: string) => ["notifications", householdId] as const,
    unread: (householdId: string) => ["notifications", householdId, "unread"] as const,
  },
  dashboard: {
    summary: (householdId: string) => ["dashboard", householdId, "summary"] as const,
    netWorth: (householdId: string) => ["dashboard", householdId, "net-worth"] as const,
    monthlySpending: (householdId: string, month: string) =>
      ["dashboard", householdId, "monthly-spending", month] as const,
  },
}
