const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const multer = require('multer');

// ========================
// CONFIG
// ========================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// IMPORTANT: must be SERVICE ROLE KEY for updating payment statuses securely
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(
  supabaseUrl || 'https://xhjostwhhuvhxzfcoygk.supabase.co',
  supabaseServiceRoleKey || process.env.SUPABASE_ANON_KEY // fallback for testing, but should use service role
);

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
});

// ========================
// CREATE ORDER
// ========================
router.post('/create-order', async (req, res) => {
  try {
    const { user_id } = req.body;
    
    // Create order for ₹10 (amount = 1000 paise)
    const amount = 1000;
    
    // Validate minimum amount
    if (amount < 100) {
      return res.status(400).json({ error: 'Minimum amount is 100 paise' });
    }
    
    const options = {
      amount: amount,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };
    
    const order = await razorpay.orders.create(options);
    
    // Save order in Supabase with status = "created"
    const { data: payment, error } = await supabase
      .from('payments')
      .insert([{
        user_id: user_id || 'anonymous',
        razorpay_order_id: order.id,
        amount: amount,
        status: 'created'
      }])
      .select()
      .single();
      
    if (error) throw error;
    
    res.json({ success: true, order_id: order.id, amount: order.amount, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('CREATE ORDER ERROR:', err);
    // Handle auth failures (return 401)
    if (err.statusCode === 401 || (err.error && err.error.code === 'BAD_REQUEST_ERROR' && err.error.description.includes('authentication'))) {
      return res.status(401).json({ error: 'Razorpay authentication failed' });
    }
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// ========================
// VERIFY PAYMENT
// ========================
router.post('/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment details' });
    }
    
    // Verify signature using Razorpay secret
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret')
      .update(body.toString())
      .digest("hex");
      
    const isAuthentic = expectedSignature === razorpay_signature;
    
    if (isAuthentic) {
      // Update payment row: status = "paid"
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'paid',
          razorpay_payment_id,
          razorpay_signature
        })
        .eq('razorpay_order_id', razorpay_order_id);
        
      if (error) throw error;
      
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      // Mark as "failed"
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('razorpay_order_id', razorpay_order_id);
        
      res.status(400).json({ success: false, error: "Invalid Signature" });
    }
  } catch (err) {
    console.error('VERIFY PAYMENT ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// ========================
// WEBHOOK (payment.captured)
// ========================
router.post('/webhook', express.json({type: 'application/json'}), async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret';
    const signature = req.headers['x-razorpay-signature'];
    
    // When dealing with express.json(), req.body is an object.
    // For HMAC signature verification to work perfectly, we should ideally verify the raw body.
    // Assuming express.json() is used globally, we stringify it.
    // (Note: in production, you'd use a raw body parser for the webhook endpoint)
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
      
    // Using a simpler string verification or you could use Razorpay.validateWebhookSignature
    const isValid = Razorpay.validateWebhookSignature(body, signature, secret);
      
    if (isValid || signature === expectedSignature) {
      // Event is authentic
      if (req.body.event === 'payment.captured') {
        const paymentData = req.body.payload.payment.entity;
        const razorpay_order_id = paymentData.order_id;
        
        // Update payment status = "paid"
        if (razorpay_order_id) {
          await supabase
            .from('payments')
            .update({ status: 'paid' })
            .eq('razorpay_order_id', razorpay_order_id);
        }
      }
      res.status(200).send('OK');
    } else {
      res.status(400).send('Invalid signature');
    }
  } catch (err) {
    console.error('WEBHOOK ERROR:', err);
    res.status(500).send('Server Error');
  }
});

// ========================
// SUBMIT IMAGE
// ========================
router.post('/submit-image', upload.single('image'), async (req, res) => {
  try {
    const { razorpay_order_id, owner_name, caption } = req.body;
    
    if (!razorpay_order_id || !req.file) {
      return res.status(400).json({ error: 'Missing data or image' });
    }
    
    // Check if user has payment with status = "paid"
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('status', 'paid')
      .single();
      
    if (paymentError || !payment) {
      return res.status(400).json({ error: 'Please complete payment before uploading.' });
    }
    
    // upload image
    const fileName = `img-${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('homepage-images')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });
      
    if (uploadError) throw uploadError;
    
    const { data: publicUrl } = supabase.storage
      .from('homepage-images')
      .getPublicUrl(fileName);
      
    const image_url = publicUrl.publicUrl;
    
    // insert submission
    const { data: submission, error: insertError } = await supabase
      .from('submissions')
      .insert([{
        image_url,
        owner_name: owner_name || 'Anonymous',
        caption: caption || '',
        payment_id: payment.id,
        views: 0
      }])
      .select()
      .single();
      
    if (insertError) throw insertError;
    
    // After upload -> update status = "used"
    await supabase
      .from('payments')
      .update({ status: 'used' })
      .eq('id', payment.id);
      
    res.json({
      success: true,
      image_url,
      submission_id: submission.id
    });
    
  } catch (err) {
    console.error('SUBMIT ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ========================
// GET CURRENT IMAGE (LATEST ONLY)
// ========================
router.get('/current', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return res.json({
        success: true,
        image_url: null,
        owner_name: null,
        caption: null,
        views: 0
      });
    }

    const latest = data[0];
    res.set('Cache-Control', 'no-store');

    return res.json({
      success: true,
      image_url: latest.image_url,
      owner_name: latest.owner_name,
      caption: latest.caption,
      views: latest.views || 0,
      last_updated: latest.created_at
    });

  } catch (err) {
    console.error('CURRENT ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;