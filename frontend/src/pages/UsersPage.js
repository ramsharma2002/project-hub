import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';
import { format } from 'date-fns';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    authAPI.getAllUsers()
      .then((res) => setUsers(res.data.users))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <h1>Users</h1>
        <input
          type="text"
          className="form-input"
          placeholder="Search users…"
          style={{ width: 220 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%',
                              background: u.role === 'admin' ? 'var(--secondary)' : 'var(--primary)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontWeight: 700, fontSize: 14,
                            }}>
                              {u.name[0].toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 500 }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--gray-500)' }}>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'role-badge-admin' : 'role-badge-member'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ color: 'var(--gray-500)' }}>
                          {format(new Date(u.createdAt), 'MMM d, yyyy')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
