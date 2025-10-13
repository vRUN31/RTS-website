# 🎨 Route Map Booking - Visual Guide

## User Interface Components

### 1. Booking Button (Initial State)
```
┌─────────────────────────────────────────────────────┐
│ Place Order                                         │
│─────────────────────────────────────────────────────│
│ Book Truck with Details → Wait for Approval → ...  │
│                                                     │
│          ┌─────────────────────┐                   │
│          │  📦 Book Truck      │                   │
│          └─────────────────────┘                   │
└─────────────────────────────────────────────────────┘
```

### 2. Route Map Booking Interface (Expanded State)
```
┌──────────────────────────────────────────────────────────────────┐
│ Place Order                                                       │
│───────────────────────────────────────────────────────────────────│
│ Book Truck with Details → Wait for Approval → ...                │
│                                                                   │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │  📍  ┌──────────────────────────────────────────────────┐  │  │
│ │      │ Enter source location (e.g., Mumbai)        🔍  │  │  │
│ │      └──────────────────────────────────────────────────┘  │  │
│ │         ▼ Mumbai, Maharashtra, India                       │  │
│ │         ▼ Mumbai Central, Maharashtra, India              │  │
│ │         ▼ Mumbai Airport, Maharashtra, India              │  │
│ │                                                             │  │
│ │  🎯  ┌──────────────────────────────────────────────────┐  │  │
│ │      │ Enter destination location (e.g., Delhi)    🔍  │  │  │
│ │      └──────────────────────────────────────────────────┘  │  │
│ │         ▼ New Delhi, Delhi, India                          │  │
│ │         ▼ Delhi Airport, Delhi, India                      │  │
│ │         ▼ Delhi NCR, India                                 │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │         [    📍    ]                    ═══════════════       ││
│ │                                                               ││
│ │                                                               ││
│ │                          ═══════                              ││
│ │                    ═══════                                    ││
│ │              ═══════                                          ││
│ │        ═══════                                                ││
│ │   ═════                                                       ││
│ │  ╪                                                            ││
│ │   ════════                                                    ││
│ │           ══════════                                          ││
│ │                   ════════════                                ││
│ │                             ═══════════════                   ││
│ │                                        [    🎯    ]           ││
│ │                                                               ││
│ └──────────────────────────────────────────────────────────────┘│
│  Legend: 📍 Green = Source | 🎯 Red = Destination | ═ Route    │
│                                                                   │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Distance        Estimated Time         🗑️ Clear Route     │  │
│ │ 1,418 km        18h 42m                                    │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Selected Route:                                            │  │
│ │ From: Mumbai, Maharashtra, India                           │  │
│ │ To: New Delhi, Delhi, India                                │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│ ┌─────────────────────────────────────────────────┐             │
│ │ Select Vehicle Type                        ▼    │             │
│ └─────────────────────────────────────────────────┘             │
│ ┌─────────────────────────────────────────────────┐             │
│ │ Material                                         │             │
│ └─────────────────────────────────────────────────┘             │
│ ┌─────────────────────────────────────────────────┐             │
│ │ Weight (MT)                                      │             │
│ └─────────────────────────────────────────────────┘             │
│ ┌─────────────────────────────────────────────────┐             │
│ │ Pickup Date                     📅               │             │
│ └─────────────────────────────────────────────────┘             │
│ ┌─────────────────────────────────────────────────┐             │
│ │ Notes (optional)                                 │             │
│ └─────────────────────────────────────────────────┘             │
│                                                                   │
│  ┌─────────────────────┐  ┌──────────┐                          │
│  │ ✅ Submit Booking   │  │ Cancel   │                          │
│  └─────────────────────┘  └──────────┘                          │
└──────────────────────────────────────────────────────────────────┘
```

## Color Scheme

### Light Mode
```
┌─────────────────────────────────────────┐
│ Background:          #f9f9f9            │
│ Card Background:     #ffffff            │
│ Border:              #dedede            │
│ Text:                #333333            │
│ Text Dim:            #666666            │
│ Brand (Route Line):  #ff4d00 (Orange)   │
│ Input Background:    #ffffff            │
│ Hover Background:    #f0f0f0            │
└─────────────────────────────────────────┘
```

### Dark Mode
```
┌─────────────────────────────────────────┐
│ Background:          #1e1e1e            │
│ Card Background:     #2a2a2a            │
│ Border:              #444444            │
│ Text:                #e0e0e0            │
│ Text Dim:            #b0b0b0            │
│ Brand (Route Line):  #ff4d00 (Orange)   │
│ Input Background:    #1e1e1e            │
│ Hover Background:    #333333            │
└─────────────────────────────────────────┘
```

## Map Markers

### Source Marker (Green)
```
        ▲
       ████
      ██████
     ████████
    ██████████
   ████████████
  ██████████████
   │        │
   │        │
   │   📍   │  ← Green color (#2ecc71 equivalent)
   │        │
   └────────┘
    ▼▼▼▼▼▼
      ▼▼▼
       ▼
```

### Destination Marker (Red)
```
        ▲
       ████
      ██████
     ████████
    ██████████
   ████████████
  ██████████████
   │        │
   │        │
   │   🎯   │  ← Red color (#e74c3c equivalent)
   │        │
   └────────┘
    ▼▼▼▼▼▼
      ▼▼▼
       ▼
```

## Route Line Styles

### Active Route (OSRM Success)
```
Solid orange line (#ff4d00)
Weight: 4px
Opacity: 0.7

Source ●═══════════════════════════● Destination
       ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
       Follows actual road network
```

### Fallback Route (Straight Line)
```
Dashed orange line (#ff4d00)
Weight: 3px
Opacity: 0.5
Dash array: "10, 10"

Source ●- - - - - - - - - - - - - -● Destination
       ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
       Direct line (used when API fails)
```

## Interactive States

### 1. Initial State
```
┌───────────────────────────────────────┐
│ 📍 [Enter source location...    ]    │
│                                       │
│ 🎯 [Enter destination location...]   │
└───────────────────────────────────────┘
```

### 2. Typing State (Source)
```
┌───────────────────────────────────────┐
│ 📍 [Mumb|                      ] 🔍   │  ← Loading indicator
└───────────────────────────────────────┘
```

### 3. Suggestions Shown
```
┌───────────────────────────────────────┐
│ 📍 [Mumbai                     ]      │
│    ┌───────────────────────────────┐  │
│    │ Mumbai, Maharashtra, India   │◄─ Clickable
│    │ Mumbai Central, MH, India    │◄─ Clickable
│    │ Mumbai Airport, MH, India    │◄─ Clickable
│    └───────────────────────────────┘  │
└───────────────────────────────────────┘
```

### 4. Location Selected
```
┌───────────────────────────────────────────────────┐
│ 📍 [Mumbai, Maharashtra, India              ]    │
│                                                   │
│      [Map shows green marker at Mumbai]          │
└───────────────────────────────────────────────────┘
```

### 5. Both Locations Selected (Route Calculating)
```
┌────────────────────────────────────────────────────┐
│ Distance        Estimated Time                     │
│ ...             ...                   ⏳ Loading   │
└────────────────────────────────────────────────────┘
```

### 6. Route Calculated
```
┌────────────────────────────────────────────────────┐
│ Distance        Estimated Time    🗑️ Clear Route  │
│ 1,418 km        18h 42m                            │
└────────────────────────────────────────────────────┘
         ↑              ↑                    ↑
    Calculated    Calculated           Reset button
```

## Autocomplete Dropdown Styling

### Light Mode Dropdown
```
┌─────────────────────────────────────────────┐
│ [Mumbai                               ] 🔍  │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐ ← Border: #dedede
│ Mumbai, Maharashtra, India                  │   Hover: #f0f0f0
├─────────────────────────────────────────────┤
│ Mumbai Central, Maharashtra, India          │
├─────────────────────────────────────────────┤
│ Mumbai Airport, Maharashtra, India          │
└─────────────────────────────────────────────┘
```

### Dark Mode Dropdown
```
┌─────────────────────────────────────────────┐
│ [Mumbai                               ] 🔍  │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐ ← Border: #444
│ Mumbai, Maharashtra, India                  │   Hover: #333
├─────────────────────────────────────────────┤   Background: #2a2a2a
│ Mumbai Central, Maharashtra, India          │   Text: #e0e0e0
├─────────────────────────────────────────────┤
│ Mumbai Airport, Maharashtra, India          │
└─────────────────────────────────────────────┘
```

## Route Info Panel

### Success State
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  🏁 Distance          ⏱️ Estimated Time      🗑️ Clear Route   │
│     1,418 km              18h 42m                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
   ↑                      ↑                         ↑
Brand orange (#ff4d00)  Brand orange           Hover: Border orange
Gradient background: rgba(255, 77, 0, 0.1) to rgba(255, 77, 0, 0.05)
Border-left: 4px solid #ff4d00
```

### Loading State
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  🏁 Distance          ⏱️ Estimated Time                        │
│     ...                   ...                  ⏳ Calculating  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Selected Route Display

```
┌────────────────────────────────────────────────────────────────┐
│ Selected Route:                                                │
│ From: Mumbai, Maharashtra, India                               │
│ To: New Delhi, Delhi, India                                    │
└────────────────────────────────────────────────────────────────┘
  ↑
Border: 2px solid var(--border)
Background: var(--card)
Padding: 12px 16px
Border-radius: 8px
Font-weight: Label = 600, Values = 400
```

## Responsive Behavior

### Desktop View (> 768px)
```
┌──────────────────────────────────────────────────────────────┐
│  📍 Source input                                             │
│  🎯 Destination input                                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                     Map (400px height)                  │ │
│  │                                                          │ │
│  └────────────────────────────────────────────────────────┘ │
│  Route Info: Distance | ETA | Clear                          │
└──────────────────────────────────────────────────────────────┘
```

### Mobile View (< 768px)
```
┌────────────────────────┐
│ 📍 Source input        │
│                        │
│ 🎯 Destination input   │
│                        │
│ ┌────────────────────┐ │
│ │      Map           │ │
│ │   (300px height)   │ │
│ │                    │ │
│ └────────────────────┘ │
│                        │
│ Distance: 1,418 km     │
│ ETA: 18h 42m           │
│ [Clear Route]          │
└────────────────────────┘
```

## Animation Effects

### Marker Placement
```
1. Fade in:     opacity: 0 → 1 (0.3s ease)
2. Scale up:    scale: 0.5 → 1 (0.3s ease)
3. Bounce:      translateY: -10px → 0 (0.5s ease-out)
```

### Route Drawing
```
1. Line animates from source to destination
2. Stroke-dasharray animation creates "drawing" effect
3. Duration: 1.5s ease-in-out
```

### Autocomplete Dropdown
```
1. Slide down:  translateY: -10px → 0 (0.2s ease)
2. Fade in:     opacity: 0 → 1 (0.2s ease)
```

### Route Info Panel
```
1. Slide up:    translateY: 20px → 0 (0.3s ease)
2. Fade in:     opacity: 0 → 1 (0.3s ease)
```

## Error States

### No Results Found
```
┌─────────────────────────────────────────┐
│ 📍 [Xyzabc                        ] 🔍  │
│    ┌─────────────────────────────────┐  │
│    │ No locations found              │  │
│    │ Try a different search term     │  │
│    └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### API Error
```
┌─────────────────────────────────────────┐
│ ⚠️ Route calculation failed             │
│    Showing straight-line distance       │
│    Distance: ~1,400 km (approximate)    │
└─────────────────────────────────────────┘
```

### Validation Error
```
┌─────────────────────────────────────────────────┐
│ ❌ Please select both source and destination   │
│    on the map before submitting.               │
└─────────────────────────────────────────────────┘
```

## Accessibility Features

### Keyboard Navigation
```
Tab Order:
1. Source input field
2. Source suggestions (arrow keys to navigate)
3. Destination input field
4. Destination suggestions (arrow keys to navigate)
5. Clear Route button
6. Submit Booking button
7. Cancel button
```

### ARIA Labels
```
<input aria-label="Source location" />
<input aria-label="Destination location" />
<div role="dialog" aria-modal="true" aria-label="Route Planning Map" />
<div role="alert">Error messages</div>
<div role="status">Success messages</div>
```

### Screen Reader Announcements
```
"Source location selected: Mumbai, Maharashtra, India"
"Destination location selected: New Delhi, Delhi, India"
"Route calculated: 1,418 kilometers, estimated time 18 hours 42 minutes"
"Route cleared"
```

## Performance Indicators

### Loading States
```
Map initializing:     "Loading map…"
Searching locations:  "🔍" icon in input
Calculating route:    "..." in distance/ETA fields
Submitting booking:   "⏳ Submitting…" button text
```

### Success Indicators
```
Location selected:    Green/Red marker appears
Route calculated:     Orange line drawn + info panel shows
Booking submitted:    "✅ Booking submitted! Our team will review..."
```

---

**Design Consistency:** All elements follow the existing RTS dashboard design system  
**User Testing:** Optimized for 3-click booking process  
**Mobile-First:** Touch-friendly targets (min 44×44px)  
**Color Contrast:** WCAG AA compliant (4.5:1 minimum)
