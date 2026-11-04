import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiCall } from "../../services/api";

function TeacherDashboard() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const neumorphicCard =
    "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-2xl p-6 border border-white/50";

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      // ==============================
      // LOAD STUDENTS
      // ==============================
      const studentResponse = await apiCall(
        "/students?limit=100",
        "GET"
      );

      if (!studentResponse.success) {
        throw new Error(
          studentResponse.message ||
            "Unable to load students."
        );
      }

      const studentList =
        studentResponse.data?.data?.students ||
        [];

      setStudents(studentList);

      // ==============================
      // LOAD TODAY ATTENDANCE
      // ==============================
      const today =
        new Date()
          .toISOString()
          .split("T")[0];

      const attendanceResponse =
        await apiCall(
          `/attendance/date/${today}`,
          "GET"
        );

      if (
        attendanceResponse.success
      ) {
        const list =
          attendanceResponse.data?.data
            ?.attendance || [];

        setAttendance(list);
      } else {
        setAttendance([]);
      }
    } catch (err) {
      console.error(
        "Teacher dashboard error:",
        err
      );

      setError(
        err.message ||
          "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // ==============================
  // ATTENDANCE SUMMARY
  // ==============================
  const presentCount =
    attendance.filter(
      (item) =>
        String(item.status).toUpperCase() ===
        "PRESENT"
    ).length;

  const absentCount =
    attendance.filter(
      (item) =>
        String(item.status).toUpperCase() ===
        "ABSENT"
    ).length;

  const lateCount =
    attendance.filter(
      (item) =>
        String(item.status).toUpperCase() ===
        "LATE"
    ).length;

  return (
    <div className="p-6 bg-[#e0e5ec] min-h-screen">

      {/* ==========================================
          HEADER
      ========================================== */}
      <div
        className={`${neumorphicCard} mb-6 flex justify-between items-center`}
      >
        <div>
          <h1 className="text-sm font-black text-slate-800">
            Teacher Dashboard
          </h1>

          <p className="text-[11px] text-slate-500 mt-1">
            Manage students, attendance and exams.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          disabled={loading}
          className="
            bg-[#e0e5ec]
            text-slate-700
            font-bold
            px-4 py-2.5
            rounded-xl
            text-xs
            shadow-md
            hover:text-blue-600
            active:scale-95
            transition
            disabled:opacity-50
          "
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      {/* ==========================================
          ERROR
      ========================================== */}
      {error && (
        <div className="mb-6 p-4 bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
          ⚠️ {error}
        </div>
      )}

      {/* ==========================================
          STAT CARDS
      ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">

        {/* Students */}
        <div className={neumorphicCard}>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            Total Students
          </p>

          <h2 className="text-3xl font-black text-slate-800 mt-3">
            {students.length}
          </h2>

          <p className="text-[10px] text-blue-600 font-bold mt-2">
            Database students
          </p>
        </div>

        {/* Present */}
        <div className={neumorphicCard}>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            Present Today
          </p>

          <h2 className="text-3xl font-black text-emerald-600 mt-3">
            {presentCount}
          </h2>

          <p className="text-[10px] text-slate-500 font-bold mt-2">
            Today's attendance
          </p>
        </div>

        {/* Absent */}
        <div className={neumorphicCard}>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            Absent Today
          </p>

          <h2 className="text-3xl font-black text-rose-600 mt-3">
            {absentCount}
          </h2>

          <p className="text-[10px] text-slate-500 font-bold mt-2">
            WhatsApp notification handled by backend
          </p>
        </div>

        {/* Late */}
        <div className={neumorphicCard}>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            Late Today
          </p>

          <h2 className="text-3xl font-black text-orange-600 mt-3">
            {lateCount}
          </h2>

          <p className="text-[10px] text-slate-500 font-bold mt-2">
            Today's late students
          </p>
        </div>

      </div>

      {/* ==========================================
          QUICK ACTIONS
      ========================================== */}
      <div className={`${neumorphicCard} mb-6`}>

        <h3 className="text-sm font-black text-slate-800 mb-4">
          Quick Actions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <button
            onClick={() =>
              navigate("/teacher/students")
            }
            className="
              bg-[#e0e5ec]
              p-5
              rounded-2xl
              text-left
              shadow-[5px_5px_10px_rgb(163,177,198,0.55),-5px_-5px_10px_rgba(255,255,255,0.6)]
              hover:text-blue-600
              active:scale-95
              transition
            "
          >
            <div className="text-2xl mb-2">
              ♟
            </div>

            <h4 className="text-xs font-black text-slate-800">
              View Students
            </h4>

            <p className="text-[10px] text-slate-500 mt-1">
              View students from database
            </p>
          </button>

          <button
            onClick={() =>
              navigate("/teacher/exams")
            }
            className="
              bg-[#e0e5ec]
              p-5
              rounded-2xl
              text-left
              shadow-[5px_5px_10px_rgb(163,177,198,0.55),-5px_-5px_10px_rgba(255,255,255,0.6)]
              hover:text-blue-600
              active:scale-95
              transition
            "
          >
            <div className="text-2xl mb-2">
              ✎
            </div>

            <h4 className="text-xs font-black text-slate-800">
              Create Exam
            </h4>

            <p className="text-[10px] text-slate-500 mt-1">
              Create exam in backend
            </p>
          </button>

          <button
            onClick={() =>
              navigate("/teacher/attendance")
            }
            className="
              bg-[#e0e5ec]
              p-5
              rounded-2xl
              text-left
              shadow-[5px_5px_10px_rgb(163,177,198,0.55),-5px_-5px_10px_rgba(255,255,255,0.6)]
              hover:text-blue-600
              active:scale-95
              transition
            "
          >
            <div className="text-2xl mb-2">
              ✓
            </div>

            <h4 className="text-xs font-black text-slate-800">
              Attendance
            </h4>

            <p className="text-[10px] text-slate-500 mt-1">
              Mark today's attendance
            </p>
          </button>

        </div>
      </div>

      {/* ==========================================
          TODAY ATTENDANCE
      ========================================== */}
      <div className={neumorphicCard}>

        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-800">
              Today's Attendance
            </h3>

            <p className="text-[10px] text-slate-500 mt-1">
              Latest attendance records
            </p>
          </div>

          <button
            onClick={() =>
              navigate("/teacher/attendance")
            }
            className="
              px-4 py-2
              rounded-xl
              bg-blue-600
              text-white
              text-[10px]
              font-black
              shadow-md
              hover:bg-blue-700
            "
          >
            Open Attendance
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">

            <thead>
              <tr className="border-b border-slate-300 text-slate-500 uppercase">
                <th className="pb-3">
                  Student
                </th>

                <th className="pb-3">
                  Class
                </th>

                <th className="pb-3">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">

              {attendance.length === 0 && (
                <tr>
                  <td
                    colSpan="3"
                    className="py-8 text-center text-slate-500"
                  >
                    No attendance records for today.
                  </td>
                </tr>
              )}

              {attendance
                .slice(0, 10)
                .map((item) => {

                  const student =
                    item.student || {};

                  const status =
                    String(
                      item.status || ""
                    ).toUpperCase();

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-white/40"
                    >
                      <td className="py-3 font-bold text-slate-800">
                        {student.name || "N/A"}
                      </td>

                      <td className="py-3 text-slate-600">
                        {student.className || "N/A"}
                      </td>

                      <td className="py-3">
                        <span
                          className={`
                            px-2.5 py-1
                            rounded-lg
                            text-[10px]
                            font-bold
                            ${
                              status === "PRESENT"
                                ? "bg-emerald-100 text-emerald-700"
                                : status === "ABSENT"
                                ? "bg-rose-100 text-rose-700"
                                : status === "LATE"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700"
                            }
                          `}
                        >
                          {status || "N/A"}
                        </span>
                      </td>
                    </tr>
                  );
                })}

            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default TeacherDashboard;