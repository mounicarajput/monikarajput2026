const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// ================= CREATE ORDER =================
router.post("/create-order", async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: 1000,
      currency: "INR",
      receipt: "rcpt_" + Date.now(),
    });

    await supabase.from("one_rupee_payments").insert({
      user_id: "anonymous",
      razorpay_order_id: order.id,
      amount: 1000,
      status: "created",
    });

    res.json({
      success: true,
      order_id: order.id,
      amount: 1000,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// ================= VERIFY PAYMENT =================
router.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment fields" });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    await supabase
      .from("one_rupee_payments")
      .update({
        status: "paid",
        razorpay_payment_id,
        razorpay_signature,
      })
      .eq("razorpay_order_id", razorpay_order_id);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// ================= UPLOAD IMAGE =================
router.post("/submit-image", upload.single("image"), async (req, res) => {
  try {
    const { razorpay_order_id, owner_name, caption } = req.body;

    const { data: payment } = await supabase
      .from("one_rupee_payments")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("status", "paid")
      .single();

    if (!payment) {
      return res.status(400).json({
        error: "Payment not completed",
      });
    }

    const fileName = `${Date.now()}.png`;

    await supabase.storage
      .from("homepage-images")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    const { data } = supabase.storage
      .from("homepage-images")
      .getPublicUrl(fileName);

    await supabase.from("one_rupee_submissions").insert({
      image_url: data.publicUrl,
      owner_name,
      caption,
      payment_id: payment.id,
    });

    await supabase
      .from("one_rupee_payments")
      .update({ status: "used" })
      .eq("id", payment.id);

    res.json({ success: true, image_url: data.publicUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// ================= CURRENT IMAGE =================
router.get("/current", async (req, res) => {
  const { data } = await supabase
    .from("one_rupee_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  res.json({
    success: true,
    image_url: data?.image_url || null,
    owner_name: data?.owner_name || "—",
  });
});

module.exports = router;