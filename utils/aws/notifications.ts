export async function sendEmail(...args: any[]) {
  const mod = await import('../../src/utils/aws/notifications');
  if (mod && typeof mod.sendEmail === 'function') return (mod.sendEmail as any)(...args);
  return { ok: false };
}

export async function sendSMS(...args: any[]) {
  const mod = await import('../../src/utils/aws/notifications');
  if (mod && typeof mod.sendSMS === 'function') return (mod.sendSMS as any)(...args);
  return { ok: false };
}

export * from '../../src/utils/aws/notifications';
export { default } from '../../src/utils/aws/notifications';
