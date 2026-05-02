# Supabase Edge Functions (Deno)

If you plan to migrate your Express endpoints to Supabase Edge Functions in the future, here is the code structure using Deno.

### 1. `supabase/functions/razorpay-create-order/index.ts`
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
  const { user_id } = await req.json();
  const amount = 1000; // ₹10 in paise

  // Call Razorpay API
  const key = Deno.env.get('RAZORPAY_KEY_ID');
  const secret = Deno.env.get('RAZORPAY_KEY_SECRET');
  const auth = btoa(`${key}:${secret}`);

  const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    },
    body: JSON.stringify({
      amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    })
  });

  const order = await orderRes.json();

  // Initialize Supabase Client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Insert into payments
  const { data, error } = await supabase
    .from('payments')
    .insert([{
      user_id: user_id || 'anonymous',
      razorpay_order_id: order.id,
      amount,
      status: 'created'
    }])
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({
    success: true,
    order_id: order.id,
    amount: order.amount,
    key_id: key
  }), { headers: { "Content-Type": "application/json" } });
});
```

### 2. `supabase/functions/razorpay-verify-payment/index.ts`
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { hmac } from "https://deno.land/x/crypto@v2.0.0/hmac.ts";

serve(async (req) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
  
  const secret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expectedSignature = hmac("sha256", secret, body, "utf8", "hex");

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  if (expectedSignature === razorpay_signature) {
    // Verified
    await supabase.from('payments').update({
      status: 'paid',
      razorpay_payment_id,
      razorpay_signature
    }).eq('razorpay_order_id', razorpay_order_id);

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } else {
    // Failed
    await supabase.from('payments').update({ status: 'failed' }).eq('razorpay_order_id', razorpay_order_id);
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }
});
```

### 3. `supabase/functions/razorpay-webhook/index.ts`
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { hmac } from "https://deno.land/x/crypto@v2.0.0/hmac.ts";

serve(async (req) => {
  const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || '';
  const signature = req.headers.get('x-razorpay-signature');
  const bodyText = await req.text();

  const expectedSignature = hmac("sha256", secret, bodyText, "utf8", "hex");

  if (signature === expectedSignature) {
    const payload = JSON.parse(bodyText);
    
    if (payload.event === 'payment.captured') {
      const order_id = payload.payload.payment.entity.order_id;
      
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabase.from('payments').update({ status: 'paid' }).eq('razorpay_order_id', order_id);
    }
    return new Response("OK", { status: 200 });
  }

  return new Response("Invalid Signature", { status: 400 });
});
```
