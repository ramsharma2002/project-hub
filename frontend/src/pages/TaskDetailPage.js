import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { tasksAPI } from '../services/api';
import { format, isPast } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const statusColors = { todo: 'status-todo', 'in-progress': 'status-in-progress', review: 'status-review', done: 'status-done' };
const priorityColors = { low: 'priority-low', medium: 'priority-medium', high: 'priority-high', critical: 'priority-critical' };

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    tasksAPI.getOne(id)
      .then((res) => {
        setTask(res.data.task);
        const t = res.data.task;
        setForm({
          title: t.title,
          description: t.description || '',
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
        });
      })
      .catch(() => { toast.error('Task not found'); navigate('/projects'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSave = async () => {
    if (!form.title?.trim() || form.title.trim().length < 2) {
      toast.error('Title must be at least 2 characters');
      return;
    }
    setSaving(true);
    try {
      const res = await tasksAPI.update(id, form);
      setTask(res.data.task);
      setEditing(false);
      toast.success('Task updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!task) return null;

  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';

  return (
    <>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/projects/${task.project?._id}`)}>← Back to Project</button>
          <h1 style={{ fontSize: 18 }}>Task Detail</h1>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          ) : (
            <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>Edit Task</button>
          )}
        </div>
      </div>

      <div className="page-body">
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div className="card">
            {editing ? (
              <>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-input" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input type="date" className="form-input" value={form.dueDate} onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                    {task.title}
                    {overdue && <span style={{ fontSize: 12, color: 'var(--danger)', marginLeft: 12, fontWeight: 600 }}>OVERDUE</span>}
                  </h2>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    <span className={`badge ${statusColors[task.status]}`}>{task.status}</span>
                    <span className={`badge ${priorityColors[task.priority]}`}>{task.priority} priority</span>
                    {task.project && <span className="badge badge-gray">📁 {task.project.name}</span>}
                  </div>
                  <p style={{ color: 'var(--gray-600)', lineHeight: 1.7 }}>
                    {task.description || <em style={{ color: 'var(--gray-400)' }}>No description</em>}
                  </p>
                </div>

                <hr className="divider" />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <div className="text-sm text-muted" style={{ marginBottom: 4 }}>Assignee</div>
                    <div style={{ fontWeight: 500 }}>
                      {task.assignee ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 12 }}>
                            {task.assignee.name[0].toUpperCase()}
                          </div>
                          {task.assignee.name}
                        </div>
                      ) : <span className="text-muted">Unassigned</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted" style={{ marginBottom: 4 }}>Created by</div>
                    <div style={{ fontWeight: 500 }}>{task.createdBy?.name || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted" style={{ marginBottom: 4 }}>Due Date</div>
                    <div style={{ fontWeight: 500, color: overdue ? 'var(--danger)' : 'inherit' }}>
                      {task.dueDate ? format(new Date(task.dueDate), 'MMMM d, yyyy') : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted" style={{ marginBottom: 4 }}>Created</div>
                    <div style={{ fontWeight: 500 }}>{format(new Date(task.createdAt), 'MMMM d, yyyy')}</div>
                  </div>
                  {task.completedAt && (
                    <div>
                      <div className="text-sm text-muted" style={{ marginBottom: 4 }}>Completed</div>
                      <div style={{ fontWeight: 500, color: 'var(--success)' }}>
                        {format(new Date(task.completedAt), 'MMMM d, yyyy')}
                      </div>
                    </div>
                  )}
                </div>

                {task.tags && task.tags.length > 0 && (
                  <>
                    <hr className="divider" />
                    <div>
                      <div className="text-sm text-muted" style={{ marginBottom: 8 }}>Tags</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {task.tags.map((tag) => (
                          <span key={tag} className="badge badge-gray">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
