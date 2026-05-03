/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // ✅ CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));

    // ✅ FIX: Amount is already in paise (1000 paise = ₹10)
    // Do NOT multiply by 100 again — that was causing ₹1000 charges!
    const amount = 1000; // ₹10 in paise, hardcoded for this product

    const key_id = Deno.env.get("RAZORPAY_KEY_ID");
    const key_secret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!key_id || !key_secret) {
      throw new Error("Missing Razorpay keys in environment");
    }

    const auth = btoa(`${key_id}:${key_secret}`);

    const razorpayRes = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount,
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
        }),
      }
    );

    const razorpayData = await razorpayRes.json();

    if (!razorpayRes.ok) {
      console.error("Razorpay ERROR:", razorpayData);
      return new Response(
        JSON.stringify({
          success: false,
          error: razorpayData?.error?.description || "Order creation failed",
          details: razorpayData,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ✅ CRITICAL FIX: Insert order into "payments" table
    // Without this row, verify-payment has nothing to update to "paid",
    // and submit-image finds no paid payment → "Payment not completed"
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: insertError } = await supabase
      .from("one_rupee_payments")
      .insert({
        user_id: body.user_id || "anonymous",
        razorpay_order_id: razorpayData.id,
        amount,
        status: "created",
      });

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      // Still return the order so user can pay — we'll log the DB issue
    }

    // ✅ SUCCESS RESPONSE
    return new Response(
      JSON.stringify({
        success: true,
        order_id: razorpayData.id,
        amount: razorpayData.amount,
        key_id,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    console.error("FUNCTION ERROR:", err);

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});