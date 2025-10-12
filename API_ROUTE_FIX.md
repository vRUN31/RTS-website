# Quick API Route Fix

## Problem
API routes were returning HTML instead of JSON because Next.js couldn't find them.

## Solution
Created re-export files in `app/api/bookings/` that point to the actual implementations in `src/app/api/bookings/`.

## Files Created
1. `app/api/bookings/approve/route.ts` - Re-exports from src
2. `app/api/bookings/reject/route.ts` - Re-exports from src

## How to Verify Routes Are Working

### Method 1: Browser DevTools
1. Open browser: http://localhost:3002
2. Open DevTools → Console
3. Run this command:
```javascript
// Test approve endpoint
fetch('/api/bookings/approve', {
  method: 'GET'
}).then(r => r.json()).then(console.log);

// Test reject endpoint  
fetch('/api/bookings/reject', {
  method: 'GET'
}).then(r => r.json()).then(console.log);
```

**Expected Response** (both should return JSON):
```json
{
  "message": "Approve/Reject API endpoint is working",
  "env": {
    "hasSupabaseUrl": true,
    "hasSupabaseKey": true
  }
}
```

### Method 2: Direct Browser Visit
1. Visit: http://localhost:3002/api/bookings/approve
2. Visit: http://localhost:3002/api/bookings/reject

**Expected**: You should see JSON response, NOT HTML

### Method 3: cURL (PowerShell)
```powershell
# Test approve endpoint
curl http://localhost:3002/api/bookings/approve

# Test reject endpoint
curl http://localhost:3002/api/bookings/reject
```

## After Restarting Dev Server

**IMPORTANT**: You must restart the dev server for the new routes to be recognized:

1. Stop current dev server (Ctrl+C in terminal)
2. Run: `npm run dev`
3. Wait for "Ready" message
4. Test the routes using any method above

## Troubleshooting

### Still getting HTML response?
1. ✅ Verify dev server restarted
2. ✅ Clear browser cache (Ctrl+Shift+R)
3. ✅ Check files exist:
   - `app/api/bookings/approve/route.ts`
   - `app/api/bookings/reject/route.ts`
4. ✅ Check Next.js console for route registration

### Routes registered successfully looks like:
```
○ Compiling /api/bookings/approve ...
○ Compiling /api/bookings/reject ...
✓ Compiled /api/bookings/approve in XXXms
✓ Compiled /api/bookings/reject in XXXms
```

## Test Full Booking Flow

Once routes are verified:

1. **Login as Admin**
2. **Navigate to Admin Dashboard**
3. **Find a pending booking** (status: submitted)
4. **Click "Approve"** button
5. **Select a truck** from modal
6. **Click "Assign & Approve"**
7. **Check browser console** - Should see:
   ```
   [AssignTruck] POST http://localhost:3002/api/bookings/approve {...}
   [AssignTruck] Response status: 200
   [AssignTruck] Success response: {ok: true, ...}
   ```

8. **Switch to client window** - Notification should appear instantly!

## Next Steps

After verifying routes work:
1. Test approve functionality
2. Test reject functionality
3. Verify real-time notifications
4. Run database migrations
5. Test complete system

---

**Status**: ✅ Fixed - Routes now properly exported
**Action Required**: Restart dev server to apply changes
