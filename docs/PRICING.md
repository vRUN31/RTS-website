# Dynamic Pricing System for Truck Booking

## Overview

The booking form now includes a **real-time price estimation system** that automatically calculates the total cost based on distance and vehicle type. This helps customers make informed decisions before submitting their booking.

## Features

✅ **Dynamic Calculation**: Price updates automatically when distance or vehicle type changes
✅ **Detailed Breakdown**: Shows base price, GST, toll charges, and loading fees
✅ **Vehicle-Specific Rates**: Different rates for each vehicle type based on capacity
✅ **Minimum Charge Protection**: Ensures minimum viable charges for short trips
✅ **Indian Currency Format**: Displays prices in ₹ (INR) with proper formatting
✅ **Visual Feedback**: Beautiful gradient card with clear breakdown

## Pricing Structure

### Vehicle Rates (Base Rate per KM)

| Vehicle Type | Base Rate/km | Minimum Charge | Capacity |
|-------------|--------------|----------------|----------|
| Pickup (1.5T) | ₹12 | ₹800 | 1.5 Ton |
| LCV (3.5T) | ₹18 | ₹1,200 | 3.5 Ton |
| Truck (9T) | ₹25 | ₹2,000 | 9 Ton |
| Truck (16T) | ₹35 | ₹3,000 | 16 Ton |
| Trailer (25T) | ₹45 | ₹4,500 | 25 Ton |

### Additional Charges

- **GST**: 18% on base price
- **Toll Charges**: ~5% of base price (estimated)
- **Loading/Unloading**: ₹500 flat rate

## How It Works

### 1. User Flow

```
1. User enters source and destination (or uses map mode)
2. System calculates route distance using OSRM
3. Distance displayed (e.g., "450.5 km")
4. User selects vehicle type
5. Price automatically calculated and displayed
6. User can change vehicle type to see different prices
7. User proceeds with booking
```

### 2. Price Calculation Formula

```
Base Price = max(Distance × Rate per km, Minimum Charge)
GST = Base Price × 18%
Toll = Base Price × 5%
Loading = ₹500

Total Price = Base Price + GST + Toll + Loading
```

### 3. Example Calculations

**Example 1: Short Trip (Mumbai to Pune - 150 km)**
- Vehicle: LCV (3.5T)
- Base Rate: ₹18/km
- Calculation:
  - Base: 150 km × ₹18 = ₹2,700
  - GST (18%): ₹486
  - Toll (5%): ₹135
  - Loading: ₹500
  - **Total: ₹3,821**

**Example 2: Long Trip (Mumbai to Delhi - 1,400 km)**
- Vehicle: Truck (16T)
- Base Rate: ₹35/km
- Calculation:
  - Base: 1,400 km × ₹35 = ₹49,000
  - GST (18%): ₹8,820
  - Toll (5%): ₹2,450
  - Loading: ₹500
  - **Total: ₹60,770**

**Example 3: Very Short Trip (20 km)**
- Vehicle: Pickup (1.5T)
- Base Rate: ₹12/km
- Calculation would be: 20 × ₹12 = ₹240
- But **minimum charge applies**: ₹800
  - GST (18%): ₹144
  - Toll (5%): ₹40
  - Loading: ₹500
  - **Total: ₹1,484**

## Technical Implementation

### Files Structure

```
src/
├── utils/
│   └── pricing.ts                    # Pricing utility module
└── components/
    └── booking/
        └── EnhancedBookingForm.tsx   # Integrated price display
```

### Key Functions

#### `calculatePrice(distanceInKm, vehicleType)`
Calculates price for a specific vehicle type and distance.

```typescript
const price = calculatePrice(450.5, 'LCV (3.5T)');
// Returns PriceBreakdown object
```

#### `calculateAllPrices(distanceInKm)`
Calculates prices for all vehicle types (useful for comparison).

```typescript
const allPrices = calculateAllPrices(450.5);
// Returns Record<string, PriceBreakdown>
```

#### `formatPrice(amount)`
Formats amount in Indian currency format.

```typescript
formatPrice(12345); // Returns "₹12,345"
```

### Type Definitions

```typescript
interface PriceBreakdown {
  basePrice: number;      // Base transportation cost
  gst: number;           // 18% GST
  toll: number;          // Estimated toll charges
  loading: number;       // Loading/unloading fees
  total: number;         // Total amount
  perKm: number;         // Rate per kilometer
  distance: number;      // Distance in km
  vehicleType: string;   // Vehicle type name
}
```

## UI Components

### Price Display Card
- **Background**: Orange gradient (₹ color theme)
- **Border**: Solid orange with shadow
- **Layout**: Itemized breakdown with totals
- **Sections**:
  1. Base Price (distance × rate/km)
  2. GST (18%)
  3. Toll Charges (5%)
  4. Loading/Unloading (₹500)
  5. **Total Amount** (bold, large font)
  6. Disclaimer (terms and conditions)

### Conditional Display

The price card only shows when:
- ✅ Route has been calculated (distance available)
- ✅ Vehicle type has been selected

If route exists but no vehicle selected:
- Shows a blue prompt: "Select a vehicle type to see the estimated price"

## Customization

### Adjusting Rates

Edit `src/utils/pricing.ts`:

```typescript
export const VEHICLE_RATES: Record<string, VehicleTypeRate> = {
  'Pickup (1.5T)': {
    name: 'Pickup (1.5T)',
    baseRate: 12,          // ← Change this
    minimumCharge: 800,    // ← Change this
    capacity: '1.5 Ton'
  },
  // ... other vehicles
};
```

### Adjusting Additional Charges

```typescript
export const ADDITIONAL_CHARGES = {
  gst: 0.18,      // 18% → Change to 0.20 for 20%
  toll: 0.05,     // 5% → Adjust based on routes
  loading: 500,   // ₹500 → Change flat rate
};
```

## Future Enhancements

- [ ] **Dynamic Toll Calculation**: Use actual toll data from route APIs
- [ ] **Seasonal Pricing**: Peak season surcharges
- [ ] **Weight-Based Pricing**: Adjust price based on cargo weight
- [ ] **Fuel Surcharge**: Add dynamic fuel price adjustments
- [ ] **Multi-Stop Pricing**: Calculate for multiple pickup/drop points
- [ ] **Discount Codes**: Promotional discount system
- [ ] **Historical Price Tracking**: Show price trends
- [ ] **Price Comparison**: Side-by-side vehicle type comparison
- [ ] **Save Quote**: Allow users to save and compare quotes
- [ ] **Payment Integration**: Direct payment from quote

## Admin Controls (Potential)

Future admin panel features:
- Adjust base rates per vehicle type
- Set seasonal multipliers
- Configure GST and toll percentages
- Set minimum charges per region
- View pricing analytics
- A/B test different pricing strategies

## Notes

- **Estimates Only**: Displayed prices are estimates. Actual invoiced amounts may vary.
- **Route-Dependent**: Toll charges are approximated at 5% but vary by actual route taken.
- **Tax Compliance**: GST rate (18%) follows Indian tax regulations.
- **Rounding**: All prices rounded to nearest rupee for clarity.
- **Currency**: All prices in Indian Rupees (₹ INR).

## Testing

To test the pricing feature:

1. Go to customer dashboard
2. Click "📦 Book Truck"
3. Toggle to "🗺️ Use Map" mode
4. Search for "Mumbai" as source
5. Search for "Pune" as destination
6. Route calculates (~150 km)
7. Select "LCV (3.5T)" from vehicle dropdown
8. Price breakdown appears automatically
9. Try different vehicle types to see price changes
10. Verify calculations match expected values

## Support

For pricing questions or to request rate adjustments, contact the admin team.
