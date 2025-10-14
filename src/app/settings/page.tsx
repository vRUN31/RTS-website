import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient as createServerSupabase } from '@/utils/supabase/server';
import SettingsContent from './_settings-content.client';

export default async function SettingsPage() {
  // SSR guard: authenticated users only
  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore as any);
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  // Get user profile to determine role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name, email')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = profile?.role === 'admin';

  // Fetch user settings
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // Fetch notification preferences
  const { data: notificationPrefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // Fetch system config if admin
  let systemConfig = null;
  if (isAdmin) {
    const { data } = await supabase
      .from('system_config')
      .select('*')
      .in('config_type', ['pricing', 'operational']);
    systemConfig = data;
  }

  return (
    <SettingsContent 
      user={user}
      profile={profile}
      isAdmin={isAdmin}
      initialSettings={userSettings}
      initialNotificationPrefs={notificationPrefs}
      initialSystemConfig={systemConfig}
    />
  );
}
