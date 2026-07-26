import bcrypt from 'bcryptjs';

const plainPasswords = {
  'admin@corein.com': 'admin123',
  'arjun@corein.com': 'worker123',
  'priya@corein.com': 'worker123',
};

const seedUsers = [
  {
    id: 'admin-001',
    email: 'admin@corein.com',
    name: 'Admin User',
    role: 'admin',
    avatar: 'A',
    rate: 0,
    joinedAt: '2026-01-01',
  },
  {
    id: 'worker-001',
    email: 'arjun@corein.com',
    name: 'Arjun Patel',
    role: 'worker',
    avatar: 'A',
    rate: 25,
    joinedAt: '2026-03-15',
  },
  {
    id: 'worker-002',
    email: 'priya@corein.com',
    name: 'Priya Sharma',
    role: 'worker',
    avatar: 'P',
    rate: 30,
    joinedAt: '2026-04-01',
  },
];

const salt = bcrypt.genSaltSync(10);
const USERS_DB = seedUsers.map((u) => ({
  ...u,
  password: bcrypt.hashSync(plainPasswords[u.email], salt),
}));

export default USERS_DB;
