import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role for debug

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  console.log('--- DEBUG TICKETS ---');
  const { data: tickets, error: tError } = await supabase.from('tickets').select('*').limit(5);
  console.log('Tickets:', tickets);
  if (tError) console.error('Ticket Error:', tError);

  console.log('\n--- DEBUG MESSAGES ---');
  const { data: messages, error: mError } = await supabase.from('ticket_messages').select('*').limit(5);
  console.log('Messages:', messages);
  if (mError) console.error('Message Error:', mError);

  console.log('\n--- DEBUG PROFILES ---');
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(5);
  console.log('Profiles:', profiles);
  if (pError) console.error('Profile Error:', pError);
}

debug();
