const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const { env } = require('../config/env');

let supabase = null;
if (env.SUPABASE_URL && env.SUPABASE_KEY) {
  supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
}

async function createInvitation({ workspaceId, inviterId, inviterEmail, inviteeEmail, role, workspaceName }) {
  const invitation = {
    id: uuidv4(),
    workspaceId,
    inviterId,
    inviterEmail,
    inviteeEmail,
    role,
    workspaceName,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!supabase) return invitation;

  const { data, error } = await supabase
    .from('invitations')
    .insert([invitation])
    .select()
    .single();

  if (error) {
    console.error('Supabase create invitation error:', error);
    return invitation;
  }
  return data;
}

async function getInvitationsForEmail(email) {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('inviteeEmail', email)
    .eq('status', 'pending');

  if (error) {
    console.error('Supabase get invitations error:', error);
    return [];
  }
  return data || [];
}

async function updateInvitationStatus(id, status) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('invitations')
    .update({ 
      status, 
      updatedAt: new Date().toISOString() 
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Supabase update invitation error:', error);
    return null;
  }
  return data;
}

module.exports = { createInvitation, getInvitationsForEmail, updateInvitationStatus };
