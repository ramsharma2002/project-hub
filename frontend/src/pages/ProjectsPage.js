import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { projectsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const statusColors = {
  active: 'badge-green',
  completed: 'badge-blue',
  'on-hold': 'badge-yellow',
  cancelled: 'badge-red',
};

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', dueDate: '' });
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
      const res = await projectsAPI.create(form);
      onCreated(res.data.project);
      toast.success('Project created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">New Project</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input
                type="text"
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="e.g. Website Redesign"
                value={form.name}
                onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })); }}
              />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="What is this project about?"
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-input"
                value={form.dueDate}
                onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    projectsAPI.getAll()
      .then((res) => setProjects(res.data.projects))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCreated = (project) => {
    setProjects((prev) => [project, ...prev]);
    setShowCreate(false);
  };

  return (
    <>
      <div className="page-header">
        <h1>Projects</h1>
        <div className="flex gap-3 items-center">
          <input
            type="text"
            className="form-input"
            placeholder="Search projects…"
            style={{ width: 220 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + New Project
          </button>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <h3>{search ? 'No projects match your search' : 'No projects yet'}</h3>
            <p>Create your first project to get started.</p>
          </div>
        ) : (
          <div className="projects-grid">
            {filtered.map((project) => {
              const progress =
                project.taskStats?.total > 0
                  ? Math.round((project.taskStats.done / project.taskStats.total) * 100)
                  : 0;
              return (
                <div
                  key={project._id}
                  className="project-card"
                  onClick={() => navigate(`/projects/${project._id}`)}
                >
                  <div className="project-card-header">
                    <h3 className="project-card-title">{project.name}</h3>
                    <span className={`badge ${statusColors[project.status] || 'badge-gray'}`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="project-card-desc">
                    {project.description || 'No description provided.'}
                  </p>
                  <div className="progress-bar-container">
                    <div className="progress-bar-label">
                      <span>Progress</span>
                      <span>{progress}% ({project.taskStats?.done || 0}/{project.taskStats?.total || 0} tasks)</span>
                    </div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="project-card-footer">
                    <div className="avatar-group">
                      {(project.members || []).slice(0, 4).map((m) => (
                        <div key={m.user?._id || m._id} className="avatar-item" title={m.user?.name || ''}>
                          {(m.user?.name || '?')[0].toUpperCase()}
                        </div>
                      ))}
                      {(project.members || []).length > 4 && (
                        <div className="avatar-item">+{project.members.length - 4}</div>
                      )}
                    </div>
                    {project.dueDate && (
                      <span>Due {format(new Date(project.dueDate), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </>
  );
}
