import type { ExchangeRateForm } from "@/features/settings/schemas"

const BASE_CURRENCY = "NIO"

export function getRate(rates: ExchangeRateForm[], currency: string): number | null {
  const found = rates.find((r) => r.currency === currency)
  return found?.rate ?? null
}

export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRateForm[],
  baseCurrency: string
): number | null {
  if (fromCurrency === toCurrency) return amount

  if (fromCurrency === baseCurrency) {
    const targetRate = getRate(rates, toCurrency)
    if (!targetRate) return null
    return amount / targetRate
  }

  if (toCurrency === baseCurrency) {
    const sourceRate = getRate(rates, fromCurrency)
    if (!sourceRate) return null
    return amount * sourceRate
  }

  const sourceRate = getRate(rates, fromCurrency)
  const targetRate = getRate(rates, toCurrency)
  if (!sourceRate || !targetRate) return null

  const baseAmount = amount * sourceRate
  return baseAmount / targetRate
}

export function sumBalancesInBaseCurrency(
  accounts: { current_balance: number | null; currency: string; opening_balance?: number | null }[],
  rates: ExchangeRateForm[],
): number {
  return accounts.reduce((sum, a) => {
    const balance = (a.current_balance ?? (a as any).opening_balance ?? 0) as number
    if (a.currency === BASE_CURRENCY) return sum + balance
    const converted = convertAmount(balance, a.currency, BASE_CURRENCY, rates, BASE_CURRENCY)
    return sum + (converted ?? balance)
  }, 0)
}
