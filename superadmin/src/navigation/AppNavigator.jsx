// import React from "react";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// import Login from "../modules/login/Login.jsx";

// // School Admin modules
// import Dashboard from "../modules/schooladmin/dashboard/Dashboard.jsx";
// import Classes from "../modules/schooladmin/classes/Class.jsx";
// import Students from "../modules/schooladmin/students/Students.jsx";
// import Sections from "../modules/schooladmin/sections/Sections.jsx";
// import Teachers from "../modules/schooladmin/teachers/Teachers.jsx";
// import ReportCards from "../modules/schooladmin/reportcards/ReportCards.jsx";
// import Settings from "../modules/schooladmin/settings/Settings.jsx";

// import Schools from "../modules/superadmin/schools/Schools.jsx";
// import Reference from "../modules/superadmin/reference/Reference.jsx";
// import GlobalStats from "../modules/superadmin/golbalstatus/golbal.jsx";
// import SuperAdminDashboard from "../modules/superadmin/dashboard/DashBoard.jsx";
// import SuperAdminLayout from "../modules/superadmin/SuperAdminLayout.jsx";

// import SchoolAdminLayout from "../modules/schooladmin/SchoolAdminLayout.jsx";

// import StaffLayout from "../modules/staff/layout/StaffLayout.jsx";
// import StaffDashboard from "../modules/staff/dashboard/StaffDashboard.jsx";

// export default function AppNavigator() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         {/* LOGIN - Default Route */}
//         <Route path="/" element={<Login />} />
//         <Route path="/login" element={<Login />} />

//         {/* SCHOOL ADMIN ROUTES */}
//         <Route path="/schooladmin" element={<SchoolAdminLayout />}>
//           <Route path="dashboard" element={<Dashboard />} />
//           <Route path="classes" element={<Classes />} />
//           <Route path="students" element={<Students />} />
//           <Route path="sections" element={<Sections />} />
//           <Route path="teachers" element={<Teachers />} />
//           <Route path="reports" element={<ReportCards />} />
//           <Route path="settings" element={<Settings />} />
//         </Route>

//         {/* SUPER ADMIN ROUTES */}
//         <Route path="/superadmin" element={<SuperAdminLayout />}>
//           <Route path="dashboard" element={<SuperAdminDashboard />} />
//           <Route path="schools" element={<Schools />} />
//           <Route path="reference" element={<Reference />} />
//           <Route path="global-stats" element={<GlobalStats />} />
//           <Route path="schools/:id/classes" element={<Classes />} />
//           <Route path="settings" element={<div>Settings</div>} />
//         </Route>

//         {/* STAFF / TEACHER ROUTES */}
//         <Route path="/staff" element={<StaffLayout />}>
//           <Route path="dashboard" element={<StaffDashboard />} />
//           {/* Add more staff routes here later */}
//         </Route>
//         {/* Redirect unknown routes */}
//         <Route path="*" element={<Navigate to="/login" replace />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }


import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../modules/login/Login.jsx";

// School Admin
import Dashboard from "../modules/schooladmin/dashboard/Dashboard.jsx";
import Classes from "../modules/schooladmin/classes/Class.jsx";
import Students from "../modules/schooladmin/students/Students.jsx";
import Sections from "../modules/schooladmin/sections/Sections.jsx";
import Teachers from "../modules/schooladmin/teachers/Teachers.jsx";
import ReportCards from "../modules/schooladmin/reportcards/ReportCards.jsx";
import Settings from "../modules/schooladmin/settings/Settings.jsx";
import AuditLogs from "../modules/schooladmin/audit/AuditLogs.jsx";
import Approvals from "../modules/schooladmin/approvals/Approvals.jsx";
import Announcements from "../modules/schooladmin/announcements/Announcements.jsx";
import BulkUpload from "../modules/schooladmin/bulkupload/Bulkupload.jsx";
import Subjects from "../modules/schooladmin/subjects/Subjects.jsx";
import Parents from "../modules/schooladmin/parents/Parents.jsx";
import Timetables from "../modules/schooladmin/timetable/Timetable.jsx";
import User from "../modules/schooladmin/users/User.jsx";
import Assign from "../modules/schooladmin/assignments/Assign.jsx";
import SchoolAdminLayout from "../modules/schooladmin/SchoolAdminLayout.jsx";

// Super Admin
import Schools from "../modules/superadmin/schools/Schools.jsx";
import Reference from "../modules/superadmin/reference/Reference.jsx";
import GlobalStats from "../modules/superadmin/golbalstatus/golbal.jsx";
import SuperAdminDashboard from "../modules/superadmin/dashboard/DashBoard.jsx";
import SuperAdminLayout from "../modules/superadmin/SuperAdminLayout.jsx";
import Subscriptions from "../modules/superadmin/Subscriptions/Subscriptions.jsx";

export default function AppNavigator() {
  return (
    <BrowserRouter>
      <Routes>
        {/* AUTH */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* SCHOOL ADMIN */}
        <Route path="/schooladmin" element={<SchoolAdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="classes" element={<Classes />} />
          <Route path="students" element={<Students />} />
          <Route path="sections" element={<Sections />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="reports" element={<ReportCards />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="settings" element={<Settings />} />
          <Route path="bulkupload" element={<BulkUpload />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="parents" element={<Parents />} />
          <Route path="timetable" element={<Timetables />} />
          <Route path="users" element={<User />} />
          <Route path="assignments" element={<Assign />} />
        </Route>

        {/* SUPER ADMIN */}
        <Route path="/superadmin" element={<SuperAdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="schools" element={<Schools />} />
          <Route path="reference" element={<Reference />} />
          <Route path="global-stats" element={<GlobalStats />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="schools/:id/classes" element={<Classes />} />
          <Route path="settings" element={<div>Settings</div>} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
