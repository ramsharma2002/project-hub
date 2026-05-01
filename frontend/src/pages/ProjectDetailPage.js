import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { projectsAPI, tasksAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format, isPast } from 'date-fns';

const statusColors = { todo: 'status-todo', 'in-progress': 'status-in-progress', review: 'status-review', done: 'status-done' };
const priorityColors = { low: 'priority-low', medium: 'priority-medium', high: 'priority-high', critical: 'priority-critical' };

function TaskModal({ projectId, projectMembers, task, onClose, onSaved }) {
  const isEdit = !!task;
  const [form, setForm] = useState(
    isEdit
      ? { title: task.title, description: task.description || '', status: task.status, priority: task.priority, dueDate: task.dueDate ? task.dueDate.split('T')[0] : '', assignee: task.assignee?._id || '' }
      : { title: '', description: '', status: 'todo', priority: 'medium', dueDate: '', assignee: '' }
  );
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.title.trim() || form.title.trim().length < 2) errs.title = 'Title must be at least 2 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const payload = { ...form, assignee: form.assignee || null };
      let res;
      if (isEdit) {
        res = await tasksAPI.update(task._id, payload);
        onSaved(res.data.task, 'updated');
      } else {
        res = await tasksAPI.create(projectId, payload);
        onSaved(res.data.task, 'created');
      }
      toast.success(`Task ${isEdit ? 'updated' : 'created'}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                type="text"
                className={`form-input ${errors.title ? 'error' : ''}`}
                placeholder="Task title"
                value={form.title}
                onChange={(e) => { setForm(f => ({ ...f, title: e.target.value })); setErrors(er => ({ ...er, title: '' })); }}
              />
              {errors.title && <p className="form-error">{errors.title}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Describe the task…"
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input" value={form.dueDate} onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select className="form-select" value={form.assignee} onChange={(e) => setForm(f => ({ ...f, assignee: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {projectMembers.map((m) => (
                    <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose, onAdded }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authAPI.getAllUsers().then((res) => setUsers(res.data.users)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) { toast.error('Please select a user'); return; }
    setLoading(true);
    try {
      const res = await projectsAPI.addMember(projectId, { userId: selectedUser, role });
      onAdded(res.data.project);
      toast.success('Member added!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Add Member</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Select User</label>
              <select className="form-select" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                <option value="">Choose a user…</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Project Role</label>
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding…' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        projectsAPI.getOne(id),
        tasksAPI.getByProject(id),
      ]);
      setProject(projRes.data.project);
      setTasks(tasksRes.data.tasks);
    } catch (err) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isProjectAdmin = () => {
    if (isAdmin) return true;
    if (!project) return false;
    if (project.owner._id === user._id || project.owner === user._id) return true;
    const member = project.members.find((m) => (m.user._id || m.user) === user._id);
    return member?.role === 'admin';
  };

  const handleTaskSaved = (savedTask, action) => {
    if (action === 'created') {
      setTasks((prev) => [savedTask, ...prev]);
    } else {
      setTasks((prev) => prev.map((t) => t._id === savedTask._id ? savedTask : t));
    }
    setShowTaskModal(false);
    setEditTask(null);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await projectsAPI.removeMember(id, userId);
      setProject((p) => ({ ...p, members: p.members.filter((m) => (m.user._id || m.user) !== userId) }));
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and ALL its tasks? This cannot be undone.')) return;
    try {
      await projectsAPI.delete(id);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await tasksAPI.update(taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => t._id === taskId ? res.data.task : t));
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!project) return null;

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    return true;
  });

  const taskCounts = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    'in-progress': tasks.filter((t) => t.status === 'in-progress').length,
    review: tasks.filter((t) => t.status === 'review').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  return (
    <>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>← Back</button>
          <div>
            <h1>{project.name}</h1>
            <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              by {project.owner?.name} • {project.members.length} members
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {isProjectAdmin() && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMember(true)}>+ Add Member</button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>Delete Project</button>
            </>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'To Do', count: taskCounts['todo'], color: '#6b7280' },
            { label: 'In Progress', count: taskCounts['in-progress'], color: '#3b82f6' },
            { label: 'Review', count: taskCounts['review'], color: '#f59e0b' },
            { label: 'Done', count: taskCounts['done'], color: '#10b981' },
          ].map(({ label, count, color }) => (
            <div key={label} className="card" style={{ padding: '16px 20px', borderTop: `3px solid ${color}` }}>
              <div style={{ fontSize: 24, fontWeight: 800, color }}>{count}</div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--gray-200)', marginBottom: 20 }}>
          {['tasks', 'members'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px', background: 'none', border: 'none',
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? 'var(--primary)' : 'var(--gray-500)',
                borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer', textTransform: 'capitalize', fontSize: 14,
              }}
            >
              {tab === 'tasks' ? `Tasks (${tasks.length})` : `Members (${project.members.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'tasks' && (
          <>
            <div className="task-filters">
              <button className="btn btn-primary btn-sm" onClick={() => setShowTaskModal(true)}>+ New Task</button>
              <select className="form-select" style={{ width: 140 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
              <select className="form-select" style={{ width: 140 }} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <h3>No tasks found</h3>
                <p>Create a task to start tracking work.</p>
              </div>
            ) : (
              <div className="task-list">
                {filteredTasks.map((task) => {
                  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
                  return (
                    <div key={task._id} className={`task-item ${overdue ? 'overdue' : ''}`}>
                      <div className="task-info">
                        <div className={`task-title ${task.status === 'done' ? 'done' : ''}`}>
                          {task.title}
                          {overdue && <span style={{ fontSize: 11, color: 'var(--danger)', marginLeft: 8, fontWeight: 600 }}>OVERDUE</span>}
                        </div>
                        <div className="task-meta">
                          <span className={`badge ${statusColors[task.status]}`}>{task.status}</span>
                          <span className={`badge ${priorityColors[task.priority]}`}>{task.priority}</span>
                          {task.assignee && <span>👤 {task.assignee.name}</span>}
                          {task.dueDate && <span>📅 {format(new Date(task.dueDate), 'MMM d')}</span>}
                        </div>
                      </div>
                      <div className="task-actions">
                        <select
                          className="form-select"
                          style={{ width: 130, fontSize: 12, padding: '5px 8px' }}
                          value={task.status}
                          onChange={(e) => handleStatusChange(task._id, e.target.value)}
                        >
                          <option value="todo">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </select>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => { setEditTask(task); setShowTaskModal(true); }}
                          title="Edit"
                        >✏️</button>
                        {isProjectAdmin() && (
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDeleteTask(task._id)} title="Delete">🗑️</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'members' && (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    {isProjectAdmin() && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {project.members.map((m) => (
                    <tr key={m.user._id || m._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13 }}>
                            {(m.user?.name || '?')[0].toUpperCase()}
                          </div>
                          {m.user?.name}
                          {(m.user?._id === user._id) && <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>(you)</span>}
                        </div>
                      </td>
                      <td style={{ color: 'var(--gray-500)' }}>{m.user?.email}</td>
                      <td>
                        <span className={`badge ${m.role === 'admin' ? 'role-badge-admin' : 'role-badge-member'}`}>
                          {m.role}
                        </span>
                      </td>
                      <td style={{ color: 'var(--gray-500)' }}>
                        {m.joinedAt ? format(new Date(m.joinedAt), 'MMM d, yyyy') : '—'}
                      </td>
                      {isProjectAdmin() && (
                        <td>
                          {m.user?._id !== user._id && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.user._id)}>
                              Remove
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showTaskModal && (
        <TaskModal
          projectId={id}
          projectMembers={project.members}
          task={editTask}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
          onSaved={handleTaskSaved}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          projectId={id}
          onClose={() => setShowAddMember(false)}
          onAdded={(updatedProject) => { setProject(updatedProject); setShowAddMember(false); }}
        />
      )}
    </>
  );
}
