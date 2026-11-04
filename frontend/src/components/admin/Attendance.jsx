import React, { useEffect, useMemo, useState } from "react";
import { apiCall, API_BASE_URL } from "../../services/api";

function Attendance() {
  const today = new Date().toISOString().split("T")[0];

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);

  const [summary, setSummary] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
  });

  const [monthlyClass, setMonthlyClass] = useState("");
  const [monthlyYear, setMonthlyYear] = useState(
    String(new Date().getFullYear()),
  );
  const [monthlyMonth, setMonthlyMonth] = useState(
    String(new Date().getMonth()),
  );

  const [monthlyStats, setMonthlyStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
  });

  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const neumorphicCard =
    "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-2xl p-6 border border-white/50";

  const neumorphicInset =
    "bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] rounded-xl px-4 py-2.5 border border-white/20 outline-none text-slate-700 font-medium text-xs w-full";

  const statusOptions = [
    { value: "PRESENT", label: "Present" },
    { value: "ABSENT", label: "Absent" },
    { value: "LATE", label: "Late" },
    { value: "LEAVE", label: "Leave" },
  ];

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // =========================================================
  // Student photo URL
  // =========================================================

  const getPhotoUrl = (photo) => {
    if (!photo) return "";

    if (
      photo.startsWith("http://") ||
      photo.startsWith("https://") ||
      photo.startsWith("data:")
    ) {
      return photo;
    }

    return `${API_BASE_URL.replace("/api", "")}${photo}`;
  };

  // =========================================================
  // Load all students
  //
  // GET /api/students
  // =========================================================

  const loadStudents = async () => {
    setLoadingStudents(true);
    setErrorMsg("");

    try {
      const result = await apiCall("/students?page=1&limit=100", "GET");

      if (!result.success) {
        setErrorMsg(result.message || "Failed to load students.");
        return;
      }

      const list = result.data?.data?.students || [];

      const activeStudents = list.filter(
        (student) =>
          String(student.status || "ACTIVE").toUpperCase() === "ACTIVE",
      );

      setStudents(activeStudents);

      // Select first available class automatically.
      if (activeStudents.length > 0) {
        const uniqueClasses = [
          ...new Set(
            activeStudents.map((student) => student.className).filter(Boolean),
          ),
        ];

        if (!selectedClass && uniqueClasses.length > 0) {
          setSelectedClass(uniqueClasses[0]);
          setMonthlyClass(uniqueClasses[0]);
        }
      }
    } catch (error) {
      console.error("Load students error:", error);

      setErrorMsg(error.message || "Unable to load students from backend.");
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // =========================================================
  // Classes from actual Student records
  //
  // ZIP backend has /students but no frontend hard-coded
  // class API is required here.
  // =========================================================

  const classOptions = useMemo(() => {
    return [
      ...new Set(students.map((student) => student.className).filter(Boolean)),
    ].sort();
  }, [students]);

  // =========================================================
  // Sections for selected class
  // =========================================================

  const sectionOptions = useMemo(() => {
    if (!selectedClass) return [];

    return [
      ...new Set(
        students
          .filter(
            (student) =>
              String(student.className).toLowerCase() ===
              String(selectedClass).toLowerCase(),
          )
          .map((student) => student.section)
          .filter(Boolean),
      ),
    ].sort();
  }, [students, selectedClass]);

  // =========================================================
  // Monthly sections are not needed for API request.
  // =========================================================

  const monthlyClassOptions = classOptions;

  // =========================================================
  // Students shown in attendance sheet
  // =========================================================

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const sameClass =
        !selectedClass ||
        String(student.className).toLowerCase() ===
          String(selectedClass).toLowerCase();

      const sameSection =
        !selectedSection ||
        String(student.section).toLowerCase() ===
          String(selectedSection).toLowerCase();

      return sameClass && sameSection;
    });
  }, [students, selectedClass, selectedSection]);

  // =========================================================
  // Load attendance for selected date/class/section
  //
  // GET /api/attendance/date/:date
  // =========================================================

  const loadAttendance = async () => {
    if (!selectedDate) return;

    setLoadingAttendance(true);
    setErrorMsg("");

    try {
      let endpoint = `/attendance/date/${selectedDate}?page=1&limit=100`;

      if (selectedClass) {
        endpoint += `&className=${encodeURIComponent(selectedClass)}`;
      }

      if (selectedSection) {
        endpoint += `&section=${encodeURIComponent(selectedSection)}`;
      }

      const result = await apiCall(endpoint, "GET");

      if (!result.success) {
        setErrorMsg(result.message || "Failed to load attendance.");
        return;
      }

      const data = result.data?.data || {};

      const records = data.attendance || [];

      const backendSummary = data.summary || {};

      const nextMap = {};

      records.forEach((record) => {
        const studentId = record.student?._id || record.student;

        if (!studentId) return;

        nextMap[String(studentId)] = {
          status: record.status || "PRESENT",
          remarks: record.remarks || "",
          attendanceId: record._id || "",
        };
      });

      // Default students without a record to PRESENT.
      filteredStudents.forEach((student) => {
        if (!nextMap[student._id]) {
          nextMap[student._id] = {
            status: "PRESENT",
            remarks: "",
            attendanceId: "",
          };
        }
      });

      setAttendanceMap(nextMap);

      setSummary({
        total: Number(backendSummary.total) || 0,
        present: Number(backendSummary.present) || 0,
        absent: Number(backendSummary.absent) || 0,
        late: Number(backendSummary.late) || 0,
        leave: Number(backendSummary.leave) || 0,
      });
    } catch (error) {
      console.error("Load attendance error:", error);

      setErrorMsg(error.message || "Unable to load attendance.");
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    if (!loadingStudents && selectedDate) {
      loadAttendance();
    }
  }, [selectedDate, selectedClass, selectedSection, loadingStudents]);

  // =========================================================
  // If class changes, reset section.
  // =========================================================

  useEffect(() => {
    if (selectedSection && !sectionOptions.includes(selectedSection)) {
      setSelectedSection("");
    }
  }, [selectedClass, sectionOptions, selectedSection]);

  // =========================================================
  // Attendance status change
  // =========================================================

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        status,
      },
    }));
  };

  // =========================================================
  // Remarks change
  // =========================================================

  const handleRemarksChange = (studentId, remarks) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        remarks,
      },
    }));
  };

  // =========================================================
  // Mark all students with one status
  // =========================================================

  const markAll = (status) => {
    const next = {};

    filteredStudents.forEach((student) => {
      next[student._id] = {
        ...(attendanceMap[student._id] || {}),
        status,
      };
    });

    setAttendanceMap((prev) => ({
      ...prev,
      ...next,
    }));
  };

  // =========================================================
  // Frontend calculated summary for current sheet
  // =========================================================

  const currentSummary = useMemo(() => {
    const values = filteredStudents.map(
      (student) => attendanceMap[student._id]?.status || "PRESENT",
    );

    return {
      total: values.length,
      present: values.filter((status) => status === "PRESENT").length,
      absent: values.filter((status) => status === "ABSENT").length,
      late: values.filter((status) => status === "LATE").length,
      leave: values.filter((status) => status === "LEAVE").length,
    };
  }, [filteredStudents, attendanceMap]);

  // =========================================================
  // SAVE BULK ATTENDANCE
  //
  // POST /api/attendance/bulk
  //
  // IMPORTANT:
  // Backend automatically triggers WhatsApp for every
  // ABSENT student using parentWhatsApp.
  // Frontend does NOT call Meta directly.
  // =========================================================

  const handleSaveAttendance = async () => {
    if (!selectedDate) {
      setErrorMsg("Please select an attendance date.");
      return;
    }

    if (filteredStudents.length === 0) {
      setErrorMsg("No students found for the selected class/section.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const attendanceList = filteredStudents.map((student) => ({
        studentId: student._id,

        status: attendanceMap[student._id]?.status || "PRESENT",

        remarks: attendanceMap[student._id]?.remarks || "",
      }));

      console.log("Saving bulk attendance:", {
        date: selectedDate,
        attendanceList,
      });

      const result = await apiCall("/attendance/bulk", "POST", {
        date: selectedDate,
        attendanceList,
      });

      console.log("Bulk attendance response:", result);

      if (!result.success) {
        setErrorMsg(result.message || "Failed to save attendance.");
        return;
      }

      const responseData = result.data?.data || {};

      const absentCount =
        Number(responseData.absentCount) || currentSummary.absent;

      setSuccessMsg(
        `Attendance saved successfully.`,
      );

      // Reload exact backend records.
      await loadAttendance();

      setTimeout(() => {
        setSuccessMsg("");
      }, 6000);
    } catch (error) {
      console.error("Save attendance error:", error);

      setErrorMsg(error.message || "Unable to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // Monthly date range
  // =========================================================

  const getMonthDateRange = () => {
    const year = Number(monthlyYear);

    const month = Number(monthlyMonth);

    const start = new Date(year, month, 1);

    const end = new Date(year, month + 1, 0);

    const format = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");

      return `${y}-${m}-${d}`;
    };

    return {
      startDate: format(start),
      endDate: format(end),
    };
  };

  // =========================================================
  // Load monthly attendance
  //
  // GET /api/attendance?startDate=&endDate=&className=
  //
  // Backend max limit is 100, so request 100 records.
  // =========================================================

  const loadMonthlyAttendance = async () => {
    if (!monthlyClass) {
      setMonthlyStats({
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
      });
      return;
    }

    setLoadingMonthly(true);
    setErrorMsg("");

    try {
      const { startDate, endDate } = getMonthDateRange();

      const endpoint =
        `/attendance?startDate=${startDate}` +
        `&endDate=${endDate}` +
        `&className=${encodeURIComponent(monthlyClass)}` +
        `&page=1&limit=100`;

      const result = await apiCall(endpoint, "GET");

      if (!result.success) {
        setErrorMsg(result.message || "Failed to load monthly attendance.");
        return;
      }

      const records = result.data?.data?.attendance || [];

      setMonthlyStats({
        total: records.length,

        present: records.filter((record) => record.status === "PRESENT").length,

        absent: records.filter((record) => record.status === "ABSENT").length,

        late: records.filter((record) => record.status === "LATE").length,

        leave: records.filter((record) => record.status === "LEAVE").length,
      });
    } catch (error) {
      console.error("Monthly attendance error:", error);

      setErrorMsg(error.message || "Unable to load monthly attendance.");
    } finally {
      setLoadingMonthly(false);
    }
  };

  useEffect(() => {
    if (!loadingStudents && monthlyClass) {
      loadMonthlyAttendance();
    }
  }, [monthlyClass, monthlyYear, monthlyMonth, loadingStudents]);

  // =========================================================
  // Render
  // =========================================================

  return (
    <div className="p-6 bg-[#e0e5ec] min-h-screen font-sans text-slate-700">
      {/* =====================================================
          Header
      ====================================================== */}

      <div
        className={`${neumorphicCard} mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4`}
      >
        <div>
          <h1 className="text-sm font-black text-slate-800">
            Student Attendance
          </h1>

          <p className="text-xs text-slate-400 mt-1">
            Mark daily student attendance. Absent students automatically trigger
            the backend WhatsApp notification.
          </p>
        </div>

        <button
          onClick={loadStudents}
          disabled={loadingStudents}
          className="bg-[#e0e5ec] text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs shadow-[4px_4px_8px_rgb(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.6)] active:scale-95 transition disabled:opacity-50"
        >
          ↻ Refresh Students
        </button>
      </div>

      {/* =====================================================
          Notifications
      ====================================================== */}

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold">
          ✅ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* =====================================================
          Daily Attendance Controls
      ====================================================== */}

      <div className={`${neumorphicCard} mb-6`}>
        <div className="mb-5">
          <h2 className="text-sm font-black text-slate-800">Mark Attendance</h2>

          <p className="text-xs text-slate-400 mt-1">
            Select class, section and date.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Class */}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Class
            </label>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className={neumorphicInset}
            >
              <option value="">Select Class</option>

              {classOptions.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>

          {/* Section */}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Section
            </label>

            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className={neumorphicInset}
              disabled={!selectedClass}
            >
              <option value="">All Sections</option>

              {sectionOptions.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Date
            </label>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={neumorphicInset}
            />
          </div>
        </div>

        {/* Quick buttons */}

        <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t border-slate-300">
          <button
            type="button"
            onClick={() => markAll("PRESENT")}
            disabled={filteredStudents.length === 0}
            className="px-4 py-2 rounded-xl bg-[#e0e5ec] shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.8)] text-emerald-600 font-bold text-xs active:scale-95 transition disabled:opacity-50"
          >
            ✓ Mark All Present
          </button>

          <button
            type="button"
            onClick={() => markAll("ABSENT")}
            disabled={filteredStudents.length === 0}
            className="px-4 py-2 rounded-xl bg-[#e0e5ec] shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.8)] text-rose-600 font-bold text-xs active:scale-95 transition disabled:opacity-50"
          >
            ✕ Mark All Absent
          </button>

          <button
            type="button"
            onClick={() => markAll("LATE")}
            disabled={filteredStudents.length === 0}
            className="px-4 py-2 rounded-xl bg-[#e0e5ec] shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.8)] text-amber-600 font-bold text-xs active:scale-95 transition disabled:opacity-50"
          >
            ⏱ Mark All Late
          </button>

          <button
            type="button"
            onClick={() => markAll("LEAVE")}
            disabled={filteredStudents.length === 0}
            className="px-4 py-2 rounded-xl bg-[#e0e5ec] shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.8)] text-blue-600 font-bold text-xs active:scale-95 transition disabled:opacity-50"
          >
            📝 Mark All Leave
          </button>
        </div>
      </div>

      {/* =====================================================
          Daily Summary Cards
      ====================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className={neumorphicCard}>
          <p className="text-[10px] font-bold text-slate-400 uppercase">
            Total
          </p>
          <h3 className="text-xl font-black text-slate-800 mt-1">
            {currentSummary.total}
          </h3>
        </div>

        <div className={neumorphicCard}>
          <p className="text-[10px] font-bold text-slate-400 uppercase">
            Present
          </p>
          <h3 className="text-xl font-black text-emerald-600 mt-1">
            {currentSummary.present}
          </h3>
        </div>

        <div className={neumorphicCard}>
          <p className="text-[10px] font-bold text-slate-400 uppercase">
            Absent
          </p>
          <h3 className="text-xl font-black text-rose-600 mt-1">
            {currentSummary.absent}
          </h3>
        </div>

        <div className={neumorphicCard}>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Late</p>
          <h3 className="text-xl font-black text-amber-600 mt-1">
            {currentSummary.late}
          </h3>
        </div>

        <div className={neumorphicCard}>
          <p className="text-[10px] font-bold text-slate-400 uppercase">
            Leave
          </p>
          <h3 className="text-xl font-black text-blue-600 mt-1">
            {currentSummary.leave}
          </h3>
        </div>
      </div>

      {/* =====================================================
          Student Attendance Table
      ====================================================== */}

      <div className={`${neumorphicCard} mb-6`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
          <div>
            <h3 className="text-sm font-black text-slate-800">
              Attendance Sheet
            </h3>

            <p className="text-[10px] text-slate-400 mt-1">
              {selectedClass || "No class selected"}
              {selectedSection ? ` • Section ${selectedSection}` : ""}
              {selectedDate ? ` • ${selectedDate}` : ""}
            </p>
          </div>

          <button
            onClick={handleSaveAttendance}
            disabled={
              saving || loadingAttendance || filteredStudents.length === 0
            }
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md active:scale-95 transition disabled:opacity-50"
          >
            {saving ? "Saving Attendance..." : "💾 Save Attendance"}
          </button>
        </div>

        {loadingStudents || loadingAttendance ? (
          <div className="py-12 text-center">
            <p className="text-xs font-bold text-slate-500 animate-pulse">
              Loading attendance from database...
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-12 text-center bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] rounded-xl">
            <p className="text-xs text-slate-500 font-bold">
              {students.length === 0
                ? "No students found in database."
                : "No students found for this class/section."}
            </p>

            <p className="text-[10px] text-slate-400 mt-2">
              Add students first from Students Management.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-500 uppercase">
                    <th className="pb-3 pr-4">#</th>

                    <th className="pb-3 pr-4">Photo</th>

                    <th className="pb-3 pr-4">Student</th>

                    <th className="pb-3 pr-4">Admission No</th>

                    <th className="pb-3 pr-4">Roll No</th>

                    <th className="pb-3 pr-4">Parent WhatsApp</th>

                    <th className="pb-3 pr-4">Status</th>

                    <th className="pb-3">Remarks</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {filteredStudents.map((student, index) => {
                    const record = attendanceMap[student._id] || {
                      status: "PRESENT",
                      remarks: "",
                    };

                    const photoUrl = getPhotoUrl(student.photo);

                    return (
                      <tr key={student._id} className="hover:bg-white/40">
                        {/* Number */}

                        <td className="py-3 pr-4 text-slate-400 font-bold">
                          {index + 1}
                        </td>

                        {/* Photo */}

                        <td className="py-3 pr-4">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-300 shadow-inner">
                            {photoUrl ? (
                              <img
                                src={photoUrl}
                                alt={student.name || "Student"}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-600">
                                👤
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Student */}

                        <td className="py-3 pr-4">
                          <div className="font-bold text-slate-800">
                            {student.name || "-"}
                          </div>

                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {student.className || "-"}
                            {" • "}
                            {student.section || "-"}
                          </div>
                        </td>

                        {/* Admission */}

                        <td className="py-3 pr-4 text-slate-600 font-mono">
                          {student.admissionNo || "-"}
                        </td>

                        {/* Roll */}

                        <td className="py-3 pr-4 text-slate-600">
                          {student.rollNo || "-"}
                        </td>

                        {/* WhatsApp */}

                        <td className="py-3 pr-4 text-slate-600 font-mono whitespace-nowrap">
                          {student.parentWhatsApp ? (
                            <span className="text-emerald-700 font-bold">
                              {student.parentWhatsApp}
                            </span>
                          ) : (
                            <span className="text-rose-600 font-bold">
                              Missing
                            </span>
                          )}
                        </td>

                        {/* Status */}

                        <td className="py-3 pr-4">
                          <select
                            value={record.status || "PRESENT"}
                            onChange={(e) =>
                              handleStatusChange(student._id, e.target.value)
                            }
                            className={`rounded-xl px-3 py-2 text-[10px] font-black outline-none border ${
                              record.status === "PRESENT"
                                ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                                : record.status === "ABSENT"
                                  ? "text-rose-700 border-rose-200 bg-rose-50"
                                  : record.status === "LATE"
                                    ? "text-amber-700 border-amber-200 bg-amber-50"
                                    : "text-blue-700 border-blue-200 bg-blue-50"
                            }`}
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Remarks */}

                        <td className="py-3 min-w-[180px]">
                          <input
                            type="text"
                            value={record.remarks || ""}
                            onChange={(e) =>
                              handleRemarksChange(student._id, e.target.value)
                            }
                            className={neumorphicInset}
                            placeholder="Optional remarks"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* =====================================================
          Monthly Attendance Summary
      ====================================================== */}

      <div className={neumorphicCard}>
        <div className="mb-5">
          <h3 className="text-sm font-black text-slate-800">
            Monthly Attendance Summary
          </h3>

          <p className="text-xs text-slate-400 mt-1">
            Attendance records from the backend for the selected month and
            class.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Class */}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Class
            </label>

            <select
              value={monthlyClass}
              onChange={(e) => setMonthlyClass(e.target.value)}
              className={neumorphicInset}
            >
              <option value="">Select Class</option>

              {monthlyClassOptions.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Year
            </label>

            <select
              value={monthlyYear}
              onChange={(e) => setMonthlyYear(e.target.value)}
              className={neumorphicInset}
            >
              {[
                new Date().getFullYear() - 1,
                new Date().getFullYear(),
                new Date().getFullYear() + 1,
              ].map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Month */}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Month
            </label>

            <select
              value={monthlyMonth}
              onChange={(e) => setMonthlyMonth(e.target.value)}
              className={neumorphicInset}
            >
              {months.map((month, index) => (
                <option key={month} value={String(index)}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Monthly cards */}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-5">
          <div className="p-4 rounded-xl bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]">
            <p className="text-[9px] font-bold text-slate-400 uppercase">
              Records
            </p>

            <p className="text-lg font-black text-slate-800 mt-1">
              {loadingMonthly ? "..." : monthlyStats.total}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]">
            <p className="text-[9px] font-bold text-slate-400 uppercase">
              Present
            </p>

            <p className="text-lg font-black text-emerald-600 mt-1">
              {loadingMonthly ? "..." : monthlyStats.present}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]">
            <p className="text-[9px] font-bold text-slate-400 uppercase">
              Absent
            </p>

            <p className="text-lg font-black text-rose-600 mt-1">
              {loadingMonthly ? "..." : monthlyStats.absent}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]">
            <p className="text-[9px] font-bold text-slate-400 uppercase">
              Late
            </p>

            <p className="text-lg font-black text-amber-600 mt-1">
              {loadingMonthly ? "..." : monthlyStats.late}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]">
            <p className="text-[9px] font-bold text-slate-400 uppercase">
              Leave
            </p>

            <p className="text-lg font-black text-blue-600 mt-1">
              {loadingMonthly ? "..." : monthlyStats.leave}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Attendance;
