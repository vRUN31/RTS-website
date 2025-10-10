export type NotificationChannel = 'inapp' | 'sms' | 'email' | 'whatsapp';

// Accept flexible argument shapes so call sites can use different signatures.
export async function sendNotification(...args: any[]) {
	// Minimal no-op implementation for build / dev.
	// In production, hook this to your notification service (SES/SNS/Twilio, etc.).
	console.log('[sendNotification] args=', args);
	return { ok: true };
}

export default sendNotification;
