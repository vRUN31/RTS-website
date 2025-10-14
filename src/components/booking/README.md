# Enhanced Booking Form with Map Integration

## Overview

The booking form now supports an **optional map mode** that allows users to visually select source and destination locations using an interactive map powered by Leaflet, LocationIQ, and OSRM.

## Components

### 1. `EnhancedBookingForm.tsx`
The main wrapper component that provides:
- **Toggle between text mode and map mode**
- Form state management
- Integration with the customer dashboard
- Text inputs that work independently (always functional)
- Distance and duration display when route is calculated

### 2. `MapBookingView.tsx`
The map interface component that provides:
- **Leaflet map** for visualization
- **OpenStreetMap Nominatim** autocomplete search for locations (no API key required)
- **OSRM** route calculation between source and destination
- Markers for source (green) and destination (red) locations
- Route polyline display
- Real-time search suggestions (min 3 characters, 1 second debounce)

## Features

✅ **Toggleable Mode**: Switch between simple text inputs and interactive map
✅ **Always Functional**: Text inputs work even if map fails to load
✅ **Smart Search**: OpenStreetMap Nominatim provides intelligent place suggestions
✅ **Route Visualization**: See the driving route on the map
✅ **Distance & Duration**: Displays calculated route metrics
✅ **Real-Time Pricing**: Automatic price estimation based on distance and vehicle type
✅ **Price Breakdown**: Detailed breakdown showing base price, GST, toll, and loading charges
✅ **No SSR Issues**: Uses dynamic imports to prevent Leaflet SSR errors
✅ **Graceful Fallback**: If map fails, text mode still works perfectly
✅ **No API Keys Required**: Uses free OpenStreetMap services

## Tech Stack

- **Leaflet 1.9.4**: Open-source map rendering
- **OpenStreetMap Nominatim**: Free geocoding service (no API key required)
- **OSRM**: Open Source Routing Machine for route calculation
- **Next.js Dynamic Imports**: Prevents SSR issues with client-only libraries

## Usage

The enhanced form is integrated into the customer dashboard at `/dashboard/customer`. When users click "Book Truck":

1. **Text Mode (Default)**:
   - Enter source and destination cities manually
   - Works exactly like the original form

2. **Map Mode (Toggle)**:
   - Click the "🗺️ Use Map" button
   - Type in search boxes to see location suggestions
   - Click a suggestion to place a marker
   - See the route automatically calculated
   - Distance and duration displayed below the map
   - Text fields automatically populated with selected cities
   - **Select vehicle type to see estimated price**
   - Price breakdown shows base cost, GST, toll, and loading charges
   - Compare prices across different vehicle types

## API Keys

- **OpenStreetMap Nominatim**: No API key required
  - Free geocoding service
  - Rate limit: Max 1 request per second (enforced with 1s debounce)
  - Usage Policy: Must include User-Agent header (implemented)
- **OSRM**: Public instance (router.project-osrm.org)
  - No API key required
  - Free to use

## Error Handling

- Map initialization errors are caught and displayed
- LocationIQ API failures show user-friendly messages
- OSRM routing errors are gracefully handled
- Text mode always works as fallback

## Development Notes

- Uses `useRef` to prevent "map already initialized" errors
- Proper cleanup in `useEffect` return functions
- Debounced search (500ms) to avoid excessive API calls
- Loading states for better UX
- TypeScript interfaces for type safety

## Future Enhancements

- [ ] Save favorite locations
- [ ] Multiple route options (fastest, shortest, avoid tolls)
- [ ] Estimated cost calculation based on distance
- [ ] Vehicle availability along the route
- [ ] Real-time traffic integration
- [ ] Offline map caching

## Troubleshooting

**Map not showing?**
- Check browser console for errors
- Verify Leaflet CSS is loaded (should be in layout.tsx)
- Clear browser cache if switching from old version

**Locations not found?**
- OpenStreetMap Nominatim has a 1 req/sec rate limit (built-in 1s debounce)
- Try more specific search terms (e.g., "Mumbai, Maharashtra, India")
- Ensure you type at least 3 characters
- Wait for suggestions to load (takes ~1 second)

**Route not displaying?**
- OSRM requires both locations to be set
- Check that coordinates are valid
- Try different locations if route calculation fails

## Contact

For issues or questions about the map integration, refer to the main project README or the AI agent instructions in `.github/copilot-instructions.md`.
