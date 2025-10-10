export async function sendEmail(recipient: string, subject: string, body: string) {
	console.log('[sendEmail] to=', recipient, 'subject=', subject);
	return { ok: true };
}

export async function sendSMS(to: string, message: string) {
	console.log('[sendSMS] to=', to, 'message=', message);
	return { ok: true };
}

export default { sendEmail, sendSMS };

