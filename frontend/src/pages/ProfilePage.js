import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await authAPI.updateProfile({ name: form.name.trim() });
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <>
      <div className="page-header">
        <h1>Profile</h1>
      </div>

      <div className="page-body">
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div className="card">
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 800, color: 'white',
              }}>
                {initials}
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>{user?.name}</h2>
                <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>{user?.email}</p>
                <span className={`badge ${user?.role === 'admin' ? 'role-badge-admin' : 'role-badge-member'}`} style={{ marginTop: 6 }}>
                  {user?.role}
                </span>
              </div>
            </div>

            <hr className="divider" />

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  value={form.name}
                  onChange={(e) => { setForm({ name: e.target.value }); setErrors({}); }}
                />
                {errors.name && <p className="form-error">{errors.name}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Email address</label>
                <input
                  type="email"
                  className="form-input"
                  value={user?.email || ''}
                  disabled
                  style={{ background: 'var(--gray-50)', color: 'var(--gray-400)' }}
                />
                <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>Email cannot be changed</p>
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <input
                  type="text"
                  className="form-input"
                  value={user?.role || ''}
                  disabled
                  style={{ background: 'var(--gray-50)', color: 'var(--gray-400)', textTransform: 'capitalize' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
