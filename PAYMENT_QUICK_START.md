# ⚡ ONE RUPEE HOMEPAGE - QUICK START

## 🚀 Get Started in 5 Minutes

### 1️⃣ Create Supabase Tables

Go to **Supabase Dashboard** → **SQL Editor** → Run all queries from:
```
supabase-setup.sql
```

This creates:
- `payments` table
- `submissions` table  
- `homepage_state` table
- All indexes and RLS policies

### 2️⃣ Create Storage Bucket

In **Supabase Dashboard** → **Storage**:
1. Click "New Bucket"
2. Name: `homepage-images`
3. Set to "Public"
4. Create

### 3️⃣ Install Dependencies

```bash
npm install
```

(qrcode and multer are in package.json)

### 4️⃣ Start Server

```bash
npm start
```

Server running on: `http://localhost:3000`

### 5️⃣ Test the Flow

Open: `http://localhost:3000/one-rupee-homepage.html`

Click "Replace Photo for ₹1" and test the 6-step flow:
1. ✅ Upload photo
2. ✅ Generate payment (QR code appears)
3. ✅ Scan & pay (simulated)
4. ✅ Enter UTR (test: `123456789012`)
5. ✅ Verify payment
6. ✅ Upload succeeds, see success screen

---

## 🧪 Test Payment API

```bash
# 1. Create payment
curl -X POST http://localhost:3000/api/payment/create \
  -H "Content-Type: application/json"

# Response:
# {
#   "success": true,
#   "txn_id": "txn_1714423920000",
#   "qr_code": "data:image/png;base64,...",
#   ...
# }

# 2. Verify payment (use txn_id from step 1)
curl -X POST http://localhost:3000/api/payment/verify \
  -H "Content-Type: application/json" \
  -d '{
    "txn_id": "txn_1714423920000",
    "utr": "123456789012"
  }'

# 3. Check current homepage
curl http://localhost:3000/api/payment/current
```

---

## 📊 Verify Database

In **Supabase SQL Editor**:

```sql
-- Check payments
SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;

-- Check submissions
SELECT * FROM submissions ORDER BY created_at DESC LIMIT 5;

-- Check homepage state
SELECT * FROM homepage_state;
```

---

## 🔑 Key UPI Details

- **UPI ID**: `rajputmonika953@okaxis`
- **Amount**: ₹1
- **Beneficiary**: Monika

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `/one-rupee-homepage.html` | Frontend (6-step flow) |
| `/api/payment.js` | Backend payment API |
| `/server.js` | Express app + routes |
| `/supabase-setup.sql` | Database schema |
| `PAYMENT_SYSTEM_SETUP.md` | Full documentation |

---

## ✅ What Works

✅ 6-step payment flow  
✅ QR code generation  
✅ Payment verification  
✅ Image upload to Supabase  
✅ Stats tracking (views, replacements)  
✅ Mobile responsive  
✅ Error handling  
✅ Loading states  

---

## 🎯 Flow Diagram

```
User clicks "Replace Photo for ₹1"
        ↓
Step 1: Upload image + name + caption
        ↓
Step 2: Generate payment (txn_id + QR)
        ↓
Step 3: Show QR code to scan
        ↓
Step 4: User enters UTR from payment
        ↓
Step 5: Verify payment in Supabase
        ↓
Step 6: Upload image to Storage
        ↓
Success! Image now displayed on homepage
```

---

## 🚨 Common Issues

**Issue**: QR code not showing
- → Check if `npm install qrcode` was run
- → Check browser console for errors

**Issue**: Payment verification fails
- → UTR must be unique
- → txn_id must exist in database
- → Check Supabase payments table

**Issue**: Image not uploading
- → Image < 5MB
- → Storage bucket must be created
- → Storage bucket must be public

**Issue**: Stats not updating
- → Check `/api/payment/current` is called
- → Check database for submission records

---

## 📞 Next Steps

1. ✅ Run Supabase SQL setup
2. ✅ Create storage bucket
3. ✅ Start server (`npm start`)
4. ✅ Test complete flow
5. ✅ Verify database entries
6. ✅ Check images in storage

**Done!** Your payment system is ready! 🎉

---

For detailed documentation, see: `PAYMENT_SYSTEM_SETUP.md`
