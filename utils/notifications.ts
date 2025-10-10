// Thin wrapper re-exporting the implementation from src so imports using
// `@/utils/notifications` (which map to ./utils/notifications) work reliably.
export async function sendNotification(...args: any[]) {
    const mod = await import('../src/utils/notifications');
	if (mod && typeof mod.sendNotification === 'function') {
		return (mod.sendNotification as any)(...args);
	}
	if (mod && typeof mod.default === 'function') {
		return (mod.default as any)(...args);
	}
	return { ok: false };
}

export { default } from '../src/utils/notifications';
