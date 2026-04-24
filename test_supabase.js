require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkTables() {
  console.log("Checking Supabase connection...");
  const { data, error } = await supabase.from('subscribers').select('*').limit(1);
  if (error) {
    console.error("Error accessing 'subscribers' table:", error.message);
  } else {
    console.log("'subscribers' table exists and is accessible. Rows:", data.length);
  }

  const { data: wData, error: wError } = await supabase.from('waitlist').select('*').limit(1);
  if (wError) {
    console.error("Error accessing 'waitlist' table:", wError.message);
  } else {
    console.log("'waitlist' table exists and is accessible. Rows:", wData.length);
  }
}

checkTables();
