# ProjectHub — Project Management App

A full-stack project management web application with role-based access control (Admin/Member), built with **React**, **Node.js**, **Express**, and **MongoDB**.

---

## Features

- **Authentication** — Signup, Login with JWT tokens
- **Role-Based Access Control** — Admin and Member roles (global + per-project)
- **Project Management** — Create, update, delete projects; manage members
- **Task Tracking** — Create tasks, assign to members, set priority & due dates
- **Task Status workflow** — `todo → in-progress → review → done`
- **Dashboard** — Stats overview, overdue tasks, tasks assigned to you, recent activity
- **Validations** — Server-side and client-side input validation
- **Security** — Password hashing (bcryptjs), JWT auth, CORS, protected routes

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, React Router v6         |
| Styling    | Pure CSS (custom design system)   |
| Backend    | Node.js, Express.js               |
| Database   | MongoDB with Mongoose             |
| Auth       | JWT (jsonwebtoken), bcryptjs      |
| Validation | express-validator                 |
| Notifications | react-toastify                 |

---

## Project Structure

```
Assignment/
├── backend/
│   ├── config/db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Signup, Login, Me
│   │   ├── projectController.js  # CRUD + member management
│   │   ├── taskController.js     # CRUD tasks
│   │   └── dashboardController.js# Aggregated stats
│   ├── middleware/
│   │   ├── auth.js               # JWT protect, restrictTo
│   │   └── projectAccess.js      # isProjectMember, isProjectAdmin
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   └── dashboard.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── public/index.html
    └── src/
        ├── context/AuthContext.js  # Auth state management
        ├── services/api.js         # Axios API client
        ├── pages/
        │   ├── LoginPage.js
        │   ├── SignupPage.js
        │   ├── DashboardPage.js
        │   ├── ProjectsPage.js
        │   ├── ProjectDetailPage.js
        │   ├── TaskDetailPage.js
        │   ├── UsersPage.js        # Admin only
        │   └── ProfilePage.js
        ├── components/Layout.js    # Sidebar navigation
        ├── App.js                  # Routes + guards
        ├── index.css               # Global styles
        └── index.js
```

---

## Getting Started

### Prerequisites
- Node.js v16+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

### 1. Clone & Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set MONGO_URI and JWT_SECRET
npm run dev
```

### 2. Setup Frontend

```bash
cd frontend
npm install
npm start
```

The React app runs on **http://localhost:3000** and proxies API calls to **http://localhost:5000**.

---

## REST API Reference

### Auth
| Method | Endpoint          | Auth    | Description              |
|--------|-------------------|---------|--------------------------|
| POST   | /api/auth/signup  | Public  | Register new user        |
| POST   | /api/auth/login   | Public  | Login, returns JWT       |
| GET    | /api/auth/me      | Token   | Get current user         |
| PUT    | /api/auth/me      | Token   | Update profile           |
| GET    | /api/auth/users   | Admin   | List all users           |

### Projects
| Method | Endpoint                           | Auth          | Description              |
|--------|------------------------------------|---------------|--------------------------|
| GET    | /api/projects                      | Token         | List accessible projects |
| POST   | /api/projects                      | Token         | Create project           |
| GET    | /api/projects/:id                  | Member        | Get project details      |
| PUT    | /api/projects/:id                  | Project Admin | Update project           |
| DELETE | /api/projects/:id                  | Project Admin | Delete project + tasks   |
| POST   | /api/projects/:id/members          | Project Admin | Add member               |
| DELETE | /api/projects/:id/members/:userId  | Project Admin | Remove member            |

### Tasks
| Method | Endpoint                            | Auth          | Description       |
|--------|-------------------------------------|---------------|-------------------|
| GET    | /api/projects/:projectId/tasks      | Member        | List project tasks|
| POST   | /api/projects/:projectId/tasks      | Member        | Create task       |
| GET    | /api/tasks/:id                      | Member        | Get task detail   |
| PUT    | /api/tasks/:id                      | Member*       | Update task       |
| DELETE | /api/tasks/:id                      | Creator/Admin | Delete task       |

*Members can only update status of tasks assigned to them; project admins/owners can update everything.

### Dashboard
| Method | Endpoint       | Auth  | Description              |
|--------|----------------|-------|--------------------------|
| GET    | /api/dashboard | Token | Stats, overdue, my tasks |

---

## Role-Based Access Control

### Global Roles
- **Admin** — Can see all projects, all users, perform any action
- **Member** — Can only access projects they belong to

### Per-Project Roles
- **Owner** — Full control of the project
- **Admin** — Can update project, add/remove members, manage tasks
- **Member** — Can create tasks, update status of assigned tasks

---

## Environment Variables (backend/.env)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/projectmanagement
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```
