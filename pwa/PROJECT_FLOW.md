# Kiddos PWA Project Flow

## 1. What This Project Is

`kiddos-pwa` is the role-based Progressive Web App for end users of the Kiddo platform.

Primary roles supported in this app:

- `student`
- `teacher`
- `parent`

Main stack:

- React
- React Router
- MUI
- Axios
- Vite
- `vite-plugin-pwa`
- Socket.IO client for realtime quiz and group chat

This app is separate from the admin console. It is the day-to-day experience for teachers, students, and parents.

## 2. Boot Flow

Entry file: `src/main.jsx`

Startup sequence:

1. `registerServiceWorker()` runs before render
2. React mounts the app with:
   - `ThemeProvider`
   - `AuthProvider`
   - `BrowserRouter`
   - `App`

That means every screen runs inside:

- theme context
- auth/session context
- router context
- PWA registration state

## 3. App Root Flow

Root file: `src/app/App.jsx`

The app root does four important things:

1. watches online/offline status using `useOnlineStatus`
2. redirects offline users to `OfflinePage`
3. computes the correct role landing path from the current auth user
4. applies route guards around all role app shells

Main route groups:

- `/login`
- `/first-login`
- `/approval-pending`
- `/student/*`
- `/teacher/*`
- `/parent/*`
- `/unauthorized`

If the user is authenticated, `/` and unknown routes redirect to the role-specific home.

## 4. Authentication Flow

Core files:

- `src/auth/AuthProvider.jsx`
- `src/api/auth.api.js`
- `src/modules/login/useLogin.jsx`
- `src/modules/login/LoginForm.jsx`

### Login Flow

1. user submits credentials on the login page
2. login logic calls backend auth endpoint
3. backend returns JWT
4. `AuthProvider.login(token)` validates and stores the token
5. token is saved in `localStorage`
6. JWT is decoded into `user`
7. the app redirects based on role

### Session Restore Flow

On refresh:

1. `AuthProvider` reads token from `localStorage`
2. validates token format
3. checks expiry
4. rejects unsupported roles
5. restores `token` and decoded `user`

Only these roles are accepted in this app:

- `student`
- `teacher`
- `parent`

### Profile Hydration Flow

After session restore or login:

1. `AuthProvider` calls `getMyProfile(user.role)`
2. role-specific profile fields are merged into `user`
3. frontend enriches session state with:
   - name
   - phone
   - email
   - avatar
   - class/section data
   - `approval_status`
   - `first_login`

This is important because JWT payload alone is not the complete UI identity.

### Logout Flow

1. local logout clears `localStorage`
2. auth state is reset
3. logout API is attempted, but local cleanup is the real guarantee

## 5. Route Guard Flow

The PWA has a layered route-guard system.

Core guard files:

- `src/auth/RequireAuth.jsx`
- `src/auth/RequireRole.jsx`
- `src/auth/ForceProfileCompletion.jsx`
- `src/auth/RequireApproval.jsx`
- `src/pages/ProtectedAppWrapper.jsx`

### Effective Guard Sequence

For protected role routes, the flow is:

`RequireAuth -> RequireRole -> RequireApproval -> ForceProfileCompletion -> role app shell`

### Guard Responsibilities

`RequireAuth`

- ensures a logged-in user exists
- redirects to `/login` if not
- can route first-login users to completion

`RequireRole`

- ensures the JWT role matches the route family

`RequireApproval`

- refetches profile status from backend
- checks `approval_status`
- redirects non-approved users to `/approval-pending`

`ForceProfileCompletion` and `ProtectedAppWrapper`

- redirect first-login users into profile completion flows
- special-case parents so their completion path can be `/parent/profile`

## 6. Role App Shells

## Student App Flow

File: `src/pages/StudentApp.jsx`

Shell components:

- `AppHeader`
- `StudentSidebar`
- `BottomNav`
- `StudentTestLockGate`

Main student routes include:

- dashboard
- profile
- timetable
- attendance
- diary
- notifications
- report cards
- group chat
- AI chat
- voice chat
- quiz
- AI tests
- academic domains
- personalized pages
- foundation stage
- themes

This shell is optimized for a mobile-first learner experience with bottom navigation and sidebar toggles.

## Teacher App Flow

File: `src/pages/TeacherApp.jsx`

Shell components:

- `AppHeader`
- `TeacherSidebar`
- `BottomNav`

Main teacher routes include:

- dashboard
- profile
- teacher timetable
- diary
- notifications
- class sessions
- approvals
- exam creation
- assigned classes
- report card entry
- student reports
- AI tools
- teacher AI test results
- group chat
- quiz flows
- themes

This shell is operationally centered around classroom management and planning.

## Parent App Flow

File: `src/pages/ParentApp.jsx`

Shell components:

- `AppHeader`
- `ParentSidebar`
- `BottomNav`

Main parent routes include:

- dashboard
- profile
- timetable
- diary
- notifications
- payments
- AI tests
- report card detail
- group chat
- foundation stage
- themes

This shell is a monitoring/support experience rather than a content-authoring experience.

## 7. Shared Request Flow

Core API files:

- `src/api/config.js`
- `src/api/axios.js`
- `src/api/axios.interceptors.js`

### Axios Client Flow

1. shared axios instance is created with base URL and timeout
2. request metadata is attached for timing
3. request interceptor injects `Authorization` from stored token
4. request interceptor rejects expired tokens before sending
5. response interceptor handles retries for retryable failures
6. `401` triggers logout
7. some `403` cases trigger special redirects or session resets

### Base URL Flow

The app is built to use:

- environment config from `.env`
- relative `/api` routing in development
- Vite proxy behavior from `vite.config.js`

Typical dev flow:

1. browser calls the PWA dev server
2. frontend requests `/api/...`
3. Vite proxies those calls to the backend server

## 8. Feature Module Flow

The PWA is organized mostly by feature folders under `src/modules`.

Common module structure:

- page components
- hooks
- `*.api.js`
- sometimes sockets/components/helpers

### Dashboard Flow

Files around:

- `src/modules/dashboard/*`

Purpose:

- role-specific summary cards and quick navigation
- acts as the default landing experience after login

### Profile Flow

Files around:

- `src/modules/profile/*`

Purpose:

- load current role profile
- update profile details
- upload avatar where supported

### Timetable Flow

Files around:

- `src/modules/timetable/*`
- `src/modules/teacher-timetable/*`

Purpose:

- student and parent read section timetable
- teacher reads and manages teaching timetable

### Attendance Flow

Files around:

- `src/modules/attendance/*`
- `src/modules/teacher-class-sessions/*`

Purpose:

- student/parent consume attendance views
- teacher starts sessions and marks attendance-related activity

### Diary / Homework Flow

Files around:

- `src/modules/diary/*`

Purpose:

- view homework/diary entries
- teachers create entries
- students/parents consume them

### Notification Flow

Files around:

- `src/modules/notifications/*`

Purpose:

- list announcements
- create announcements where role allows
- acknowledge notifications

### Report Card Flow

Files around:

- `src/modules/report-card/*`

Purpose:

- list or view report cards for student/parent
- teacher enters marks and report card data

### Approval Flow

Files around:

- `src/modules/approvals/*`

Purpose:

- teacher reviews pending updates
- approval actions call the backend approval endpoints

### Group Chat Flow

Files around:

- `src/modules/group-chat/*`

Purpose:

- list chats
- enter chat room
- use realtime socket updates

### Quiz Flow

Files around:

- `src/modules/quiz/*`

Purpose:

- single-player quiz
- multiplayer quiz lobby/play/results
- realtime quiz socket coordination

### AI Chat / Voice / AI Tests Flow

Files around:

- `src/modules/ai-chat/*`
- `src/modules/voice-chat/*`
- `src/modules/ai-tools/*`
- `src/modules/ai-tests/*`

Purpose:

- student AI learning chat
- voice-based interaction
- teacher AI tools
- assigned AI tests and results

## 9. Realtime Flow

### Group Chat Socket

File: `src/modules/group-chat/groupChat.socket.js`

Flow:

1. connect to Socket.IO server with auth token
2. join a chat room
3. send/receive group events
4. disconnect when done

### Quiz Socket

File: `src/modules/quiz/socket/quiz.socket.js`

Flow:

1. connect with token
2. join quiz session room
3. listen for question/answer/game status events
4. disconnect at end of flow

### Important Frontend Realtime Note

Both socket helpers keep a singleton connection in module scope. That simplifies reuse, but it means lifecycle cleanup matters to avoid stale sessions.

## 10. PWA and Offline Flow

Core files:

- `src/pwa/serviceWorker.js`
- `src/pwa/usePwaInstall.js`
- `src/pwa/manifest.js`
- `public/manifest.json`

### Service Worker Flow

1. service worker is registered at app start
2. update prompts can ask the user to reload
3. offline-ready state is announced
4. custom browser events can be dispatched for PWA notifications

### Offline Manager Flow

`OfflineManager` in `src/pwa/serviceWorker.js` tracks:

- online/offline status
- listeners
- queued requests

When the device comes back online:

1. listeners are notified
2. pending requests are retried
3. PWA notification events are emitted

### App-Level Offline Behavior

The app root also uses `useOnlineStatus`, and if offline it renders `OfflinePage`.

So this project has both:

- global visual offline gating
- lower-level service worker/offline utilities

## 11. Theme Flow

Core files:

- `src/theme/ThemeProvider.jsx`
- `src/theme/themes.js`
- `src/theme/tokens.js`

Theme responsibilities:

- provide MUI theme tokens
- store and restore selected theme
- support different UI themes/pages

## 12. Media and Rich Interaction Flow

Additional capability layers include:

- `src/three/*` for 3D robot rendering helpers
- `src/speech/*` for speech recognition and audio playback
- `src/services/cloudStorage.js` for upload abstraction
- `src/utils/imageUtils.js` for image validation/compression

These enrich the AI and profile experience beyond plain forms and tables.

## 13. End-to-End User Flows

## Student End-to-End Flow

1. student logs in
2. token is stored and decoded
3. profile is hydrated from backend
4. route guards check auth, role, approval, and profile completion
5. student lands on dashboard
6. student navigates to timetable, diary, AI chat, report cards, or quiz
7. module APIs call backend through shared axios client
8. socket features connect only when needed

## Teacher End-to-End Flow

1. teacher logs in
2. teacher profile is hydrated
3. approval/profile-completion gates are enforced
4. teacher lands on dashboard
5. teacher manages class sessions, approvals, homework, report cards, and AI tools
6. teacher uses timetable and assignment flows to drive classroom actions
7. teacher can enter quiz/group-chat realtime flows

## Parent End-to-End Flow

1. parent logs in
2. parent profile is restored and hydrated
3. route guards verify approval/completion
4. parent lands on dashboard
5. parent views child-related timetable, diary, payments, report cards, and AI tests

## 14. Current Architectural Characteristics

### Strengths

- clear separation between auth shell and role app shells
- robust route-guard layering
- centralized axios client and interceptors
- strong feature-folder organization
- PWA/offline support is already integrated
- realtime features are isolated into their own modules

### Watchouts

- some auth/profile checks are duplicated across guards and wrappers
- approval and first-login routing logic lives in multiple places
- singleton sockets require careful cleanup
- offline utilities are more capable than some current UI flows actively use
- role support is intentionally limited to `student`, `teacher`, and `parent`

## 15. Recommended Reading Order

1. `src/main.jsx`
2. `src/app/App.jsx`
3. `src/auth/AuthProvider.jsx`
4. route guards under `src/auth/*`
5. `src/api/axios.js`
6. `src/api/axios.interceptors.js`
7. role app shells:
   - `src/pages/StudentApp.jsx`
   - `src/pages/TeacherApp.jsx`
   - `src/pages/ParentApp.jsx`
8. feature modules needed for your area
9. PWA and socket helpers

## 16. Short Summary

In practical terms, the PWA works like this:

1. app boots with theme, auth, router, and service worker
2. token is restored or created on login
3. backend profile data enriches the session
4. route guards enforce auth, role, approval, and first-login completion
5. users enter role-specific app shells
6. feature modules talk to backend through shared axios infrastructure
7. chat and quiz features open realtime socket connections when needed
8. PWA utilities handle installability, updates, and offline support
