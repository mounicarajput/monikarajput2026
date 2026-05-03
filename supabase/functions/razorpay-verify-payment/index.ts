import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Supabase client (service role recommended for updates)
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing fields" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const key_secret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!key_secret) {
      throw new Error("Missing Razorpay secret");
    }

    // 🔐 VERIFY SIGNATURE
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(key_secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const message = `${razorpay_order_id}|${razorpay_payment_id}`;

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      new TextEncoder().encode(message)
    );

    const expectedSignature = Array.from(
      new Uint8Array(signatureBuffer)
    )
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      await supabase
        .from("one_rupee_payments")
        .update({ status: "failed" })
        .eq("razorpay_order_id", razorpay_order_id);

      return new Response(
        JSON.stringify({ success: false, error: "Invalid signature" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // ✅ MARK AS PAID
    const { error } = await supabase
      .from("one_rupee_payments")
      .update({
        status: "paid",
        razorpay_payment_id,
        razorpay_signature,
      })
      .eq("razorpay_order_id", razorpay_order_id);

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified successfully",
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});