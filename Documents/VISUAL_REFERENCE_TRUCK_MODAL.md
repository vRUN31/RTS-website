# 🎨 Visual Reference - Truck Assignment Modal

## Before vs After Comparison

### BEFORE (Old Design)
```
┌──────────────────────────────────────────┐
│ Assign a Truck                       [×] │
├──────────────────────────────────────────┤
│                                          │
│ ○ TRK-001  MH-01-AB-1234  Running       │
│   Rajesh Kumar • +91-98765-43210        │
│                                          │
│ ○ TRK-002  MH-02-CD-5678  Running       │
│   Suresh Patil • +91-98765-43211        │
│                                          │
│ ○ TRK-003  MH-03-EF-9012  Halt          │
│   Amit Singh • +91-98765-43212          │
│                                          │
│                  [Continue]              │
└──────────────────────────────────────────┘
```
**Problem**: 
- ❌ No indication which trucks are busy
- ❌ Can select truck already on trip
- ❌ Causes conflicts and errors

---

### AFTER (New Design)

#### Scenario 1: Mixed Availability
```
┌──────────────────────────────────────────────────┐
│ Assign a Truck                               [×] │
├──────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────┐  │
│ │  🟢 [1]         🔴 [2]        ⚫ [3]       │  │
│ │  Available    On Trip        Total         │  │
│ └────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────┤
│                                                  │
│ ┌────────────────────────────────────────────┐  │
│ │ ✅ Available Trucks (1)                    │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ ○ TRK-003  MH-03-EF-9012  Running               │
│   Amit Singh                                     │
│   +91-98765-43212 • Lic: MH3456789 (exp 2026)  │
│                                                  │
│ ┌────────────────────────────────────────────┐  │
│ │ 🚫 Unavailable - On Active Trip (2)        │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ ⊗ TRK-001  MH-01-AB-1234  🚛 In Transit         │
│   Rajesh Kumar                            [BUSY] │
│   🚨 Currently en route to: Delhi                │
│                                                  │
│ ⊗ TRK-002  MH-02-CD-5678  🚛 In Transit         │
│   Suresh Patil                            [BUSY] │
│   🚨 Currently en route to: Bangalore            │
│                                                  │
│                  [Continue to Confirmation]      │
└──────────────────────────────────────────────────┘
```

**Benefits**:
- ✅ Clear visual separation (green vs red)
- ✅ Shows statistics at top
- ✅ Busy trucks grayed out
- ✅ Shows destination of active trip
- ✅ "BUSY" badge clearly visible
- ✅ Cannot select busy trucks

---

#### Scenario 2: All Trucks Available
```
┌──────────────────────────────────────────────────┐
│ Assign a Truck                               [×] │
├──────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────┐  │
│ │  🟢 [3]         🔴 [0]        ⚫ [3]       │  │
│ │  Available    On Trip        Total         │  │
│ └────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────┤
│                                                  │
│ ┌────────────────────────────────────────────┐  │
│ │ ✅ Available Trucks (3)                    │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ ○ TRK-001  MH-01-AB-1234  Running               │
│   Rajesh Kumar • +91-98765-43210                │
│                                                  │
│ ○ TRK-002  MH-02-CD-5678  Running               │
│   Suresh Patil • +91-98765-43211                │
│                                                  │
│ ○ TRK-003  MH-03-EF-9012  Halt                  │
│   Amit Singh • +91-98765-43212                  │
│                                                  │
│                  [Continue to Confirmation]      │
└──────────────────────────────────────────────────┘
```

**Benefits**:
- ✅ All trucks selectable
- ✅ Clear count: "3 Available, 0 On Trip"
- ✅ No confusion

---

#### Scenario 3: All Trucks Busy
```
┌──────────────────────────────────────────────────┐
│ Assign a Truck                               [×] │
├──────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────┐  │
│ │  🟢 [0]         🔴 [3]        ⚫ [3]       │  │
│ │  Available    On Trip        Total         │  │
│ └────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────┤
│                                                  │
│ ┌────────────────────────────────────────────┐  │
│ │ 🚫 Unavailable - On Active Trip (3)        │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ ⊗ TRK-001  MH-01-AB-1234  🚛 In Transit  [BUSY] │
│   Rajesh Kumar                                   │
│   🚨 Currently en route to: Delhi                │
│                                                  │
│ ⊗ TRK-002  MH-02-CD-5678  🚛 In Transit  [BUSY] │
│   Suresh Patil                                   │
│   🚨 Currently en route to: Bangalore            │
│                                                  │
│ ⊗ TRK-003  MH-03-EF-9012  🚛 In Transit  [BUSY] │
│   Amit Singh                                     │
│   🚨 Currently en route to: Chennai              │
│                                                  │
│ ┌────────────────────────────────────────────┐  │
│ │         ⚠️  All trucks are currently on    │  │
│ │             active trips                    │  │
│ │                                             │  │
│ │ Please wait for a truck to complete its    │  │
│ │ delivery before assigning a new booking    │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│              [Continue] (Disabled)               │
└──────────────────────────────────────────────────┘
```

**Benefits**:
- ✅ Yellow warning banner clearly visible
- ✅ All trucks shown as unavailable
- ✅ Button disabled (cannot proceed)
- ✅ Clear message explaining situation
- ✅ Admin knows to wait

---

## Color Coding

### Available Section
```css
background: #e7f5ed   /* Light green */
border: #28a745       /* Green */
text: #155724         /* Dark green */
```

**Visual**: Light green background with green border

### Unavailable Section
```css
background: #f8d7da   /* Light red */
border: #dc3545       /* Red */
text: #721c24         /* Dark red */
opacity: 0.6          /* Grayed out */
```

**Visual**: Light red background with red border, semi-transparent

### Warning Banner (All Busy)
```css
background: #fff3cd   /* Light yellow */
border: #ffc107       /* Amber */
text: #856404         /* Brown */
```

**Visual**: Yellow/amber banner with warning icon

### BUSY Badge
```css
background: #dc3545   /* Red */
color: white
padding: 2px 6px
border-radius: 3px
font-size: 11px
```

**Visual**: Small red pill badge with white text

---

## Icon Legend

| Icon | Meaning | Used Where |
|------|---------|------------|
| ✅ | Available/Success | Available section header |
| 🚫 | Unavailable/Blocked | Unavailable section header |
| 🚛 | In Transit | Status indicator for busy trucks |
| 🚨 | Warning/Alert | Active trip destination message |
| ⚠️ | Caution | All-busy warning banner |
| 🟢 | Available Count | Stats summary (green) |
| 🔴 | Busy Count | Stats summary (red) |
| ⚫ | Total Count | Stats summary (neutral) |
| ○ | Selectable | Radio button (available truck) |
| ⊗ | Disabled | Radio button (busy truck) |

---

## State Indicators

### Radio Button States

**Enabled (Available Truck)**:
```
○  Can be clicked
   Normal cursor
   Normal opacity
```

**Disabled (Busy Truck)**:
```
⊗  Cannot be clicked
   "not-allowed" cursor
   60% opacity
```

### Row Highlighting

**Selected Row**:
```
Background: Slightly darker
Border: Thicker
Visual emphasis
```

**Hover (Available)**:
```
Background: Light highlight
Cursor: Pointer
```

**Hover (Unavailable)**:
```
Background: No change
Cursor: not-allowed
```

---

## Responsive Behavior

### Desktop (Width > 768px)
- Stats in horizontal row (3 columns)
- Full truck information visible
- Standard modal width

### Tablet (Width 480-768px)
- Stats wrap to 2 columns
- Truck info slightly compressed
- Scrollable list

### Mobile (Width < 480px)
- Stats stack vertically
- Truck info condensed
- Full-screen modal
- Touch-friendly spacing

---

## Accessibility

### Screen Reader Announcements
```html
<div role="dialog" aria-modal="true" aria-label="Assign Truck">
  <input type="radio" aria-disabled="true" aria-label="Truck unavailable: TRK-001 on active trip to Delhi">
</div>
```

### Keyboard Navigation
- **Tab**: Move between trucks
- **Space**: Select truck (if available)
- **Enter**: Confirm selection
- **Esc**: Close modal

### Focus Indicators
- Clear focus ring on radio buttons
- Focus visible on all interactive elements
- Skip to "Continue" button (if enabled)

---

## Animation & Transitions

### Modal Open
```css
animation: fadeIn 0.2s ease-in
```

### Section Expand
```css
transition: height 0.3s ease
```

### Button State Change
```css
transition: all 0.15s ease
```

### Hover Effects
```css
transition: background-color 0.2s ease
```

---

## Edge Cases Handled

### No Trucks in System
```
┌────────────────────────────┐
│  🚛 No trucks found        │
│                            │
│  Add trucks to get started │
└────────────────────────────┘
```

### Truck Without Driver
```
○ TRK-001  MH-01-AB-1234  Running
  No driver linked
```

### Missing Driver Details
```
○ TRK-001  MH-01-AB-1234  Running
  Driver record missing (abc123...)
```

### Long Destination Names
```
🚨 Currently en route to: Very Long City Name That Might Wrap...
```
*Text wraps gracefully*

---

## Best Practices Followed

1. ✅ **Clear Visual Hierarchy**: Most important info (availability) at top
2. ✅ **Color Consistency**: Green = good, Red = unavailable, Yellow = warning
3. ✅ **Progressive Disclosure**: Show stats first, then details
4. ✅ **Error Prevention**: Disable instead of error messages
5. ✅ **Informative Feedback**: Show WHY truck is unavailable (destination)
6. ✅ **Accessibility**: Proper ARIA labels, keyboard support
7. ✅ **Responsive**: Works on all screen sizes
8. ✅ **Performance**: Minimal re-renders, efficient queries

---

## Implementation Notes

### Component Structure
```typescript
AssignTruckModal
├── Stats Summary (counts)
├── Available Section
│   ├── Header (green)
│   └── Truck List (selectable)
├── Unavailable Section
│   ├── Header (red)
│   └── Truck List (disabled)
├── Warning Banner (conditional)
└── Footer (Continue button)
```

### Data Flow
```
1. Modal opens
2. Fetch trucks from database
3. Fetch active shipments
4. Cross-reference truck_id
5. Annotate trucks with isOnActiveTrip
6. Separate into available/unavailable
7. Render with visual distinction
8. Disable unavailable trucks
9. Allow selection of available only
```

---

**Design Version**: 1.0
**Last Updated**: October 17, 2025
**Status**: ✅ **IMPLEMENTED**
