import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // ✅ HANDLE PRE-FLIGHT REQUEST (VERY IMPORTANT)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();

    const file = formData.get("image") as File;
    const razorpay_order_id = formData.get("razorpay_order_id");
    const owner_name = formData.get("owner_name") || "Anonymous";
    const caption = formData.get("caption") || "";

    if (!file || !razorpay_order_id) {
      return new Response(
        JSON.stringify({ error: "Missing data" }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Check payment
    const { data: payment, error: paymentError } = await supabase
      .from("one_rupee_payments")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("status", "paid")
      .single();

    if (paymentError || !payment) {
      return new Response(
        JSON.stringify({ error: "Payment not completed" }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // 2. Upload image
    const fileName = `img-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("homepage-images")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("homepage-images")
      .getPublicUrl(fileName);

    const image_url = data.publicUrl;

    // 3. Insert submission
    const { data: submission, error: insertError } = await supabase
      .from("one_rupee_submissions")
      .insert({
        image_url,
        owner_name,
        caption,
        payment_id: payment.id,
        views: 0,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 4. Mark payment used
    await supabase
      .from("one_rupee_payments")
      .update({ status: "used" })
      .eq("id", payment.id);

    return new Response(
      JSON.stringify({
        success: true,
        image_url,
        submission_id: submission.id,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});