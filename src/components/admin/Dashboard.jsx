import React, { useEffect, useState } from "react";
import { apiCall } from "../../services/api";

function Dashboard() {
  // =========================================================
  // STATE
  // =========================================================

  const [stats, setStats] = useState({
    totalStudents: 0,
    maleStudents: 0,
    femaleStudents: 0,

    totalStaff: 0,

    totalClasses: 0,
    totalSubjects: 0,

    presentToday: 0,
    absentToday: 0,

    totalCollected: 0,
    pendingFee: 0,

    income: 0,
    expense: 0,
    balance: 0,
  });

  const [recentStudents, setRecentStudents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [errorMsg, setErrorMsg] = useState("");

  // =========================================================
  // STYLING
  // =========================================================

  const neumorphicCard =
    "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-2xl p-6 border border-white/50";

  // =========================================================
  // NUMBER FORMAT
  // =========================================================

  const formatNumber = (value) => {
    const number = Number(value);

    if (Number.isNaN(number)) {
      return "0";
    }

    return number.toLocaleString();
  };

  // =========================================================
  // FETCH DASHBOARD
  // GET /api/dashboard
  // =========================================================

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const adminToken = localStorage.getItem("adminToken");

      // -------------------------------------------------------
      // CHECK LOGIN
      // -------------------------------------------------------

      if (!adminToken) {
        setErrorMsg("Admin login required. Please login first.");

        setLoading(false);

        return;
      }

      console.log("=================================");

      console.log(
        "GET https://apinstitute.localpro1.net/api/dashboard"
      );

      console.log("Dashboard request started...");

      console.log("=================================");

      // -------------------------------------------------------
      // API CALL
      // -------------------------------------------------------

      const result = await apiCall("/dashboard", "GET");

      console.log("DASHBOARD API RESULT:", result);

      // -------------------------------------------------------
      // API ERROR
      // -------------------------------------------------------

      if (!result.success) {
        setErrorMsg(
          result.message || "Failed to load dashboard data."
        );

        return;
      }

      // -------------------------------------------------------
      // API RESPONSE STRUCTURE
      //
      // apiCall returns:
      //
      // {
      //   success: true,
      //   data: {
      //     success: true,
      //     message: "...",
      //     data: {...}
      //   }
      // }
      // -------------------------------------------------------

      const dashboardData = result.data?.data || {};

      console.log("DASHBOARD DATA:", dashboardData);

      // -------------------------------------------------------
      // SET STATS
      // -------------------------------------------------------

      setStats({
        totalStudents:
          Number(dashboardData.totalStudents) || 0,

        maleStudents:
          Number(dashboardData.maleStudents) || 0,

        femaleStudents:
          Number(dashboardData.femaleStudents) || 0,

        totalStaff:
          Number(dashboardData.totalStaff) || 0,

        totalClasses:
          Number(dashboardData.totalClasses) || 0,

        totalSubjects:
          Number(dashboardData.totalSubjects) || 0,

        presentToday:
          Number(dashboardData.presentToday) || 0,

        absentToday:
          Number(dashboardData.absentToday) || 0,

        totalCollected:
          Number(dashboardData.totalCollected) || 0,

        pendingFee:
          Number(dashboardData.pendingFees) || 0,

        income:
          Number(dashboardData.totalIncome) || 0,

        expense:
          Number(dashboardData.totalExpense) || 0,

        balance:
          Number(dashboardData.balance) || 0,
      });

      // -------------------------------------------------------
      // RECENT STUDENTS
      // -------------------------------------------------------

      if (Array.isArray(dashboardData.recentStudents)) {
        setRecentStudents(dashboardData.recentStudents);
      } else {
        setRecentStudents([]);
      }

      console.log("Dashboard data loaded successfully.");
    } catch (error) {
      console.error("Dashboard connection error:", error);

      setErrorMsg(
        error.message ||
          "Unable to connect to backend. Please check the live backend server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-[#e0e5ec]">
        <p className="text-slate-500 font-semibold animate-pulse">
          Loading Dashboard from Backend...
        </p>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="p-6 bg-[#e0e5ec] min-h-screen font-sans text-slate-700 space-y-6">

      {/* HEADER */}

      <div className="bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center border border-white/50 gap-4">

        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-wide">
            LocalPro1 Management System
          </h1>

          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Welcome back, Administrator.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="px-5 py-2.5 bg-[#e0e5ec] text-blue-600 rounded-xl text-xs font-bold shadow-[4px_4px_8px_rgb(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.5)] hover:text-blue-800 active:scale-95 transition"
        >
          ↻ Refresh
        </button>
      </div>

      {/* ERROR MESSAGE */}

      {errorMsg && (
        <div className="p-4 bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold text-center">
          ❌ {errorMsg}
        </div>
      )}

      {/* TOP STAT CARDS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* STUDENTS */}

        <div className={neumorphicCard}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">
                Total Students
              </p>

              <h3 className="text-2xl font-black text-slate-800 mt-1">
                {formatNumber(stats.totalStudents)}
              </h3>

              <p className="text-[11px] text-slate-500 mt-1">
                Male: {formatNumber(stats.maleStudents)} | Female:{" "}
                {formatNumber(stats.femaleStudents)}
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
              👨‍🎓
            </div>
          </div>
        </div>

        {/* STAFF */}

        <div className={neumorphicCard}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">
                Total Staff
              </p>

              <h3 className="text-2xl font-black text-slate-800 mt-1">
                {formatNumber(stats.totalStaff)}
              </h3>

              <p className="text-[11px] text-slate-500 mt-1">
                Active staff members
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
              👥
            </div>
          </div>
        </div>

        {/* CLASSES */}

        <div className={neumorphicCard}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">
                Total Classes
              </p>

              <h3 className="text-2xl font-black text-purple-600 mt-1">
                {formatNumber(stats.totalClasses)}
              </h3>

              <p className="text-[11px] text-slate-500 mt-1">
                Active classes
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
              🏫
            </div>
          </div>
        </div>

        {/* SUBJECTS */}

        <div className={neumorphicCard}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">
                Total Subjects
              </p>

              <h3 className="text-2xl font-black text-amber-600 mt-1">
                {formatNumber(stats.totalSubjects)}
              </h3>

              <p className="text-[11px] text-slate-500 mt-1">
                Subjects in results
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
              📚
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ATTENDANCE */}

        <div className={neumorphicCard}>
          <h3 className="text-sm font-bold text-slate-800 mb-4">
            Attendance Today
          </h3>

          <div className="flex justify-around items-center my-6">
            <div className="text-center">
              <h4 className="text-2xl font-black text-emerald-600">
                {formatNumber(stats.presentToday)}
              </h4>

              <p className="text-xs font-semibold text-slate-500 uppercase mt-1">
                Present
              </p>
            </div>

            <div className="h-10 w-[1px] bg-slate-300"></div>

            <div className="text-center">
              <h4 className="text-2xl font-black text-rose-600">
                {formatNumber(stats.absentToday)}
              </h4>

              <p className="text-xs font-semibold text-slate-500 uppercase mt-1">
                Absent
              </p>
            </div>
          </div>
        </div>

        {/* FEES */}

        <div className={neumorphicCard}>
          <h3 className="text-sm font-bold text-slate-800 mb-4">
            Fee Collection
          </h3>

          <div className="flex justify-around items-center my-6">
            <div className="text-center">
              <h4 className="text-xl font-black text-emerald-600">
                Rs {formatNumber(stats.totalCollected)}
              </h4>

              <p className="text-xs font-semibold text-slate-500 uppercase mt-1">
                Total Collected
              </p>
            </div>

            <div className="h-10 w-[1px] bg-slate-300"></div>

            <div className="text-center">
              <h4 className="text-xl font-black text-rose-600">
                Rs {formatNumber(stats.pendingFee)}
              </h4>

              <p className="text-xs font-semibold text-slate-500 uppercase mt-1">
                Pending
              </p>
            </div>
          </div>
        </div>

        {/* FINANCIAL */}

        <div className={neumorphicCard}>
          <h3 className="text-sm font-bold text-slate-800 mb-4">
            Financial Overview
          </h3>

          <div className="space-y-3 text-xs font-medium">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Income</span>

              <span className="font-bold text-emerald-600">
                Rs {formatNumber(stats.income)}
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Expense</span>

              <span className="font-bold text-rose-600">
                Rs {formatNumber(stats.expense)}
              </span>
            </div>

            <div className="flex justify-between pt-1">
              <span className="text-slate-700 font-bold">
                Balance
              </span>

              <span className="font-black text-blue-600">
                Rs {formatNumber(stats.balance)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT STUDENTS */}

      <div className={neumorphicCard}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Recent Students
            </h3>

            <p className="text-xs text-slate-400 mt-1">
              Latest students added to database
            </p>
          </div>

          <span className="text-xs font-bold text-slate-500">
            {recentStudents.length} record(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-xs text-slate-500 uppercase">
                <th className="pb-3 font-bold">#</th>
                <th className="pb-3 font-bold">Name</th>
                <th className="pb-3 font-bold">Adm#</th>
                <th className="pb-3 font-bold">Class</th>
                <th className="pb-3 font-bold">Section</th>
                <th className="pb-3 font-bold">Status</th>
              </tr>
            </thead>

            <tbody className="text-xs divide-y divide-slate-200">
              {recentStudents.length > 0 ? (
                recentStudents.map((student, index) => {
                  const status = student.status || "ACTIVE";

                  return (
                    <tr
                      key={student.id || index}
                      className="hover:bg-white/40 transition-colors"
                    >
                      <td className="py-3 text-slate-500 font-bold">
                        {index + 1}
                      </td>

                      <td className="py-3 font-black text-slate-800">
                        {student.name || "N/A"}
                      </td>

                      <td className="py-3 text-slate-600 font-mono">
                        {student.admissionNo || "N/A"}
                      </td>

                      <td className="py-3 text-slate-600">
                        {student.className || "N/A"}
                      </td>

                      <td className="py-3 text-slate-600">
                        {student.section || "N/A"}
                      </td>

                      <td className="py-3">
                        <span
                          className={`px-3 py-1 rounded-xl font-bold text-[10px] ${
                            status === "INACTIVE"
                              ? "text-rose-600"
                              : "text-emerald-600"
                          } bg-[#e0e5ec] shadow-[inset_2px_2px_4px_rgb(163,177,198,0.6),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-8 text-slate-400 font-medium"
                  >
                    No recent students found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
