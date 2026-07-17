export function formatCurrency(value: number, locale: string) {
  return `${value.toLocaleString(locale, { maximumFractionDigits: 2, minimumFractionDigits: 2 })} kr`;
}

export function formatPriceDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

export function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}
