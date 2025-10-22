# User Guide - Smart Vehicle Recommendation

## Welcome to the Enhanced Booking System! 🚀

Our new smart booking system helps you choose the perfect vehicle for your shipment automatically. No more guessing - just enter your cargo details, and we'll show you the best options!

---

## How to Book a Shipment (Step-by-Step)

### Step 1: Enter Cargo Weight ⚖️

1. **Find the "Weight (MT)" field** in the booking form
2. **Enter your cargo weight** in Metric Tons (MT)
   - Example: 7 (for 7 tons)
   - Use decimals for precision: 2.5 (for 2.5 tons)

**💡 What happens next?**
As soon as you enter the weight, our system instantly shows you recommended vehicles!

---

### Step 2: View Recommended Vehicles 🎯

You'll see a list of vehicle cards. Each card shows:

#### **Vehicle Information:**
- **Icon** 🚚 - Visual representation
- **Name & Capacity** - e.g., "Truck (9T)"
- **Price** - Cost per kilometer (₹/km)
- **Dimensions** - Cargo space available

#### **Special Badges:**

**⭐ BEST CHOICE**
- This is our top recommendation for your cargo
- Offers the best balance of capacity, safety, and cost

**✓ SELECTED**
- Shows which vehicle you've currently selected
- Highlighted in green

#### **Capacity Status:**

Your vehicle card will show one of these status messages:

**✅ Optimal Capacity Utilization** (Green)
- Perfect choice! Your cargo weight is ideal for this vehicle
- Safe and efficient transport
- **Recommended**: Go ahead and book!

**💡 Under-Utilized** (Blue)
- This vehicle is larger than needed for your cargo
- You're paying for extra space you won't use
- **Suggestion**: Consider selecting a smaller vehicle to save money

**⚡ Near Maximum Capacity** (Orange)
- Your cargo is close to the vehicle's weight limit
- Transport is still safe, but requires careful handling
- **Note**: No additional cargo can be added

**⚠️ Exceeds Capacity** (Red)
- Your cargo is too heavy for this vehicle
- Not safe for transport
- **Action Required**: Choose a larger vehicle or split your shipment

---

### Step 3: Enter Source & Destination 🗺️

1. **Enter your pickup city** (e.g., Mumbai)
2. **Enter your delivery city** (e.g., Delhi)

**💡 What happens next?**
The system checks:
- ✅ Active contracts on this route
- 🚛 Available trucks in our fleet
- 📅 Estimated delivery time

You'll see a summary at the top showing:
```
┌──────────────────────────────────────────┐
│  CARGO WEIGHT: 7 MT                      │
│  AVAILABLE TRUCKS: 12                    │
│  EST. DELIVERY: 2 Days                   │
│  ✅ Active Contract Lane                 │
└──────────────────────────────────────────┘
```

**What does "Active Contract Lane" mean?**
This means we have pre-approved routes and contracts for this city pair - your booking will be processed faster!

---

### Step 4: Select Your Vehicle 🚚

1. **Review the recommendations** - Look at all suggested vehicles
2. **Check the capacity status** - Make sure you see a green ✅ or orange ⚡ status
3. **Click on your preferred vehicle card**

**💡 What happens next?**
- The card will highlight in green
- A "✓ SELECTED" badge appears
- The vehicle type is saved to your booking

---

### Step 5: Manual Override (Optional) 🔧

If you want to choose a different vehicle:

1. **Scroll down** to find "🔧 Manual Override / Change Vehicle"
2. **Click to expand** the dropdown menu
3. **Select any vehicle** from the list

**⚠️ Warning**: If you select an overweight vehicle, you'll see a red warning. We strongly recommend following our suggestions for safety!

---

## Understanding Vehicle Types

### 🚐 Pickup (1.5T)
**Best For**: 
- Small packages and parcels
- Documents and lightweight items
- City deliveries
- Quick short-distance transport

**Capacity**: Up to 1.5 Metric Tons  
**Dimensions**: 10ft × 6ft  
**Price**: ₹12 per km  
**Typical Delivery**: Same day (local), 1 day (regional)

---

### 🚙 LCV (3.5T)
**Best For**:
- Furniture and home goods
- Electronics and appliances
- Medium-sized cargo
- Inter-city transport

**Capacity**: Up to 3.5 Metric Tons  
**Dimensions**: 14ft × 7ft  
**Price**: ₹18 per km  
**Typical Delivery**: 1-2 days

---

### 🚚 Truck (9T)
**Best For**:
- Bulk goods and materials
- Construction supplies
- Industrial cargo
- Multiple pallets

**Capacity**: Up to 9 Metric Tons  
**Dimensions**: 19ft × 7.5ft  
**Price**: ₹25 per km  
**Typical Delivery**: 2-3 days

---

### 🚛 Truck (16T)
**Best For**:
- Heavy machinery and equipment
- Large industrial shipments
- Long-distance bulk transport
- Multiple vendor consolidation

**Capacity**: Up to 16 Metric Tons  
**Dimensions**: 24ft × 8ft  
**Price**: ₹35 per km  
**Typical Delivery**: 3-4 days

---

### 🚜 Trailer (25T)
**Best For**:
- Container cargo (20ft/40ft)
- Full truckload (FTL) shipments
- Major industrial transport
- Cross-country logistics

**Capacity**: Up to 25 Metric Tons  
**Dimensions**: 32ft × 8.5ft  
**Price**: ₹45 per km  
**Typical Delivery**: 4-5 days

---

## Real-World Examples

### Example 1: Small Office Relocation
**Scenario**: Moving office furniture from Mumbai to Pune
- **Weight**: 2 MT (office desks, chairs, computers)
- **Recommendation**: LCV (3.5T) ✅
- **Why**: Perfect size, cost-effective, 1-day delivery
- **Status**: Optimal capacity (57% utilization)

### Example 2: Construction Materials
**Scenario**: Delivering cement bags from Delhi to Jaipur
- **Weight**: 8 MT (400 bags × 20kg each)
- **Recommendation**: Truck (9T) ✅
- **Why**: Safe capacity, handles bulk materials
- **Status**: Near capacity (89% utilization) ⚡

### Example 3: Industrial Machinery
**Scenario**: Heavy equipment from Bangalore to Hyderabad
- **Weight**: 15 MT (large industrial machine)
- **Recommendation**: Truck (16T) ✅
- **Why**: Only vehicle with sufficient capacity
- **Status**: Optimal capacity (94% utilization)

### Example 4: Container Shipment
**Scenario**: 40ft container from Chennai to Kolkata
- **Weight**: 22 MT (full container load)
- **Recommendation**: Trailer (25T) ✅
- **Why**: Designed for container transport
- **Status**: Optimal capacity (88% utilization)

---

## Frequently Asked Questions (FAQ)

### Q1: What if my cargo weight is exactly at the limit?
**A**: Our system uses a 90% safety buffer. If your weight is at the maximum, you'll see an orange ⚡ "Near Maximum Capacity" warning. This is still safe, but you cannot add any additional cargo.

### Q2: Can I split my shipment if it's too heavy?
**A**: Yes! If you see a red ⚠️ "Exceeds Capacity" error, contact our support team. We can arrange multiple vehicles or schedule staggered deliveries.

### Q3: Why does the system recommend a larger vehicle sometimes?
**A**: For safety and compliance! Some cargo types (fragile, hazardous, oversized) require extra space even if they're lightweight. Always follow our recommendations.

### Q4: What does "Under-Utilized" mean?
**A**: It means you're booking a vehicle larger than needed. You can still proceed, but you'll pay more than necessary. Consider a smaller vehicle to save costs!

### Q5: How accurate is the estimated delivery time?
**A**: Our estimates are based on:
- Historical delivery data
- Common Indian highway routes
- Typical traffic conditions
- Seasonal factors

Actual delivery may vary by ±1 day depending on weather, traffic, and loading/unloading times.

### Q6: What if no vehicles are available?
**A**: If you see "AVAILABLE TRUCKS: 0", don't worry! You can still book. Our admin team will:
1. Check scheduled maintenance completions
2. Assign vehicles from other regions
3. Contact partner transporters
4. Confirm your pickup time via phone/email

### Q7: Can I change the vehicle after booking?
**A**: Yes, before shipment pickup. Contact support or use the customer dashboard to modify your booking. Changes may affect pricing.

### Q8: What's the difference between "Active Contract Lane" and regular bookings?
**A**: 
- **Active Contract Lane**: Pre-approved route, faster processing, fixed pricing
- **Regular Booking**: Admin reviews and creates ad-hoc contract, may take longer

Both are equally reliable!

---

## Tips for Best Results

### 💡 Tip 1: Weigh Your Cargo Accurately
Use a scale to get precise weight. Overestimating wastes money, underestimating causes delays.

### 💡 Tip 2: Book During Off-Peak Hours
Early morning or late evening bookings have better vehicle availability.

### 💡 Tip 3: Plan Ahead for Long Routes
Major routes (e.g., Mumbai-Delhi, Chennai-Bangalore) should be booked 2-3 days in advance during peak seasons.

### 💡 Tip 4: Add Packaging Weight
Don't forget to include crates, pallets, and protective materials in your total weight!

### 💡 Tip 5: Check Material Type
Some materials (chemicals, perishables) require special vehicles. Mention this in the "Material" field.

---

## Safety & Compliance

### ⚠️ Important Safety Rules

1. **Never Overload Vehicles**
   - Follow recommended capacity limits
   - Overloading is illegal and dangerous

2. **Declare Hazardous Materials**
   - Chemicals, flammables, explosives require special permits
   - Always mention in the booking notes

3. **Proper Packaging Required**
   - Secure cargo to prevent shifting
   - Use appropriate containers for fragile items

4. **Insurance Recommended**
   - High-value cargo (>₹50,000) should be insured
   - Add insurance during booking or contact support

---

## Need Help?

### 📞 Contact Support
- **Phone**: 1800-123-4567 (Toll-free)
- **Email**: support@rtslogistics.com
- **Chat**: Click the chat icon in the bottom-right corner

### 🕐 Support Hours
- Monday-Friday: 9:00 AM - 7:00 PM
- Saturday: 10:00 AM - 5:00 PM
- Sunday: Closed (Emergency hotline available)

### 📧 Quick Questions?
Use the in-app messaging feature in your customer dashboard for non-urgent queries. We respond within 4 hours!

---

## Start Your Booking Now! 🚀

Ready to ship? Head to the **Customer Dashboard** → **Create Booking** and experience our smart recommendation system!

**Remember**: Our AI helps you choose, but you're always in control. Happy shipping! 📦
