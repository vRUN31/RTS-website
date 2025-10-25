# Dark Mode Updates for Advanced Truck Management Page

## Overview
Updated the Advanced Truck Management page to fully support dark mode, ensuring all white backgrounds properly transition to dark theme colors that match the overall UI/UX.

## Changes Made

### CSS Variable Consistency
Updated all hardcoded color values to use the global CSS variables defined in `globals.css`:

**Light Mode Colors:**
- `--bg: #f6f6f6` - Main background
- `--card: #ffffff` - Card/container backgrounds
- `--text: #111111` - Primary text
- `--border: #e2e8f0` - Borders

**Dark Mode Colors:**
- `--bg: #0a0f1e` - Main background (dark navy)
- `--card: #1a2332` - Card/container backgrounds (dark blue-gray)
- `--text: #f8fafc` - Primary text (off-white)
- `--border: #2d3748` - Borders (muted gray)

### Updated Components

#### 1. Main Container (`.manage-trucks-main`)
- **Before**: Used `var(--card, #f6f6f6)` and `#1e1e1e` for dark mode
- **After**: Uses `var(--bg, #f6f6f6)` and `#0a0f1e` for proper background consistency

#### 2. Statistics Cards (`.stat-card`)
- **Before**: Dark mode used `#2a2a2a`
- **After**: Uses `var(--card, #1a2332)` for consistent card styling

#### 3. Statistics Text (`.stat-value`)
- **Before**: Dark mode used `#e0e0e0`
- **After**: Uses `var(--text, #f8fafc)` for proper text contrast

#### 4. Search & Filter Inputs
- **Before**: Dark mode used `#2a2a2a` background
- **After**: Uses `var(--card, #1a2332)` with proper border colors

#### 5. Add Form Container (`.add-form-container`)
- **Before**: Dark mode used `#2a2a2a`
- **After**: Uses `var(--card, #1a2332)`

#### 6. Form Inputs (`.truck-form input, .truck-form select`)
- **Before**: Dark mode used `#1e1e1e` background
- **After**: Uses `var(--card, #1a2332)` with `--text` and `--border` variables

#### 7. Results Info (`.results-info`)
- **Before**: Dark mode used `#252525`
- **After**: Uses `var(--card, #1a2332)`

#### 8. Results Heading (`.results-info h2`)
- **Before**: Dark mode used `#e0e0e0`
- **After**: Uses `var(--text, #f8fafc)`

#### 9. Truck Table (`.truck-table`)
- **Before**: Dark mode used `#2a2a2a`
- **After**: Uses `var(--card, #1a2332)`
- **Added**: Proper text color using `var(--text, #f8fafc)` for all cells

#### 10. Table Borders
- **Before**: Dark mode used `#444`
- **After**: Uses `var(--border, #2d3748)`

#### 11. Table Row Hover (`.truck-row:hover`)
- **Before**: Dark mode used `#333`
- **After**: Uses `rgba(255, 255, 255, 0.05)` for subtle highlight

#### 12. Plate Cell (`.plate-cell`)
- **Before**: Dark mode used `#1e1e1e` background
- **After**: Uses `var(--bg, #0a0f1e)` with proper text color

#### 13. Driver Name (`.driver-name`)
- **Before**: Dark mode used `#e0e0e0`
- **After**: Uses `var(--text, #f8fafc)`

#### 14. Location Cell (`.location-cell`)
- **Before**: Dark mode used `#e0e0e0`
- **After**: Uses `var(--text, #f8fafc)`

#### 15. Edit Modal (`.edit-form-container`)
- **Before**: Dark mode used `#2a2a2a`
- **After**: Uses `var(--card, #1a2332)`

#### 16. Empty State (`.empty-state h3`)
- **Before**: Dark mode used `#e0e0e0`
- **After**: Uses `var(--text, #f8fafc)`

#### 17. Muted Text (`.text-muted`, `.no-driver`, etc.)
- **Before**: Dark mode used `#666`
- **After**: Uses `#888` for better visibility in dark mode

#### 18. Status Select Options
- **Before**: Dark mode used `#2a2a2a`
- **After**: Uses `var(--card, #1a2332)`

## Visual Improvements

### Better Contrast
- All text now uses proper contrast ratios against dark backgrounds
- White text (`#f8fafc`) on dark navy backgrounds (`#0a0f1e`, `#1a2332`)

### Consistent Theme
- All backgrounds now use the same dark blue-gray palette
- Matches the overall app theme from `globals.css`

### Enhanced Readability
- Table cells have proper text colors in dark mode
- Muted text is now more visible (`#888` instead of `#666`)
- Borders are properly visible (`#2d3748`)

## Testing Checklist

Test the following in dark mode:
- [ ] Main container background is dark navy (`#0a0f1e`)
- [ ] Statistics cards have dark blue-gray background (`#1a2332`)
- [ ] All text is clearly visible (white/off-white)
- [ ] Search and filter inputs are properly styled
- [ ] Add truck form has dark background with visible fields
- [ ] Table has dark background with readable text
- [ ] Table rows highlight on hover
- [ ] Edit modal has dark background
- [ ] All buttons are visible and properly styled
- [ ] Dropdown arrows are visible in dark mode
- [ ] Status badges are visible with proper colors
- [ ] Vehicle type badges are properly styled

## Files Modified

1. **`src/app/admin/manage-trucks/manage-trucks.css`**
   - Updated 18+ CSS rules for dark mode support
   - Replaced hardcoded colors with CSS variables
   - Enhanced consistency with global theme

## Browser Compatibility

The dark mode implementation uses:
- CSS custom properties (CSS variables) - supported in all modern browsers
- `[data-theme="dark"]` attribute selector - widely supported
- No JavaScript required for basic theme switching

## Future Enhancements

Consider adding:
1. Smooth transitions when switching themes
2. Theme toggle button in the truck management page
3. Persist user theme preference in local storage
4. System theme detection

## Notes

- The theme is controlled by the `data-theme` attribute on the root `<html>` element
- Theme switching is handled globally by the settings page
- All colors now reference the global CSS variables for consistency
- Dark mode maintains the same visual hierarchy as light mode
