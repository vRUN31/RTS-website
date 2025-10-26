# Authentication & Authorization Flow - Detailed Explanation

**Date:** October 26, 2025  
**Version:** 2.4  
**Status:** ✅ Production Implementation

---

## Overview

This document explains the actual authentication and authorization flow implemented in the RTS (Rajmohan Transport Services) application. The flow differs from traditional Next.js middleware-based authentication as the middleware is currently disabled.

---

## 🏗️ Architecture Components

### 1. **Client-Side Authentication Pages**
- `/login/page.tsx` - Client component for user login
- `/register/page.tsx` - Client component for user registration

### 2. **Server-Side Protected Pages**
- `/admin/page.tsx` - Admin dashboard (Server Component)
- `/dashboard/customer/page.tsx` - Client dashboard (Client Component)
- `/bookings/page.tsx` - Bookings management
- `/documents/page.tsx` - Document management
- And more...

### 3. **Supabase Integration**
- **Client Helper:** `@/utils/supabase/client` - For client components
- **Server Helper:** `@/utils/supabase/server` - For Server Components (SSR)
- **Auth Service:** Supabase Auth handles JWT tokens, sessions, cookies

### 4. **Database Layer**
- **profiles table:** Stores user role (admin/client), client_id, name, email
- **RLS Policies:** Row Level Security on all tables
- **Auth Schema:** Supabase auth.users table (managed by Supabase)

---

## 🔐 Login Flow (Step-by-Step)

### Step 1: User Opens Login Page
```
User navigates to /login
```
- Page: `/src/app/login/page.tsx` (Client Component)
- User sees role selector (Admin/Client) and login form
- **Admin role selection** requires email domain verification

### Step 2: Admin Email Domain Check (Client-Side)
```typescript
// Environment variables
NEXT_PUBLIC_ADMIN_EMAIL_DOMAINS = "example.com,admin.com"
NEXT_PUBLIC_ADMIN_EMAILS = "admin@company.com,boss@company.com"

// Check function
function isAdminEmailAllowed(mail: string) {
    const domain = mail.split('@')[1]?.toLowerCase();
    const domainOk = !!domain && adminDomains.includes(domain);
    const emailOk = adminEmails.includes(mail.toLowerCase());
    return domainOk || emailOk;
}
```

**Purpose:** Prevent unauthorized users from selecting admin role

### Step 3: Submit Credentials to Supabase Auth
```typescript
const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password
});
```

**What happens:**
- Supabase Auth verifies credentials against `auth.users` table
- If valid, returns session object with JWT token
- JWT is stored in httpOnly cookie automatically
- User ID is returned: `signInData.user.id`

### Step 4: Profile Management (Create or Update)
```typescript
// Check if profile exists
const { data: existingProfile } = await supabase
    .from('profiles')
    .select('role, name, email')
    .eq('id', userId)
    .maybeSingle();

if (!existingProfile) {
    // Bootstrap new profile
    await supabase
        .from('profiles')
        .upsert({ 
            id: userId, 
            role: intendedRole,  // 'admin' or 'client'
            email 
        })
        .throwOnError();
} else {
    // Update role if admin selected and allowed
    if (intendedRole === 'admin' && existingProfile.role !== 'admin') {
        await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', userId)
            .throwOnError();
    }
}
```

**Key Points:**
- Profile is created on first login if missing
- Admin role requires email domain approval
- Existing users can upgrade to admin if eligible
- Email and name are seeded during profile creation

### Step 5: Role-Based Redirect
```typescript
const target = finalRole === 'admin' ? '/admin' : '/dashboard/customer';
window.location.href = target;
```

**Result:**
- Admin users → `/admin` dashboard
- Client users → `/dashboard/customer` dashboard
- Full page navigation (not client-side router)

---

## 🛡️ Protected Page Access Flow

### Architecture Note
**Important:** Middleware is currently disabled (`/src/middleware.ts` returns `NextResponse.next()`). Each protected page implements its own authentication guard.

### Step 1: User Navigates to Protected Route

```
Example: User visits /admin
```

### Step 2: Server Component Checks Authentication
```typescript
// In /src/app/admin/page.tsx
import { cookies } from 'next/headers';
import { createClient as createServerSupabase } from '@/utils/supabase/server';

// Create SSR Supabase client
const cookieStore = await cookies();
const supabase = createServerSupabase(cookieStore);

// Verify JWT from httpOnly cookie
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
    redirect('/login');  // Not authenticated
}
```

**What happens:**
- Server Component runs on server (RSC)
- Reads httpOnly cookie containing JWT
- Supabase SSR client verifies JWT with Supabase Auth
- Returns user object if valid, null if invalid/expired

### Step 3: Role Authorization Check
```typescript
// Fetch user's role from profiles table
const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

if (error || !profile) {
    redirect('/login');  // Profile missing
}

if (profile.role !== 'admin') {
    redirect('/dashboard/customer');  // Wrong role
}

// ✅ User is authenticated AND authorized
// Continue rendering admin dashboard...
```

**Authorization Hierarchy:**
1. **Authentication:** Valid JWT (user exists)
2. **Authorization:** Correct role for the page
3. **Data Access:** RLS policies (next step)

### Step 4: Data Fetching with RLS
```typescript
// Fetch data - RLS policies apply automatically
const { data: shipments } = await supabase
    .from('shipments')
    .select('*')
    .gte('created_at', startDate.toISOString());
```

**RLS Policy Applied (in PostgreSQL):**
```sql
-- Example: Admin can view all shipments
CREATE POLICY "Admin can view all shipments" 
ON shipments 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);
```

**What happens:**
- Supabase automatically adds `WHERE` clause based on RLS policy
- Only data matching policy conditions is returned
- Admin sees all records
- Client sees only their own records (via `client_id` match)

### Step 5: Render Protected Content
```typescript
return (
    <AdminShell>
        <h1>Admin Dashboard</h1>
        {/* Display shipments, bookings, analytics, etc. */}
    </AdminShell>
);
```

---

## 📊 Row Level Security (RLS) Details

### How RLS Works in This App

**Key Concept:** RLS policies run on the database layer, not in application code.

### Example: Profiles Table RLS

```sql
-- Users can read their own profile
CREATE POLICY "profiles_self_read" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_self_update" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "profiles_admin_read" 
ON public.profiles 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);
```

### Common RLS Pattern in This App

**Pattern 1: Self Access**
```sql
USING (auth.uid() = user_id)
```
- User can only access their own records

**Pattern 2: Admin Access**
```sql
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
)
```
- Admin can access all records

**Pattern 3: Client Scoped Access**
```sql
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.client_id = table.client_id
    )
)
```
- Client can only access records for their company

### Note on is_admin() Function

**Current Implementation:** Inline SQL checks instead of helper function

```sql
-- NOT used:
-- public.is_admin(auth.uid())

-- Instead:
EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
)
```

---

## 🔄 Real-Time Updates Flow

### Subscription Setup (Client Component)

```typescript
// In customer dashboard (client component)
const supabase = createClient();

// Subscribe to shipments table changes
const subscription = supabase
    .channel('shipments_changes')
    .on(
        'postgres_changes',
        {
            event: '*',  // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'shipments',
            filter: `client_id=eq.${clientId}`  // Client-specific
        },
        (payload) => {
            console.log('Shipment updated:', payload);
            // Update React state to refresh UI
            fetchShipments();
        }
    )
    .subscribe();
```

**Flow:**
1. Client subscribes to Postgres changes via WebSocket
2. Database publishes changes when data is modified
3. Supabase Realtime Engine pushes updates to subscribed clients
4. React component updates state and re-renders

**RLS Still Applies:**
- Even in realtime subscriptions
- Client only receives updates for records they can access
- Filter by `client_id` for additional safety

---

## 🚀 Registration Flow

### Similar to Login, with Key Differences

**Step 1: User Fills Registration Form**
- First name, last name, username
- Email, password
- Role selection (Admin/Client)

**Step 2: Email Domain Validation**
```typescript
const emailDomain = email.split('@')[1]?.toLowerCase();
const domainSaysAdmin = adminDomains.includes(emailDomain);

if (role === 'admin' && !domainSaysAdmin) {
    throw new Error('Admin signup restricted to approved domains');
}
```

**Step 3: Create Auth Account**
```typescript
const { data, error } = await supabase.auth.signUp({
    email,
    password
});
```

**Possible Outcomes:**
1. **Immediate signup** (if email confirmation disabled)
   - User ID returned immediately
   - Profile created
   - Redirect to dashboard
   
2. **Email confirmation required** (production default)
   - User receives confirmation email
   - Must click link to activate account
   - Redirect to login page with message

**Step 4: Create Profile**
```typescript
const displayName = username || `${firstName} ${lastName}` || email;
await supabase
    .from('profiles')
    .upsert({
        id: userId,
        role: finalRole,
        name: displayName,
        email
    })
    .throwOnError();
```

---

## 🔒 Security Considerations

### 1. **Environment Variables Security**
```env
# Public (safe to expose to client)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_ADMIN_EMAIL_DOMAINS=example.com

# Private (server-only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # NEVER expose to client!
```

### 2. **JWT Token Storage**
- Stored in **httpOnly cookie** (cannot be accessed by JavaScript)
- Automatically sent with requests
- Secure, sameSite flags set by Supabase
- Auto-refresh handled by Supabase client

### 3. **Admin Access Control**

**Multi-Layer Protection:**
```
Layer 1: Client-side role selector (UX only)
    ↓
Layer 2: Environment variable email domain check (login/register)
    ↓
Layer 3: Server-side profile.role verification (protected pages)
    ↓
Layer 4: RLS policies (database queries)
```

**Why 4 layers?**
- Layer 1: Better UX, prevent accidents
- Layer 2: First security gate (client-side but required)
- Layer 3: True authorization check (server-side)
- Layer 4: Defense in depth (database-level)

### 4. **RLS as Final Defense**

**Even if application code is bypassed:**
- RLS policies run at database level
- Malicious queries still filtered by `auth.uid()`
- Cannot fake `auth.uid()` (cryptographically verified by Supabase)

---

## 🛠️ Common Patterns in Codebase

### Pattern 1: Server Component Auth Guard
```typescript
export default async function ProtectedPage() {
    // Auth guard
    const cookieStore = await cookies();
    const supabase = createServerSupabase(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) redirect('/login');
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, client_id')
        .eq('id', user.id)
        .single();
    
    if (profile?.role !== 'admin') redirect('/dashboard/customer');
    
    // Fetch data...
    return <div>Protected content</div>;
}
```

### Pattern 2: Client Component Auth Check
```typescript
export default function ClientComponent() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    
    useEffect(() => {
        const supabase = createClient();
        
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) {
                window.location.href = '/login';
                return;
            }
            setUser(user);
            
            supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
                .then(({ data }) => setProfile(data));
        });
    }, []);
    
    if (!user || !profile) return <div>Loading...</div>;
    return <div>Client component content</div>;
}
```

### Pattern 3: RLS-Scoped Data Fetching
```typescript
// Admin: fetch all shipments
const { data: allShipments } = await supabase
    .from('shipments')
    .select('*');
// RLS allows all because role='admin'

// Client: fetch only their shipments
const { data: myShipments } = await supabase
    .from('shipments')
    .select('*');
// RLS filters by client_id automatically
```

---

## 📝 Key Takeaways

### ✅ What This App Does
1. **Client-side login/register pages** handle authentication
2. **Each protected page** independently verifies auth (no middleware)
3. **Role stored in profiles table**, checked server-side
4. **RLS policies** enforce data access at database level
5. **Admin access** gated by email domain allowlist

### ❌ What This App Does NOT Do
1. **No centralized middleware authentication** (middleware is disabled)
2. **No `public.is_admin()` helper function** (uses inline SQL)
3. **No JWT verification in middleware** (done per-page)
4. **No role-based routing in middleware** (done client-side during login)

### 🎯 Why This Architecture?

**Advantages:**
- Simple, explicit auth checks in each page
- Easy to debug (no magic middleware)
- Flexible per-route auth logic
- RLS provides strong security baseline

**Trade-offs:**
- Code duplication (auth guard repeated in pages)
- No single place to update auth logic
- Slightly more server-side rendering work

**Future Consideration:**
- Re-enable middleware for centralized auth
- Create reusable auth guard HOC/wrapper
- Implement `public.is_admin()` for cleaner RLS policies

---

## 🧪 Testing Authentication

### Manual Test Checklist

**Test 1: Login as Client**
- [ ] Login with non-admin email
- [ ] Verify redirect to `/dashboard/customer`
- [ ] Verify profile.role = 'client' in database
- [ ] Verify cannot access `/admin`

**Test 2: Login as Admin**
- [ ] Login with admin domain email
- [ ] Verify redirect to `/admin`
- [ ] Verify profile.role = 'admin' in database
- [ ] Verify can access all admin routes

**Test 3: RLS Enforcement**
- [ ] Client cannot see other clients' shipments
- [ ] Admin can see all shipments
- [ ] Direct API calls respect RLS
- [ ] SQL queries in Supabase dashboard respect RLS (when using auth context)

**Test 4: Session Expiry**
- [ ] JWT expires after timeout
- [ ] User redirected to login
- [ ] Re-login restores session

---

## 🔗 Related Files

### Authentication Implementation
- `/src/app/login/page.tsx` - Login page
- `/src/app/register/page.tsx` - Registration page
- `/utils/supabase/client.ts` - Client Supabase helper
- `/utils/supabase/server.ts` - Server Supabase helper
- `/src/middleware.ts` - Middleware (currently disabled)

### Protected Pages (Examples)
- `/src/app/admin/page.tsx` - Admin dashboard
- `/src/app/dashboard/customer/page.tsx` - Client dashboard
- `/src/app/bookings/page.tsx` - Bookings management
- `/src/app/documents/page.tsx` - Document management

### Database Migrations
- `/supabase/migrations/2025-10-12-fix-profiles-rls.sql` - Profiles RLS policies
- `/supabase/migrations/2025-10-12-fleet-management-features.sql` - Fleet RLS policies
- `/supabase/migrations/2025-10-12-chat-system.sql` - Chat RLS policies

---

**Last Updated:** October 26, 2025  
**Author:** AI Agent (GitHub Copilot)  
**Status:** Comprehensive documentation of production authentication flow ✅
