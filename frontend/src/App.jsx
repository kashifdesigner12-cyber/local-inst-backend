import React, { useState } from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

// ================================
// AUTH
// ================================
import LoginPage from "./components/admin/LoginPage";

// ================================
// ADMIN
// ================================
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./components/admin/Dashboard";
import StaffManagement from "./components/admin/StaffManagement";
import StudentList from "./components/admin/StudentList";
import AddStudent from "./components/admin/AddStudent";
import FeeManagement from "./components/admin/FeeManagement";
import Attendance from "./components/admin/Attendance";
import ClassesList from "./components/admin/ClassesList";
import OfficeExpenses from "./components/admin/OfficeExpenses";

// ================================
// TEACHER
// ================================
import TeacherLayout from "./components/teacher/TeacherLayout";
import TeacherDashboard from "./components/teacher/TeacherDashboard";
import TeacherStudents from "./components/teacher/TeacherStudents";
import TeacherExams from "./components/teacher/TeacherExams";
import TeacherAttendance from "./components/teacher/TeacherAttendance";
import TeacherPerformance from "./components/teacher/TeacherPerformance";
import TeacherPerformanceGraph from "./components/teacher/TeacherPerformanceGraph";

// ======================================================
// ADMIN PROTECTED ROUTES
// ======================================================

function ProtectedAdminRoutes() {
  const adminToken = localStorage.getItem("adminToken");

  if (!adminToken) {
    return <Navigate to="/login" replace />;
  }

  return <AdminLayout />;
}

// ======================================================
// TEACHER PROTECTED ROUTES
// ======================================================

function ProtectedTeacherRoutes() {
  const teacherToken = localStorage.getItem("teacherToken");

  if (!teacherToken) {
    return <Navigate to="/login" replace />;
  }

  return <TeacherLayout />;
}

// ======================================================
// APP CONTENT
// ======================================================

function AppContent() {
  const navigate = useNavigate();

  const [session, setSession] = useState(() => {
    const adminToken = localStorage.getItem("adminToken");
    const teacherToken = localStorage.getItem("teacherToken");

    if (adminToken) {
      return "admin";
    }

    if (teacherToken) {
      return "teacher";
    }

    return null;
  });

  // ====================================================
  // LOGIN SUCCESS
  // ====================================================

  const handleLoginSuccess = (user) => {
    console.log("App: Login successful");
    console.log("Logged in user:", user);

    const role = String(
      user?.role ||
        user?.userRole ||
        user?.type ||
        user?.accountType ||
        ""
    )
      .trim()
      .toUpperCase();

    console.log("App detected role:", role);

    // --------------------------------
    // ADMIN
    // --------------------------------

    if (
      role === "ADMIN" ||
      role === "ADMINISTRATOR" ||
      role === "SUPER_ADMIN"
    ) {
      setSession("admin");

      navigate("/admin/dashboard", {
        replace: true,
      });

      return;
    }

    // --------------------------------
    // TEACHER
    // --------------------------------

    if (
      role === "TEACHER" ||
      role === "STAFF"
    ) {
      setSession("teacher");

      navigate("/teacher/dashboard", {
        replace: true,
      });

      return;
    }

    // --------------------------------
    // FALLBACK
    // --------------------------------

    console.warn(
      "Unknown role. Checking stored tokens..."
    );

    if (
      localStorage.getItem("adminToken")
    ) {
      setSession("admin");

      navigate("/admin/dashboard", {
        replace: true,
      });

      return;
    }

    if (
      localStorage.getItem("teacherToken")
    ) {
      setSession("teacher");

      navigate("/teacher/dashboard", {
        replace: true,
      });

      return;
    }

    navigate("/login", {
      replace: true,
    });
  };

  // ====================================================
  // LOGOUT
  // ====================================================

  const handleLogout = () => {
    console.log("Logging out...");

    // Admin
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");

    // Teacher
    localStorage.removeItem("teacherToken");
    localStorage.removeItem("teacherUser");

    setSession(null);

    navigate("/login", {
      replace: true,
    });
  };

  // ====================================================
  // ROUTES
  // ====================================================

  return (
    <Routes>

      {/* ============================================
          LOGIN
      ============================================ */}

      <Route
        path="/login"
        element={
          session === "admin" ? (
            <Navigate
              to="/admin/dashboard"
              replace
            />
          ) : session === "teacher" ? (
            <Navigate
              to="/teacher/dashboard"
              replace
            />
          ) : (
            <LoginPage
              onLoginSuccess={
                handleLoginSuccess
              }
            />
          )
        }
      />

      {/* ============================================
          ADMIN ROUTES
      ============================================ */}

      <Route
        element={
          <ProtectedAdminRoutes />
        }
      >

        {/* Admin Dashboard */}

        <Route
          path="/admin/dashboard"
          element={<Dashboard />}
        />

        {/* Students */}

        <Route
          path="/admin/students"
          element={<StudentList />}
        />

        {/* Add Student */}

        <Route
          path="/admin/add-student"
          element={<AddStudent />}
        />

        {/* Staff */}

        <Route
          path="/admin/staff"
          element={<StaffManagement />}
        />

        {/* Classes */}

        <Route
          path="/admin/classes"
          element={<ClassesList />}
        />

        {/* Attendance */}

        <Route
          path="/admin/attendance"
          element={<Attendance />}
        />

        {/* Fees */}

        <Route
          path="/admin/fees"
          element={<FeeManagement />}
        />

        {/* Office Expenses */}

        <Route
          path="/admin/expenses"
          element={<OfficeExpenses />}
        />

      </Route>

      {/* ============================================
          TEACHER ROUTES
      ============================================ */}

      <Route
        element={
          <ProtectedTeacherRoutes />
        }
      >

        {/* ------------------------------------------
            Teacher Dashboard
        ------------------------------------------ */}

        <Route
          path="/teacher/dashboard"
          element={
            <TeacherDashboard
              onLogout={handleLogout}
            />
          }
        />

        {/* ------------------------------------------
            Teacher Students
        ------------------------------------------ */}

        <Route
          path="/teacher/students"
          element={<TeacherStudents />}
        />

        {/* ------------------------------------------
            Teacher Attendance
        ------------------------------------------ */}

        <Route
          path="/teacher/attendance"
          element={<TeacherAttendance />}
        />

        {/* ------------------------------------------
            Teacher Performance Entry
        ------------------------------------------ */}

        <Route
          path="/teacher/performance"
          element={
            <TeacherPerformance />
          }
        />

        {/* ------------------------------------------
            Teacher Performance Graph
        ------------------------------------------ */}

        <Route
          path="/teacher/performance-graph"
          element={
            <TeacherPerformanceGraph />
          }
        />

        {/* ------------------------------------------
            Teacher Create Exam
        ------------------------------------------ */}

        <Route
          path="/teacher/exams"
          element={<TeacherExams />}
        />

      </Route>

      {/* ============================================
          ROOT
      ============================================ */}

      <Route
        path="/"
        element={
          session === "admin" ? (
            <Navigate
              to="/admin/dashboard"
              replace
            />
          ) : session === "teacher" ? (
            <Navigate
              to="/teacher/dashboard"
              replace
            />
          ) : (
            <Navigate
              to="/login"
              replace
            />
          )
        }
      />

      {/* ============================================
          UNKNOWN ROUTE
      ============================================ */}

      <Route
        path="*"
        element={
          session === "admin" ? (
            <Navigate
              to="/admin/dashboard"
              replace
            />
          ) : session === "teacher" ? (
            <Navigate
              to="/teacher/dashboard"
              replace
            />
          ) : (
            <Navigate
              to="/login"
              replace
            />
          )
        }
      />

    </Routes>
  );
}

// ======================================================
// APP
// ======================================================

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;