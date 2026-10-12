# Kiddoshadow Backend Project Flow

## 1. Purpose

`kiddoshadow-backend` is an Express + Sequelize + PostgreSQL backend for a school platform with these major use cases:

- authentication and role-based access
- school setup and school administration
- teacher, student, and parent profile management
- timetable, homework, attendance, exams, and report cards
- AI-assisted learning and teacher tools
- quiz/game flows
- notifications, group chat, and socket-based real-time features
- subscriptions, payment logs, and token management

The backend is started from `server.js` and exposes both HTTP APIs and Socket.IO channels.

## 2. Runtime Bootstrap Flow

### 2.1 Startup sequence

When the server starts, the flow is:

1. Load environment variables with `dotenv`.
2. Create the Express app.
3. Create the HTTP server and attach Socket.IO.
4. Import Sequelize connection from `src/config/db.js`.
5. Import `src/models/initModels.js` so all model associations are registered.
6. Register socket handlers:
   - `initGameSocket(io)`
   - `initGroupChatSocket(io)`
   - `initNotificationSocket(io)`
7. Register middlewares:
   - `cors`
   - `express.json()`
   - `helmet`
   - `morgan("dev")`
8. Mount all API route modules.
9. Register `404` fallback and global `errorHandler`.
10. Authenticate Sequelize with PostgreSQL.
11. Run `db.sync({ force: false })`.
12. Listen on `PORT` or default `3003`.

### 2.2 Core infra files

- `server.js`: app bootstrap, middleware, route mounting, socket startup
- `src/config/db.js`: Sequelize PostgreSQL connection
- `src/models/initModels.js`: model imports and association wiring
- `src/shared/errorHandler.js`: global API error response handling
- `src/shared/middlewares/auth.js`: JWT auth and trusted user identity attachment
- `src/shared/middlewares/role.js`: role authorization

## 3. High-Level Architecture

The project follows a module-based structure:

- `src/modules/<module>`: feature modules
- `*.routes.js`: endpoint registration
- `*.controller.js`: request/response layer
- `*.service.js`: business logic
- `*.model.js`: Sequelize models
- `*.schema.js`: request validation schemas
- `src/shared`: shared middleware, utilities, app errors
- `src/socket`: real-time socket handlers

The practical request flow is:

`Client -> Route -> protect middleware -> allowRoles middleware -> validate middleware -> Controller -> Service -> Sequelize Model -> PostgreSQL -> Response`

## 4. Authentication and Authorization Flow

## 4.1 Login flow

Endpoint:

- `POST /api/auth/login`

Login behavior observed in code:

1. User logs in with `username` or `email` plus `password`.
2. Backend looks up `User`.
3. If user does not exist and the submitted credentials match `SUPER_ADMIN_USERNAME` and `SUPER_ADMIN_PASSWORD`, the backend bootstraps the first `super_admin` record.
4. Password is checked directly against the stored user password.
5. For non-super-admin users, the school must exist and be `active`.
6. JWT is issued with base claims:
   - `id`
   - `role`
   - `school_id`
7. Student logins also include:
   - `student_id`
   - `class_id`
   - `section_id`

Endpoint:

- `POST /api/auth/change-password`

This requires a valid Bearer token.

## 4.2 Protected request flow

For protected APIs, `protect` middleware does this:

1. Reads Bearer token from `Authorization`.
2. Verifies JWT with `JWT_SECRET`.
3. Loads the `User` from DB.
4. Rejects inactive users.
5. Rejects users from missing/inactive schools, except `super_admin`.
6. Builds a trusted `req.user` identity.
7. Adds profile IDs for teachers and students:
   - `teacher_id` for teachers
   - `student_id`, `class_id`, `section_id` for students

Role checks are enforced by `allowRoles(...)`.

## 4.3 First-login and profile completion

There is a `forceFirstLogin` middleware in the shared layer, intended to block normal usage until the user completes profile onboarding. In the current codebase, the middleware exists but is not broadly mounted in the route files shown here. Profile completion is still available through explicit endpoints:

- `POST /api/teachers/complete-profile`
- `POST /api/students/complete-profile`

## 5. Main Actors and Business Flow

## 5.1 Super Admin Flow

Main role: global platform owner.

Flow:

1. Login through `POST /api/auth/login`.
2. Create schools through `POST /api/schools`.
3. View schools through `GET /api/schools`.
4. Activate/deactivate schools through `PATCH /api/schools/:id/status`.
5. Activate/deactivate school admin user through `PATCH /api/schools/:id/admin-status`.
6. Reset school admin password through `PATCH /api/schools/:id/admin-reset-password`.
7. Manage subscriptions through `POST /api/subscriptions`.
8. Manage token policy and balances:
   - `GET /api/tokens/policies`
   - `POST /api/tokens/policies`
   - `GET /api/tokens/accounts`
   - `GET /api/tokens/transactions`
   - `POST /api/tokens/users/:userId/adjust`

Primary outcome:

- creates the school tenant
- creates the school admin access
- controls top-level billing and token policy

## 5.2 School Admin Flow

Main role: manages one school.

Typical school setup flow:

1. Login.
2. Create academic structure:
   - `POST /api/classes`
   - `POST /api/sections`
   - `POST /api/subjects`
3. Create teachers:
   - `POST /api/teachers`
   - bulk via `/api/bulk/bulk-create` or `/api/bulk/create`
4. Create students:
   - `POST /api/students`
   - bulk via `/api/bulk/bulk-create` or `/api/bulk/create`
5. Create or link parents:
   - `POST /api/parents/parents`
   - `POST /api/parents/parents/link`
6. Assign teachers to class/section/subject:
   - `POST /api/teacher-assignments`
7. Build section timetables:
   - `POST /api/timetables`
8. Review approval requests:
   - `GET /api/admin/approvals/pending`
   - `POST /api/admin/approvals/:type/:id/:action`
9. Create academic operations:
   - homework
   - notifications
   - exams
   - report cards
   - payment logs

Operational APIs:

- teachers: `GET /api/teachers`, `GET /api/teachers/options`
- students: `GET /api/students`, `GET /api/students/options`
- parents: `GET /api/parents/parents`, `GET /api/parents/parents/options`
- classes: `GET /api/classes`, `GET /api/classes/:id`
- sections by class: `GET /api/sections/classes/:class_id/sections`
- timetables: `POST /api/timetables`
- payment logs:
  - `GET /api/payment-logs/options`
  - `GET /api/payment-logs`
  - `POST /api/payment-logs`

## 5.3 Teacher Flow

Main role: teaching, planning, attendance, AI, and section activity.

Typical teacher flow:

1. Login.
2. Complete teacher profile:
   - `POST /api/teachers/complete-profile`
3. View own profile:
   - `GET /api/teachers/me`
4. View dashboard:
   - `GET /api/teachers/dashboard`
5. View own assignments:
   - `GET /api/teacher-assignments/teacher/me`
6. View section assignments:
   - `GET /api/teacher-assignments/section/:sectionId`
7. View own timetable:
   - `GET /api/timetables/teacher/me`
8. Save timetable when permitted:
   - `POST /api/timetables`
9. Create homework:
   - `POST /api/homework`
10. Review homework analytics:
   - `GET /api/homework/analytics/summary`
   - `GET /api/homework/analytics/:homework_id/students`
11. Mark attendance:
   - `POST /api/teachers/attendance`
12. View attendance analytics:
   - `GET /api/teachers/attendance/summary`
   - `GET /api/teachers/attendance/analytics`
13. Review pending approvals scoped to teacher visibility:
   - `GET /api/teachers/approvals/pending`
   - `POST /api/teachers/approvals/:type/:id/:action`
14. Use teacher AI tools:
   - `POST /api/teacher/ai`
   - `POST /api/teacher/ai/question-paper`
   - `POST /api/teacher/ai/lesson-summary`
15. Create teacher-driven notifications and group chats.

## 5.4 Student Flow

Main role: learning, dashboard usage, homework, attendance, quiz, AI.

Typical student flow:

1. Login.
2. Complete profile:
   - `POST /api/students/complete-profile`
3. View own profile:
   - `GET /api/students/me`
4. View dashboard:
   - `GET /api/students/dashboard`
5. View homework:
   - `GET /api/homework`
6. Submit homework:
   - `POST /api/homework/:homework_id/submit`
7. View timetable:
   - `GET /api/timetables/section`
8. View attendance:
   - `GET /api/students/attendance/summary`
9. Use RAG AI:
   - `GET /api/rag/ask`
   - `POST /api/rag/ask`
   - `POST /api/rag/speak`
10. Participate in quizzes/games:
   - `/api/quiz/*`
   - `/api/game/*`
11. View notifications:
   - `GET /api/notifications`
12. Acknowledge notifications:
   - `POST /api/notifications/:id/acknowledge`

## 5.5 Parent Flow

Main role: child monitoring, payment visibility, attendance, notifications.

Typical parent flow:

1. Login.
2. Update/view profile:
   - `PATCH /api/parents/parents/profile`
   - `GET /api/parents/parents/profile`
3. View linked children:
   - `GET /api/parents/children`
4. View parent dashboard:
   - `GET /api/parents/dashboard`
5. View child attendance:
   - `GET /api/parents/attendance/summary`
   - `GET /api/parents/attendance/analytics`
6. View timetable:
   - `GET /api/timetables/section`
7. View notifications:
   - `GET /api/notifications`
8. View payment logs:
   - `GET /api/payment-logs/me`
9. View AI assigned tests:
   - `GET /api/parent/ai-tests`

## 6. Module Flow by Domain

## 6.1 Core master data

Modules:

- `schools`
- `users`
- `classes`
- `sections`
- `subjects`

These modules define the tenant and academic base structure. Most later flows depend on them.

Dependency chain:

`School -> Users -> Classes -> Sections -> Subjects -> Teacher Assignments -> Timetable/Homework/Attendance/Report Cards`

## 6.2 Teacher assignment and planning

Modules:

- `teacher-assignments`
- `teacher-class-sessions`
- `timetables`
- `homework`

Flow:

1. School admin creates teacher assignments for class, section, and subject.
2. Timetable rows link back to `teacher_assignment_id`.
3. Teacher class sessions can be created from timetable or class execution flow.
4. Homework uses teacher assignment context to enforce subject-section ownership.

Key routes:

- `POST /api/teacher-assignments`
- `GET /api/teacher-assignments`
- `GET /api/teacher-assignments/teacher/me`
- `GET /api/teacher-assignments/section/:sectionId`
- `POST /api/timetables`
- `GET /api/timetables/section`
- `GET /api/timetables/teacher/me`
- `POST /api/teacher-class-sessions/*`
- `POST /api/homework`
- `GET /api/homework`

## 6.3 Attendance flow

Modules:

- `attendance`
- `teacher-class-sessions`

Flow:

1. Teacher teaches a class/session.
2. Teacher marks attendance for students.
3. Attendance is stored with links to:
   - school
   - class
   - section
   - student
   - teacher class session
   - user who marked it
4. Summaries and analytics are then exposed separately for teacher, parent, and student views.

Routes:

- `POST /api/teachers/attendance`
- `GET /api/teachers/attendance/summary`
- `GET /api/teachers/attendance/analytics`
- `GET /api/parents/attendance/summary`
- `GET /api/parents/attendance/analytics`
- `GET /api/students/attendance/summary`

## 6.4 Exams and report cards

Modules:

- `report-cards`

Flow:

1. Exam is created for a school/class.
2. Report card is created for a student under that exam.
3. Subject-wise marks are added through report card mark records.
4. Report card can then be published and exposed to the student flow.

Routes:

- `POST /api/exams`
- `POST /api/exams/bulk`
- `GET /api/exams`
- `POST /api/report-cards`
- `POST /api/report-cards/:id/marks`
- `POST /api/report-cards/:id/publish`
- `GET /api/report-cards/student/list`
- `GET /api/report-cards/:id`

## 6.5 Notifications flow

Modules:

- `notifications`

Flow:

1. School admin or teacher creates a notification.
2. Notification is stored with optional school/class targeting.
3. Users fetch notifications over HTTP.
4. Users acknowledge receipt through a separate ack record.
5. Socket layer places connected users in their school room for real-time delivery patterns.

Routes:

- `POST /api/notifications`
- `GET /api/notifications`
- `POST /api/notifications/:id/acknowledge`
- `GET /api/notifications/:id/acknowledgements`

## 6.6 Group chat flow

Modules:

- `group-chat`
- Socket.IO `group-chat.socket.js`

HTTP flow:

1. Teacher creates a group chat.
2. Members fetch chat list and messages.
3. Teacher or school admin can delete chat.

Socket flow:

1. Client connects with JWT in socket auth.
2. User emits `group:join` with `chatId`.
3. Backend verifies membership.
4. User emits `group:message`.
5. Backend validates membership and active chat.
6. Message is persisted.
7. Backend broadcasts `group:message:new` to `group:<chatId>`.

Routes:

- `POST /api/group-chat`
- `GET /api/group-chat`
- `GET /api/group-chat/:chatId/messages`
- `DELETE /api/group-chat/:chatId`

## 6.7 Quiz and game flow

Modules:

- `quiz`
- `game`
- Socket.IO `game.socket.js`

Flow:

1. Quiz content is generated or created.
2. Single-player or multiplayer game session is created.
3. Players join via HTTP and socket flow.
4. Host starts session.
5. Server pushes questions one by one over sockets.
6. Players submit answers in real time.
7. Scores are updated.
8. Session finishes automatically when time or questions are exhausted.
9. Leaderboard/history can be queried over HTTP.

Game routes:

- `POST /api/game/quiz/single/start`
- `POST /api/game/quiz/single/submit`
- `POST /api/game/quiz/multi/create`
- `POST /api/game/quiz/multi/join`
- `GET /api/game/quiz/:sessionId/leaderboard`
- `GET /api/game/quiz/history`

Important socket events:

- `quiz:join`
- `quiz:start`
- `quiz:question`
- `quiz:answer`
- `quiz:answer_ack`
- `quiz:finished`
- `quiz:waiting`
- `quiz:all_finished`

## 6.8 AI and learning modules

Modules:

- `rag`
- `teacher-ai`
- `ai-test-assignments`
- `ai-analytics`
- subject learning modules such as:
  - `logical-thinking`
  - `science-exploration`
  - `intro-coding`
  - `gk-builder`
  - `gamified-learning`
  - `coding-ai`
  - `career-discovery`
  - `communication-skills`
  - `science-math-learning`
  - `creative-skills`
  - `competitive-exam`
  - `career-path`
  - `study-strategy`
  - `advanced-exams`
  - `advanced-coding`
  - `career-mentorship`
  - `entrepreneurship`

General AI flow:

1. Authenticated user sends prompt/question.
2. Request passes rate limit and auth where applicable.
3. Backend pulls context or prompt templates.
4. AI response is generated.
5. Chat/log records may be stored depending on module behavior.

Teacher AI routes:

- `POST /api/teacher/ai`
- `POST /api/teacher/ai/question-paper`
- `POST /api/teacher/ai/lesson-summary`

RAG routes:

- `GET /api/rag/ask`
- `POST /api/rag/ask`
- `POST /api/rag/speak`

AI assigned test routes:

- `POST /api/teacher/ai-tests`
- `GET /api/teacher/ai-tests`
- `GET /api/teacher/ai-tests/:id`
- `PATCH /api/teacher/ai-tests/:id`
- `GET /api/student/ai-tests/lock-status`
- `GET /api/student/ai-tests`
- `GET /api/student/ai-tests/:id`
- `POST /api/student/ai-tests/:id/start`
- `POST /api/student/ai-tests/:id/submit`
- `GET /api/parent/ai-tests`

## 6.9 Billing and token flow

Modules:

- `subscriptions`
- `payment-logs`
- `tokens`

Flow:

1. Super admin records or updates school subscription.
2. School admin creates payment logs for students/parents/school accounting views.
3. Super admin manages token policies and manual adjustments.
4. Token accounts and transactions are stored separately for auditing.

Routes:

- `POST /api/subscriptions`
- `GET /api/payment-logs/options`
- `GET /api/payment-logs`
- `POST /api/payment-logs`
- `GET /api/payment-logs/me`
- `GET /api/tokens/policies`
- `POST /api/tokens/policies`
- `GET /api/tokens/accounts`
- `GET /api/tokens/transactions`
- `POST /api/tokens/users/:userId/adjust`

## 7. Mounted API Map from `server.js`

Auth:

- `/api/auth`

Attendance:

- `/api`
- `/api/attendance`

Core entities:

- `/api/schools`
- `/api/students`
- `/api/teachers`
- `/api/parents`
- `/api/sections`
- `/api/subjects`
- `/api/classes`
- `/api/timetables`
- `/api/report-cards`
- `/api/exams`
- `/api/payment-logs`

Approvals and dashboards:

- `/api`

Bulk:

- `/api`
- `/api/bulk`

AI:

- `/api/rag`
- `/api`

Teacher planning and engagement:

- `/api/teacher-assignments`
- `/api/teacher-class-sessions`
- `/api/homework`
- `/api/notifications`
- `/api/group-chat`
- `/api/game`
- `/api/voice`
- `/api/quiz`
- multiple AI learning module prefixes under `/api/*`

## 8. Data Model Flow

The strongest relationship backbone in `src/models/initModels.js` is:

- `School` owns `User`, `Class`, `Teacher`, `Student`, `Section`, `PaymentLog`
- `User` has one of `Teacher`, `Student`, or `Parent`
- `Class` has many `Section`, `Student`, `Timetable`, `Attendance`, `Homework`
- `Section` has many `Student`, `Timetable`, `Attendance`, `Homework`
- `Teacher` has many `TeacherAssignment`
- `TeacherAssignment` ties together:
  - teacher
  - class
  - section
  - subject
- `Timetable` belongs to `TeacherAssignment`
- `Homework` belongs to `TeacherAssignment`
- `TeacherClassSession` belongs to `TeacherAssignment` and `Timetable`
- `Attendance` belongs to `TeacherClassSession`
- `Exam -> ReportCard -> ReportCardMark`
- `Notification -> NotificationAck`
- `Quiz -> QuizQuestion -> GameSession -> GameSessionPlayer -> PlayerAnswer`

This means most classroom activity is centered around `TeacherAssignment`, while most learner activity is centered around `Student`, `Section`, and `Class`.

## 9. Real-Time Flow

Socket namespaces are not custom namespaces; the project uses the default Socket.IO server with event-based room handling.

### 9.1 Common socket auth

Each socket initializer verifies JWT from `socket.handshake.auth.token` and attaches:

- `id`
- `role`
- `school_id`

### 9.2 Notification socket

Flow:

1. User connects.
2. Backend joins socket to `school:<school_id>`.
3. Backend emits `notification:connected`.

### 9.3 Group chat socket

Flow:

1. User joins `group:<chatId>`.
2. Membership is checked before access.
3. New messages are persisted then broadcast to the room.

### 9.4 Game socket

Flow:

1. Host/player joins `quiz:<sessionId>`.
2. Session state is stored in memory via `Map`.
3. Server emits questions on a timer.
4. Player answers are stored in DB.
5. Session ends when all players finish or time ends.

## 10. Important Scripts and Commands

From `package.json`:

- `npm start`
- `npm run dev`
- `npm run ingest:missing`
- `npm run migrate`
- `npm run migrate:undo`
- `npm run seed`
- `npm run seed:undo`

Operational note:

- migrations use `sequelize-cli` with `config/config.cjs`
- RAG ingestion has dedicated scripts under `src/modules/rag`

## 11. Observed Implementation Notes

These are important findings from the current code structure:

1. `server.js` uses `db.sync({ force: false })` on startup in addition to migrations, so schema changes may be influenced by both sync and migration workflows.
2. Existing auth logic compares passwords directly as stored values; there is no hashing in the visible login controller.
3. `protect` middleware has an `AUTH_BYPASS` mode for development.
4. Attendance routes are mounted twice for backward compatibility:
   - under `/api`
   - under `/api/attendance`
5. `docs/flow.md` needed updating because the active backend includes many more modules than the earlier summary covered.

## 12. Recommended Reading Order for New Developers

If someone is onboarding into this backend, the most useful order is:

1. `server.js`
2. `src/shared/middlewares/auth.js`
3. `src/models/initModels.js`
4. `src/modules/auth/*`
5. core modules:
   - `schools`
   - `classes`
   - `sections`
   - `subjects`
   - `teachers`
   - `students`
   - `parents`
6. classroom flow modules:
   - `teacher-assignments`
   - `timetables`
   - `teacher-class-sessions`
   - `homework`
   - `attendance`
7. engagement modules:
   - `notifications`
   - `group-chat`
   - `quiz`
   - `game`
8. AI modules:
   - `rag`
   - `teacher-ai`
   - `ai-test-assignments`

## 13. Short End-to-End Summary

The real backend flow is:

1. Super admin creates and activates a school.
2. School admin creates teachers, students, parents, classes, sections, and subjects.
3. School admin creates teacher assignments that become the base for timetable, attendance, homework, and teaching flow.
4. Teachers run classroom operations and can use AI, homework, attendance, group chat, quiz, and notification features.
5. Students consume timetable, homework, quizzes, AI, attendance, and notifications.
6. Parents consume dashboards, child tracking, attendance, payment logs, and notifications.
7. Socket.IO supports live group chat, school-level notifications, and real-time quiz gameplay.
