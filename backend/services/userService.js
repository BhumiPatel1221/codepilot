const path = require('path');
const { SafeJsonStore } = require('../utils/safeJsonStore');

const store = new SafeJsonStore(path.resolve(__dirname, '../data/users.json'), { users: {} });

async function syncUser({ id, email, full_name, avatar_url }) {
  return store.withLock(async () => {
    const data = await store.read();
    data.users[email] = {
      id,
      email,
      full_name,
      avatar_url,
      updatedAt: new Date().toISOString()
    };
    await store.write(data);
    return data.users[email];
  });
}

async function getUserByEmail(email) {
  const data = await store.read();
  return data.users[email] || null;
}

async function getUserById(id) {
  const data = await store.read();
  const user = Object.values(data.users || {}).find(u => u.id === id);
  return user || null;
}

module.exports = { syncUser, getUserByEmail, getUserById };
