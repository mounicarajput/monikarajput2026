# Supabase Edge Functions (Deno)

If you plan to migrate your Express endpoints to Supabase Edge Functions in the future, here is the code structure using Deno.

### 1. `supabase/functions/razorpay-create-order/index.ts`
```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    const amount = 1000;

    const key = Deno.env.get("RAZORPAY_KEY_ID");
    const secret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!key || !secret) {
      console.error("Server Configuration Error: Missing Razorpay Secrets in Supabase Environment");
      throw new Error("Missing Razorpay Secrets");
    }

    const auth = btoa(`${key}:${secret}`);

    // Create Razorpay order
    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
      }),
    });

    const order = await orderRes.json();

    if (!orderRes.ok) {
      console.error("Razorpay API Error:", order);
      return new Response(JSON.stringify({ error: "Razorpay API rejected the request", details: order }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save to Supabase (Ensure table matches your db!)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase auto-injected secrets!");
      throw new Error("Missing Supabase Secrets");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: insertError } = await supabase
      .from("razorpay-payments")
      .insert({
        user_id: user_id || "anonymous",
        razorpay_order_id: order.id,
        amount,
        status: "created",
      });

    if (insertError) {
      console.error("Supabase Database Insert Error:", insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        amount: order.amount,
        key_id: key,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Internal Function Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

### 2. `supabase/functions/razorpay-verify-payment/index.ts`
```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    const secret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!secret) {
       console.error("Missing Razorpay Secrets");
       throw new Error("Missing Razorpay Secrets");
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = createHmac("sha256", secret).update(body).digest("hex");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (expectedSignature === razorpay_signature) {
      await supabase
        .from("razorpay-payments")
        .update({
          status: "paid",
          razorpay_payment_id,
          razorpay_signature,
        })
        .eq("razorpay_order_id", razorpay_order_id)
        .eq("status", "created");

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    await supabase
      .from("razorpay-payments")
      .update({ status: "failed" })
      .eq("razorpay_order_id", razorpay_order_id);

    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    console.error("Function Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
```

### 3. `supabase/functions/razorpay-webhook/index.ts`
```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

serve(async (req) => {
  try {
    const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    const signature = req.headers.get("x-razorpay-signature");
    
    if (!secret || !signature) {
       return new Response("Missing Configuration or Signature", { status: 400 });
    }

    const bodyText = await req.text();
    const expectedSignature = createHmac("sha256", secret).update(bodyText).digest("hex");

    if (signature !== expectedSignature) {
      return new Response("Invalid signature", { status: 400 });
    }

    const payload = JSON.parse(bodyText);

    if (payload.event === "payment.captured") {
      const order_id = payload.payload.payment.entity.order_id;
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await supabase
        .from("razorpay-payments")
        .update({ status: "paid" })
        .eq("razorpay_order_id", order_id);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook Error:", err);
    return new Response(err.message, { status: 500 });
  }
});
```
