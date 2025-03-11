require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://lftdbynlfyrmylaxyqxp.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'your_supabase_key';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase; 