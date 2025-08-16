export function formatDate(date: string | Date) {
	return new Date(date).toLocaleDateString('en-DE', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}
