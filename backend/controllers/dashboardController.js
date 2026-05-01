const Task = require('../models/Task');
const Project = require('../models/Project');

const getDashboard = async (req, res, next) => {
  try {
    const projects = await Project.findAll({ userId: req.user._id, isAdmin: req.user.role === 'admin' });
    const projectIds = projects.map((p) => p._id);

    const [statsMap, overdueTasks, myTasks, recentTasks] = await Promise.all([
      Task.getStatsByProjects(projectIds),
      Task.getOverdue(projectIds),
      Task.getMyTasks(projectIds, req.user._id),
      Task.getRecent(projectIds),
    ]);

    res.json({
      success: true,
      dashboard: {
        projects: {
          total: projects.length,
          active: projects.filter((p) => p.status === 'active').length,
          completed: projects.filter((p) => p.status === 'completed').length,
          onHold: projects.filter((p) => p.status === 'on-hold').length,
        },
        tasks: {
          ...statsMap,
          total: Object.values(statsMap).reduce((a, b) => a + b, 0),
          overdue: overdueTasks.length,
        },
        overdueTasks,
        myTasks,
        recentTasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
