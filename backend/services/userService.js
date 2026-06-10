const { createClient } = require('@supabase/supabase-js');
const { env } = require('../config/env');

let supabase = null;
if (env.SUPABASE_URL && env.SUPABASE_KEY) {
  supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
}

async function syncUser({ id, email, full_name, avatar_url }) {
  const user = {
    id,
    email,
    full_name,
    avatar_url,
    updatedAt: new Date().toISOString()
  };

  if (!supabase) return user;

  const { data, error } = await supabase
    .from('users')
    .upsert([user], { onConflict: 'email' })
    .select()
    .single();

  if (error) {
    console.error('Supabase sync user error:', error);
    return user;
  }
  return data;
}

async function getUserByEmail(email) {
  if (!supabase) return null;
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error('Supabase get user by email error:', error);
    }
    return null;
  }
  return data || null;
}

async function getUserById(id) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Supabase get user by id error:', error);
    }
    return null;
  }
  return data || null;
}

module.exports = { syncUser, getUserByEmail, getUserById };
