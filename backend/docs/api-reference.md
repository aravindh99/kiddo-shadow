API Reference (Frontend)

Base
Base URL: `/api`
Auth: `Authorization: Bearer <token>` (all protected routes)
School scope: derived from `req.user.school_id` unless explicitly noted (super_admin endpoints).
Pagination: `limit`, `offset` (query) where supported.

Auth
POST `/api/auth/login`
Roles: Public
Request: `{ "username": "string", "password": "string" }`
Response: `{ "token": "jwt" }`

POST `/api/auth/change-password`
Roles: Any authenticated user
Request: `{ "old_password": "string", "new_password": "string" }`
Response: `{ "message": "Password updated successfully" }`

Schools (super_admin)
POST `/api/schools`
Roles: super_admin
Request: `{ name, code, cbse_affiliation_no, address, city, state, zip, email, admin_username, admin_password }`
Response: `{ school, admin }` (from service)

GET `/api/schools`
Roles: super_admin
Query: `limit`, `offset`, optional filters (see service)
Response: `{ count, rows }` (each row includes `users` array with school_admin user: `id`, `username`, `is_active`, `first_login`)

PATCH `/api/schools/:id/status`
Roles: super_admin
Request: `{ "status": "pending|active|suspended|expired" }`
Response: `{ "message": "Status updated", "school": { ... } }`

PATCH `/api/schools/:id/admin-status`
Roles: super_admin
Request: `{ "is_active": true|false }`
Response: `{ "message": "School admin status updated", "admin": { ... } }`

PATCH `/api/schools/:id/admin-reset-password`
Roles: super_admin
Request: `{ "new_password": "string" }`
Response: `{ "message": "Password reset", "admin": { username } }`

Subscriptions (super_admin)
POST `/api/subscriptions`
Roles: super_admin
Request: `{ "schoolId": number, "status": "active|inactive|...", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "notes": "string" }`
Response: `{ "message": "Subscription updated", "subscription": { ... } }`

Classes
POST `/api/classes`
Roles: school_admin
Request: `{ "class_name": "string" }`
Response: `{ "success": true, "data": { ... } }`

GET `/api/classes`
Roles: school_admin, teacher
Response: `{ "total": number, "items": [ { class + sections } ] }`

GET `/api/classes/login-roster`
Roles: school_admin
Query: `class_id` (optional), `section_id` (optional)
Response: `{ "success": true, "data": { "teachers": [...], "classes": [...] } }`

GET `/api/classes/:id`
Roles: school_admin, teacher
Response: `{ "success": true, "data": { ... } }`

PATCH `/api/classes/:id`
Roles: school_admin
Request: `{ "class_name": "string" }`
Response: `{ "success": true, "data": { ... } }`

DELETE `/api/classes/:id`
Roles: school_admin
Response: `{ "success": true, "message": "Class deleted successfully" }`

Sections
POST `/api/sections`
Roles: school_admin
Request: `{ "class_id": number, "name": "string" }`
Response: `{ "success": true, "data": { ... } }`

GET `/api/sections/classes/:class_id/sections`
Roles: school_admin, teacher
Response: `{ "total": number, "items": [ { ... } ] }`

PATCH `/api/sections/:id/status`
Roles: school_admin
Request: `{ "is_active": true|false }`
Response: `{ "success": true, "data": { ... } }`

Subjects
POST `/api/subjects`
Roles: school_admin
Request: `{ "name": "string" }`
Response: `{ "success": true, "data": { ... } }`

GET `/api/subjects`
Roles: school_admin, teacher
Response: `{ "total": number, "items": [ { ... } ] }`

PATCH `/api/subjects/:id`
Roles: school_admin
Request: `{ "name": "string" }`
Response: `{ "success": true, "data": { ... } }`

DELETE `/api/subjects/:id`
Roles: school_admin
Response: `{ "success": true, "message": "Subject deleted successfully" }`

Students (admin)
POST `/api/students`
Roles: school_admin
Request: `{ "class_id": number, "section_id": number }`
Response: `{ "created": 1, "student": { ... }, "students": [ ... ] }`

GET `/api/students`
Roles: school_admin
Query: `limit`, `offset`, `class_id?`, `section_id?`
Response: `{ "total": number, "items": [ { student + user + class + section } ] }`

GET `/api/students/options`
Roles: school_admin
Query: `class_id?`, `section_id?`
Response: `{ "total": number, "items": [ { id, class_id, section_id, roll_no, admission_no, user, class, section } ] }`

PATCH `/api/students/:id/move`
Roles: school_admin
Request: `{ "section_id": number }`
Response: `{ "message": "Student moved", "student": { ... } }`

PATCH `/api/students/:id/status`
Roles: school_admin
Request: `{ "is_active": true|false }`
Response: `{ "message": "Status updated", "student": { ... } }`

POST `/api/students/assign-section`
Roles: school_admin
Request: `{ "target_class_id": number, "target_section_id": number, "students": [ { "student_id": number, "roll_no": number } ] }`
Response: `{ "success": true, "message": "Students assigned successfully" }`

Students (self)
POST `/api/students/complete-profile`
Roles: student
Request: `{ name, phone?, email?, dob?, gender?, blood_group?, father_name?, mother_name?, guardian_name?, father_occupation?, mother_occupation?, address?, family_income? }`
Response: `{ "message": "Profile completed", "token": "jwt", "user": { ... } }`

GET `/api/students/me`
Roles: student
Response: `{ student + class + section }`

Student Dashboard
GET `/api/students/dashboard`
Roles: student
Response: `{ "success": true, "data": { ... } }`

Student Profile Approval
PATCH `/api/students/profile/request`
Roles: student
Request: `{ profile_pic?, dob?, gender?, father_name?, mother_name?, guardian_name?, address?, blood_group?, aadhar_no?, father_occupation?, mother_occupation?, family_income? }`
Response: `{ "message": "Profile update submitted for teacher approval" }`

Teachers (admin)
POST `/api/teachers`
Roles: school_admin
Request: `{}` (username/password are ignored; username is auto-generated)
Response: `{ "teacher_id": number, "username": "string", "employee_id": "string", "password_hint": "username@123" }`

GET `/api/teachers`
Roles: school_admin
Query: `limit`, `offset`
Response: `{ "total": number, "items": [ { teacher + user } ] }`

GET `/api/teachers/options`
Roles: school_admin
Response: `{ "total": number, "items": [ { id, user_id, employee_id, approval_status, is_active, user } ] }`

PATCH `/api/teachers/:id/status`
Roles: school_admin
Request: `{ "is_active": true|false }`
Response: `{ "message": "Status updated", "teacher": { ... } }`

Teachers (self)
POST `/api/teachers/complete-profile`
Roles: teacher
Request: `{ name, phone?, gender?, designation?, qualification?, experience?, email? }`
Response: `{ "message": "Profile completed", "token": "jwt", "user": { ... } }`

GET `/api/teachers/me`
Roles: teacher
Response: `{ teacher + user }`

Teacher Dashboard
GET `/api/teachers/dashboard`
Roles: teacher
Response: `{ "success": true, "data": { ... } }`

Teacher Profile Approval
PATCH `/api/teachers/profile/request`
Roles: teacher
Request: `{ name?, phone?, qualification?, experience_years?, address? }`
Response: `{ "message": "Profile update submitted for admin approval" }`

POST `/api/admin/teachers/:teacher_id/approve`
Roles: school_admin
Request: `{ "action": "approve|reject" }`
Response: `{ "teacher_id": number, "status": "approve|reject" }`

Teacher Bulk Approval
POST `/api/admin/teachers/bulk-approve`
Roles: school_admin
Request: `{ "teacher_ids": [number], "action": "approve|reject" }`
Response: `{ "processed": number }`

Parents (admin)
POST `/api/parents/parents`
Roles: school_admin
Request: `{ "student_id": number, "relation_type": "mother|father|guardian" }`
Response: `{ "parent_id": number, "username": "string", "student_id": number, "relation_type": "guardian", "password_hint": "username@123" }`

POST `/api/parents/parents/link`
Roles: school_admin
Request: `{ "parent_user_id": number, "student_id": number, "relation_type": "mother|father|guardian" }`
Response: `{ "parent_user_id": number, "student_id": number }`

GET `/api/parents/parents`
Roles: school_admin
Query: `limit`, `offset`, `approval_status` (pending|approved|rejected)
Response: `{ "total": number, "items": [ { parent + user + student (includes student.user) } ] }`

GET `/api/parents/parents/options`
Roles: school_admin
Response: `{ "total": number, "items": [ { id, username, name, phone, is_active } ] }`

Parents (self)

Parent Approvals
POST `/api/teachers/parents`
Roles: teacher
Request: `{ "username": "string", "student_id": number, "relation_type": "mother|father|guardian" }`
Response: `{ "parent_id": number, "message": "Parent created and sent for admin approval" }`

POST `/api/admin/parents/:parent_id/approve`
Roles: school_admin
Request: `{ "action": "approve|reject" }`
Response: `{ "parent_id": number, "status": "approve|reject" }`

Parent Bulk Approval
POST `/api/admin/parents/bulk-approve`
Roles: school_admin
Request: `{ "parent_ids": [number], "action": "approve|reject" }`
Response: `{ "processed": number }`

Parent Dashboard
GET `/api/parents/children`
Roles: parent
Query: `limit`, `offset`
Response: `{ "success": true, "total": number, "data": [ { relation_type, student } ] }`

GET `/api/parents/dashboard`
Roles: parent
Response: `{ "success": true, "data": { ... } }`

Approvals (general)
GET `/api/teachers/approvals/pending`
Roles: teacher
Query: `limit`, `offset`, `class_id`, `from_date`, `to_date`
Response: `{ "total": number, "items": [students] }`
Notes: Results are scoped to the teacher's assigned sections.

POST `/api/teachers/approvals/:type/:id/:action`
Roles: teacher
Params: `type` = student|teacher|parent, `action` = approve|reject
Request: `{ "rejection_reason"?: "string" }`
Response: `{ "message": "Request processed successfully", "result": { ... } }`
Notes: For `type=student`, action is allowed only if the teacher is assigned to the student's section.

GET `/api/admin/approvals/pending`
Roles: school_admin
Query: `limit`, `offset`, `from_date`, `to_date`
Response: `{ "teachers": { total, items }, "parents": { total, items } }`

POST `/api/admin/approvals/:type/:id/:action`
Roles: school_admin
Params: `type` = student|teacher|parent, `action` = approve|reject
Request: `{ "rejection_reason"?: "string" }`
Response: `{ "message": "Request processed successfully", "result": { ... } }`

Bulk Seeder
POST `/api/bulk/bulk-create`
Roles: school_admin
Request: `{ "classes": [ { "name": "Class 6", "sections": [ { "name": "A", "students": 30 } ] } ], "teacher_count"?: number }`
Response: `{ "message": "Data created successfully", "summary": { classes_created, teachers_created, students_created, ... } }`

POST `/api/bulk/create`
Roles: school_admin
Request: same as above
Response: same as above

Attendance Summary
POST `/api/teachers/attendance`
Roles: teacher
Request: `{ "teacher_class_session_id": number, "records": [ { "student_id": number, "status": "present|absent|leave" } ] }`
Response: `{ "success": true, "message": "Attendance marked successfully" }`

GET `/api/teachers/attendance/summary`
Roles: teacher
Query: `class_id`, `section_id`, `from_date`, `to_date`, `limit`, `offset`
Response: `{ "total": number, "items": [ ... ] }`

GET `/api/parents/attendance/summary`
Roles: parent
Query: `from_date`, `to_date`, `limit`, `offset`
Response: `{ "total": number, "items": [ ... ] }`

GET `/api/students/attendance/summary`
Roles: student
Query: `from_date`, `to_date`, `limit`, `offset`
Response: `{ "total": number, "items": [ ... ] }`

Attendance Analytics
GET `/api/teachers/attendance/analytics`
Roles: teacher
Query: `from_date`, `to_date`, `class_id?`, `section_id?`, `student_id?`
Response: `{ "items": [ ... ] }`

GET `/api/parents/attendance/analytics`
Roles: parent
Query: `from_date`, `to_date`
Response: `{ "items": [ ... ] }`

Timetables
POST `/api/timetables`
Roles: school_admin, teacher
Request: `{ "class_id": number, "section_id": number, "day_of_week": "monday|tuesday|wednesday|thursday|friday|saturday", "entries": [ { "start_time": "HH:mm", "end_time": "HH:mm", "teacher_assignment_id"?: number, "title"?: "string", "is_break": boolean } ] }`
Response: `{ "success": true, "message": "Timetable saved successfully" }`

GET `/api/timetables/section`
Roles: any authenticated user
Query: `class_id`, `section_id`
Response: `{ "success": true, "data": { "monday": [ ... ], "tuesday": [ ... ] } }`

GET `/api/timetables/teacher/me`
Roles: teacher
Response: `{ "success": true, "data": { "monday": [ ... ], "tuesday": [ ... ] } }`

Teacher Assignments
POST `/api/teacher-assignments`
Roles: school_admin
Request: `{ "teacher_id": number, "class_id": number, "section_id": number, "subject_id": number, "is_class_teacher"?: boolean }`
Response: `{ "success": true, "data": { ... } }`

GET `/api/teacher-assignments`
Roles: school_admin
Query: `limit`, `offset`
Response: `{ "success": true, "total": number, "items": [ ... ] }`

GET `/api/teacher-assignments/teacher/:teacherId`
Roles: school_admin, teacher
Response: `{ "success": true, "data": [ ... ] }`

GET `/api/teacher-assignments/section/:sectionId`
Roles: school_admin, teacher (class teacher for that section)
Response: `{ "success": true, "data": [ ... ] }`

PATCH `/api/teacher-assignments/:id`
Roles: school_admin
Request: `{ "is_active"?: boolean, "is_class_teacher"?: boolean }`
Response: `{ "success": true, "data": { ... } }`

DELETE `/api/teacher-assignments/:id`
Roles: school_admin
Response: `{ "success": true, "message": "..." }`

Teacher Class Sessions
POST `/api/teacher-class-sessions/start`
Roles: teacher
Request: `{ "teacher_assignment_id": number, "timetable_id"?: number }`
Response: `{ "success": true, "data": { ... } }`

POST `/api/teacher-class-sessions/:id/end`
Roles: teacher
Response: `{ "success": true, "data": { ... } }`

Homework
POST `/api/homework`
Roles: school_admin, teacher
Request: `{ "class_id": number, "section_id": number, "teacher_assignment_id": number, "homework_date": "YYYY-MM-DD", "description": "string" }`
Response: `{ "success": true, "data": { ... } }`

GET `/api/homework`
Roles: any authenticated user
Query: `class_id?`, `section_id?`, `date?`
Response: `{ "success": true, "total": number, "items": [ ... ] }`

POST `/api/homework/:homework_id/submit`
Roles: student
Request: `{ "is_completed": true|false, "remark"?: "string" }`
Response: `{ "success": true, "data": { ... } }`

GET `/api/homework/analytics/summary`
Roles: school_admin, teacher
Query: `class_id?`, `section_id?`, `date?`
Response: `{ "success": true, "data": { ... } }`

GET `/api/homework/analytics/:homework_id/students`
Roles: school_admin, teacher
Response: `{ "success": true, "data": { ... } }`

Notifications
POST `/api/notifications`
Roles: school_admin, teacher
Request: `{ "title": "string", "message": "string", "target_role": "teacher|parent|student|all", "class_id"?: number, "section_id"?: number }`
Response: `{ "success": true, "data": { ... } }`

GET `/api/notifications`
Roles: any authenticated user
Response: `{ "success": true, "total": number, "items": [ ... ] }`

POST `/api/notifications/:id/acknowledge`
Roles: parent, teacher, student
Request: `{}` (no body)
Response: `{ "success": true, "message": "Acknowledged" }`

GET `/api/notifications/:id/acknowledgements`
Roles: school_admin, sender teacher
Response: `{ "success": true, "data": { count, rows } }`

Group Chat
POST `/api/group-chat`
Roles: teacher
Request: `{ "subjectId": number, "sectionId": number }`
Response: `{ "chatId": number }`

GET `/api/group-chat`
Roles: teacher, student
Response: `[ { chatId, role, subject, class, section, created_at } ]`

GET `/api/group-chat/:chatId/messages`
Roles: teacher, student, school_admin
Response: `[ { id, sender_id, sender_name, avatar, content, type, created_at } ]`

Quiz
POST `/api/quiz`
Roles: teacher, school_admin
Request: `{ "title"?: "string", "topic"?: "string", "topicId"?: number, "difficulty"?: "string", "questions": [ { "question_text"?: "string", "question"?: "string", "options": [string], "correct_option_index"?: number, "correctIndex"?: number } ] }`
Response: `{ "quizId": number }`

POST `/api/quiz/generate`
Roles: student, teacher
Request: `{ "topic": "string", "classLevel"?: "string|number", "difficulty"?: "string", "numQuestions"?: number }`
Response: `{ "quizId": number, "questions": [ ... ] }`

Game (Quiz Sessions)
POST `/api/game/quiz/single/start`
Roles: student, teacher
Request: `{ "quizId": number, "timeLimitMinutes": number }`
Response: `{ "sessionId": number, "playerId": number }`

POST `/api/game/quiz/single/submit`
Roles: student, teacher
Request: `{ "playerId": number, "answers": [ { "questionId": number, "selectedIndex": number } ] }`
Response: `{ "score": number, "total": number }`

POST `/api/game/quiz/multi/create`
Roles: student, teacher
Request: `{ "topic": "string", "classLevel"?: "string|number", "difficulty"?: "string", "numQuestions"?: number, "roomCode"?: "string", "maxPlayers"?: number, "timeLimitMinutes"?: number }`
Response: `{ "sessionId": number, "roomCode": "string", "quizId": number }`

POST `/api/game/quiz/multi/join`
Roles: student, teacher
Request: `{ "roomCode": "string" }`
Response: `{ "sessionId": number, "playerId"?: number, "isTeacher"?: true, "isHost"?: boolean }`

GET `/api/game/quiz/:sessionId/leaderboard`
Roles: student, teacher
Response: `[ { score, finished_at, user: { id, name } } ]`

RAG
POST `/api/rag/ask`
Roles: student, teacher, parent
Query: `voice=true` (optional, returns audio/wav stream)
Request: `{ "question": "string", "classLevel"?: "string|number", "subject"?: "string", "sourcePath"?: "books-relative-pdf-path", "bookPath"?: "books-relative-pdf-path", "currentBook"?: "books-relative-pdf-path", "selectedBook"?: "books-relative-pdf-path", "book"?: "file.pdf", "chapter"?: "chapter-id" }`
Response (text): `{ "question": "string", "answer": "string", "sources": [ ... ], "source_type"?: "rag|none", "filters_used"?: "class_subject|class|null" }`
Response (voice): `audio/wav` stream

Teacher AI
POST `/api/teacher/ai`
Roles: teacher
Request: `{ "aiType": "string", "payload": { ... } }`
Response: `{ "aiType": "string", "result": { "text": "string", "source_type": "rag|gemini", "sources": ["..."], "filters_used": "class_subject|class|global|null" } }`

AI Analytics
GET `/api/analytics/ai/school`
Roles: school_admin, super_admin
Query (super_admin): `school_id` (optional)
Response: `[ { total_calls, total_tokens, role } ]`

GET `/api/analytics/ai/school/users`
Roles: school_admin, super_admin
Query (super_admin): `school_id` (optional), `role` (optional)
Response: `[ { user_id, role, total_calls, total_tokens } ]`

GET `/api/analytics/ai/school/classes`
Roles: school_admin, super_admin
Query (super_admin): `school_id` (optional)
Response: `[ { class_id, class_name, total_calls, total_tokens } ]`

GET `/api/analytics/ai/teacher`
Roles: teacher
Response: `[ { ai_type, calls, tokens } ]`

GET `/api/analytics/ai/student`
Roles: student
Response: `[ { date, tokens } ]`

AI Tokens & Limits
Notes:
- Token unit = LLM tokens reported by Gemini `usageMetadata.totalTokenCount` (prompt + response).
- Each AI call deducts that token count from the user’s `token_accounts.balance`.
- Monthly token policy is stored in DB and can be set by super_admin.

GET `/api/tokens/policies`
Roles: super_admin
Response: `{ "success": true, "data": [ { role, monthly_tokens, updated_by } ] }`

POST `/api/tokens/policies`
Roles: super_admin
Request: `{ "role": "student|teacher", "monthly_tokens": number, "mode"?: "replace|add", "school_id"?: number }`
Response: `{ "success": true, "message": "Policy updated", "data": { role, monthly_tokens } }`

GET `/api/tokens/accounts`
Roles: super_admin
Query: `school_id` (optional), `role` (optional)
Response: `{ "success": true, "items": [ { user_id, balance, expires_at } ] }`

GET `/api/tokens/transactions`
Roles: super_admin
Query: `school_id` (optional), `user_id` (optional)
Response: `{ "success": true, "items": [ { user_id, type, change, balance_before, balance_after, created_at } ] }`

POST `/api/tokens/users/:userId/adjust`
Roles: super_admin
Request: `{ "amount": number, "mode"?: "add|set" }`
Response: `{ "success": true, "data": { user_id, balance } }`

Audit Logs
GET `/api/admin/audit-logs`
Roles: school_admin
Query: `entity_type`, `entity_id`, `from_date`, `to_date`, `limit`, `offset`
Response: `{ "total": number, "items": [ ... ] }`

Exams & Report Cards
POST `/api/exams`
Roles: school_admin, teacher
Request: `{ "class_id": number, "name": "string", "start_date"?: "YYYY-MM-DD", "end_date"?: "YYYY-MM-DD" }`
Response: `{ "success": true, "data": { ... } }`

POST `/api/exams/:id/lock`
Roles: school_admin
Request: `{ "is_locked": true }`
Response: `{ "success": true, "data": { ... } }`

GET `/api/exams`
Roles: student, parent, teacher
Query: `class_id` (required)
Response: `{ "success": true, "total": number, "items": [ ... ] }`

POST `/api/report-cards`
Roles: school_admin, teacher
Request: `{ "student_id": number, "exam_id": number }`
Response: `{ "success": true, "data": { ... } }`

POST `/api/report-cards/:id/marks`
Roles: school_admin, teacher
Request: `{ "marks": [ { "subject_id": number, "marks_obtained": number, "max_marks": number } ] }`
Response: `{ "success": true, "message": "Marks saved" }`

POST `/api/report-cards/:id/publish`
Roles: school_admin, teacher
Request: `{ "remarks"?: "string" }`
Response: `{ "success": true, "data": { ... } }`

GET `/api/report-cards/student/list`
Roles: student
Response: `{ "success": true, "data": [ ... ] }`

GET `/api/report-cards/:id`
Roles: teacher, student, parent, school_admin (scoped)
Response: `{ "success": true, "data": { ... } }`

Approvals Dashboard (Admin/Teacher)
GET `/api/teachers/approvals/pending` and `GET /api/admin/approvals/pending`
See Approvals section above.

Sockets (Socket.IO)
Auth: connect with `io(url, { auth: { token: "<jwt>" } })`

Quiz / Game Socket (`game.socket.js`)
Client emit: `quiz:join` `{ sessionId }`
Server emit: `quiz:joined` `{ sessionId, playerId|null, status, isHost }`
Server emit: `quiz:question` `{ question, questionIndex, totalQuestions, timeLimit }`
Client emit: `quiz:start` `{ sessionId }` (host only)
Server emit: `quiz:started` `{ startedAt, totalTimeMs }`
Client emit: `quiz:answer` `{ sessionId, questionId, selectedIndex }`
Server emit: `quiz:answer_ack` `{ questionId, isCorrect }`
Client emit: `quiz:finished` `{ sessionId }`
Server emit: `quiz:waiting`, `quiz:finished`, `quiz:all_finished`, `quiz:time_up`
Server emit: `quiz:error` `{ message }`

Group Chat Socket (`group-chat.socket.js`)
Client emit: `group:join` `{ chatId }`
Server emit: `group:joined` `{ chatId }`
Client emit: `group:message` `{ chatId, type: "text|image", text?, imageUrl? }`
Server emit: `group:message:new` `{ id, chatId, senderUserId, type, text, imageUrl, createdAt }`
Client emit: `group:leave` `{ chatId }`
Server emit: `group:error` `{ message }`

Notifications Socket (`notification.socket.js`)
On connect: server joins `school:<school_id>` room
Server emit: `notification:connected` `{ school_id }`
