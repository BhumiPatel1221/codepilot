const { createClient } = require('@supabase/supabase-js');
const { env } = require('../config/env');

let supabase = null;
if (env.SUPABASE_URL && env.SUPABASE_KEY) {
  supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
}

async function listWorkspaces(userId) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('workspaces')
    .select('*');

  if (error || !data) return [];
  
  if (userId) {
    return data.filter(ws => ws.ownerId === userId || (ws.collaborators || []).some(c => c.id === userId));
  }
  return data;
}

async function getWorkspace(id) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

async function saveWorkspace(workspace) {
  if (!supabase) return workspace;
  
  const payload = {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description || '',
    language: workspace.language,
    visibility: workspace.visibility || 'public',
    ownerId: workspace.ownerId,
    ownerName: workspace.ownerName,
    files: workspace.files || [],
    collaborators: workspace.collaborators || [],
    updatedAt: new Date().toISOString()
  };

  if (workspace.lastSavedAt) {
    payload.lastSavedAt = workspace.lastSavedAt;
  }

  const { data, error } = await supabase
    .from('workspaces')
    .upsert(payload)
    .select()
    .single();

  if (error) {
    console.error('Supabase save error:', error);
    return workspace;
  }
  return data;
}

async function deleteWorkspace(id) {
  if (!supabase) return false;
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase delete error:', error);
    return false;
  }
  return true;
}

module.exports = { listWorkspaces, getWorkspace, saveWorkspace, deleteWorkspace };
