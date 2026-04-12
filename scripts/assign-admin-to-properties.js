import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function assignAdmin() {
  try {
    // Find first admin
    const { data: admins, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (adminError) throw adminError;

    if (!admins || admins.length === 0) {
      console.log('No admin found');
      return;
    }

    const adminId = admins[0].id;
    console.log('Assigning admin id:', adminId);

    // Update all properties to assign admin as seller temporarily
    const { data, error } = await supabase
      .from('properties')
      .update({ seller_id: adminId })
      .gt('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;

    console.log('Updated properties count:', data?.length || 0);
  } catch (err) {
    console.error('Error:', err);
  }
}

assignAdmin();