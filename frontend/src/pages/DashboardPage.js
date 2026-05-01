import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format, isPast } from 'date-fns';

const StatCard = ({ icon, label, value, color, bg }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: bg, color, fontSize: 24 }}>{icon}</div>
    <div className="stat-info">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

const priorityColors = { low: 'priority-low', medium: 'priority-medium', high: 'priority-high', critical: 'priority-critical' };
const statusColors = { todo: 'status-todo', 'in-progress': 'status-in-progress', review: 'status-review', done: 'status-done' };

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get()
      .then((res) => setData(res.data.dashboard))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!data) return null;

  const { projects, tasks, overdueTasks, myTasks, recentTasks } = data;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Welcome back, <strong style={{ color: 'var(--neon-cyan)' }}>{user?.name}</strong>
          </p>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <StatCard icon="📁" label="Total Projects" value={projects.total} color="#00f0ff" bg="linear-gradient(135deg, rgba(0,240,255,0.15) 0%, rgba(0,240,255,0.05) 100%)" />
          <StatCard icon="🟢" label="Active Projects" value={projects.active} color="#00ffa3" bg="linear-gradient(135deg, rgba(0,255,163,0.15) 0%, rgba(0,255,163,0.05) 100%)" />
          <StatCard icon="✅" label="Tasks Done" value={tasks.done} color="#00ffa3" bg="linear-gradient(135deg, rgba(0,255,163,0.18) 0%, rgba(77,139,255,0.08) 100%)" />
          <StatCard icon="⚡" label="In Progress" value={tasks['in-progress']} color="#6ea8ff" bg="linear-gradient(135deg, rgba(77,139,255,0.18) 0%, rgba(77,139,255,0.05) 100%)" />
          <StatCard icon="🔍" label="In Review" value={tasks.review} color="#ffb547" bg="linear-gradient(135deg, rgba(255,181,71,0.18) 0%, rgba(255,181,71,0.05) 100%)" />
          <StatCard icon="📋" label="To Do" value={tasks.todo} color="#a5b3d4" bg="linear-gradient(135deg, rgba(138,150,184,0.15) 0%, rgba(138,150,184,0.05) 100%)" />
          <StatCard icon="⏰" label="Overdue" value={tasks.overdue} color="#ff4d6d" bg="linear-gradient(135deg, rgba(255,77,109,0.18) 0%, rgba(255,46,154,0.05) 100%)" />
          <StatCard icon="📊" label="Total Tasks" value={tasks.total} color="#c79cff" bg="linear-gradient(135deg, rgba(168,85,247,0.18) 0%, rgba(168,85,247,0.05) 100%)" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* My Tasks */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">My Tasks</h3>
              <span className="badge badge-blue">{myTasks.length}</span>
            </div>
            {myTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--gray-400)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                <p style={{ fontSize: 14 }}>No pending tasks assigned to you!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {myTasks.map((task) => {
                  const overdue = task.dueDate && isPast(new Date(task.dueDate));
                  return (
                    <div
                      key={task._id}
                      onClick={() => navigate(`/projects/${task.project?._id}`)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: `1px solid ${overdue ? 'rgba(255,77,109,0.4)' : 'var(--border)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: overdue ? 'rgba(255,77,109,0.06)' : 'rgba(0,0,0,0.25)',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: 'var(--text-bright)' }}>{task.title}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span className={`badge ${statusColors[task.status]}`}>{task.status}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>📁 {task.project?.name}</span>
                        {task.dueDate && (
                          <span style={{ fontSize: 12, color: overdue ? 'var(--neon-red)' : 'var(--text-muted)', fontWeight: overdue ? 600 : 400 }}>
                            📅 {format(new Date(task.dueDate), 'MMM d')} {overdue && '(overdue)'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Overdue Tasks */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Overdue Tasks</h3>
              <span className="badge badge-red">{overdueTasks.length}</span>
            </div>
            {overdueTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--gray-400)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
                <p style={{ fontSize: 14 }}>No overdue tasks. Keep it up!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {overdueTasks.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => navigate(`/projects/${task.project?._id}`)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,77,109,0.35)',
                      background: 'rgba(255,77,109,0.06)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: 'var(--text-bright)' }}>{task.title}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--neon-red)', fontWeight: 600 }}>
                        Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </span>
                      {task.assignee && <span>👤 {task.assignee.name}</span>}
                      <span>📁 {task.project?.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <h3 className="card-title">Recently Added Tasks</h3>
          </div>
          {recentTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <p>No tasks created yet.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assignee</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTasks.map((task) => (
                    <tr
                      key={task._id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/projects/${task.project?._id}`)}
                    >
                      <td style={{ fontWeight: 500 }}>{task.title}</td>
                      <td style={{ color: 'var(--gray-500)' }}>{task.project?.name}</td>
                      <td><span className={`badge ${statusColors[task.status]}`}>{task.status}</span></td>
                      <td><span className={`badge ${priorityColors[task.priority]}`}>{task.priority}</span></td>
                      <td style={{ color: 'var(--gray-500)' }}>{task.assignee?.name || '—'}</td>
                      <td style={{ color: 'var(--gray-500)' }}>{format(new Date(task.createdAt), 'MMM d, yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
