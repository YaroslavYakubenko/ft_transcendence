export function formatMatchDate(dateStr: string, locale: string): string {
	return new Date(dateStr).toLocaleString(locale, {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
}
