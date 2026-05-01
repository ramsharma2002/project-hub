const Project = require('../models/Project');

const isProjectMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId || req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const isMember = project.members.some((m) => m.user._id === req.user._id);
    const isOwner = project.owner._id === req.user._id;
    if (!isMember && !isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. You are not a member of this project.' });
    }
    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
};

const isProjectAdmin = async (req, res, next) => {
  try {
    const project = req.project || await Project.findById(req.params.projectId || req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const memberEntry = project.members.find((m) => m.user._id === req.user._id);
    const isOwner = project.owner._id === req.user._id;
    const isProjectAdminRole = memberEntry && memberEntry.role === 'admin';
    if (!isOwner && !isProjectAdminRole && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Project admin or owner role required.' });
    }
    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { isProjectMember, isProjectAdmin };
