import React, { useEffect, useMemo, useState } from "react";
import { apiCall } from "../../services/api";

function TeacherAttendance() {
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ==================================================
  // TODAY'S DATE
  // ==================================================
  const today = new Date()
    .toISOString()
    .split("T")[0];

  // ==================================================
  // LOAD STUDENTS + TODAY'S ATTENDANCE
  // ==================================================
  const loadAttendance = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // ------------------------------------------------
      // 1. LOAD STUDENTS
      // ------------------------------------------------
      const studentsResult = await apiCall(
        "/students?limit=100",
        "GET"
      );

      console.log(
        "Students response:",
        studentsResult
      );

      if (!studentsResult.success) {
        setErrorMsg(
          studentsResult.message ||
            "Failed to load students."
        );

        return;
      }

      const studentList =
        studentsResult.data?.data?.students || [];

      // ------------------------------------------------
      // 2. LOAD TODAY'S ATTENDANCE
      // ------------------------------------------------
      const attendanceResult = await apiCall(
        `/attendance/date/${today}`,
        "GET"
      );

      console.log(
        "Today's attendance response:",
        attendanceResult
      );

      if (!attendanceResult.success) {
        setErrorMsg(
          attendanceResult.message ||
            "Failed to load today's attendance."
        );

        // Even if attendance doesn't exist,
        // students should still be displayed.
        setStudents(
          studentList.map((student) => ({
            ...student,
            attendanceStatus: "PRESENT",
            remarks: "",
          }))
        );

        return;
      }

      const attendanceList =
        attendanceResult.data?.data?.attendance || [];

      // ------------------------------------------------
      // 3. CREATE ATTENDANCE MAP
      // ------------------------------------------------
      const attendanceMap = {};

      attendanceList.forEach((record) => {
        const studentId =
          record.student?._id ||
          record.student?.id ||
          record.studentId?._id ||
          record.studentId ||
          record._id;

        if (studentId) {
          attendanceMap[String(studentId)] = {
            status:
              String(
                record.status || "PRESENT"
              ).toUpperCase(),

            remarks:
              record.remarks || "",
          };
        }
      });

      // ------------------------------------------------
      // 4. MERGE STUDENTS WITH SAVED ATTENDANCE
      // ------------------------------------------------
      const mergedStudents = studentList.map(
        (student) => {
          const studentId = String(
            student._id || student.id
          );

          const savedAttendance =
            attendanceMap[studentId];

          return {
            ...student,

            attendanceStatus:
              savedAttendance?.status ||
              "PRESENT",

            remarks:
              savedAttendance?.remarks ||
              "",
          };
        }
      );

      setStudents(mergedStudents);

    } catch (error) {
      console.error(
        "Load attendance error:",
        error
      );

      setErrorMsg(
        error.message ||
          "Unable to load attendance."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // LOAD WHEN PAGE OPENS
  // ==================================================
  useEffect(() => {
    loadAttendance();
  }, []);

  // ==================================================
  // GET CLASSES FROM STUDENTS
  // ==================================================
  const classes = useMemo(() => {
    const uniqueClasses = [
      ...new Set(
        students
          .map(
            (student) =>
              student.className
          )
          .filter(Boolean)
      ),
    ];

    return uniqueClasses.sort();
  }, [students]);

  // ==================================================
  // FILTER STUDENTS
  // ==================================================
  const filteredStudents = useMemo(() => {
    if (selectedClass === "ALL") {
      return students;
    }

    return students.filter(
      (student) =>
        String(student.className || "") ===
        selectedClass
    );
  }, [students, selectedClass]);

  // ==================================================
  // CHANGE STATUS
  // ==================================================
  const handleStatusChange = (
    studentId,
    newStatus
  ) => {
    setStudents((prev) =>
      prev.map((student) => {
        const id = String(
          student._id || student.id
        );

        if (id !== String(studentId)) {
          return student;
        }

        return {
          ...student,
          attendanceStatus:
            newStatus.toUpperCase(),
        };
      })
    );

    setSuccessMsg("");
    setErrorMsg("");
  };

  // ==================================================
  // SAVE ATTENDANCE TO BACKEND
  // ==================================================
  const handleSaveAttendance = async () => {
    if (students.length === 0) {
      setErrorMsg(
        "No students available to save attendance."
      );

      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Backend expects:
      //
      // {
      //   date: "2026-09-09",
      //   attendanceList: [
      //     {
      //       studentId: "...",
      //       status: "PRESENT",
      //       remarks: ""
      //     }
      //   ]
      // }

      const attendanceList =
        students.map((student) => ({
          studentId:
            student._id || student.id,

          status:
            String(
              student.attendanceStatus ||
                "PRESENT"
            ).toUpperCase(),

          remarks:
            student.remarks || "",
        }));

      const payload = {
        date: today,
        attendanceList,
      };

      console.log(
        "Saving attendance payload:",
        payload
      );

      const result = await apiCall(
        "/attendance/bulk",
        "POST",
        payload
      );

      console.log(
        "Save attendance response:",
        result
      );

      if (!result.success) {
        setErrorMsg(
          result.message ||
            "Failed to save attendance."
        );

        return;
      }

      setSuccessMsg(
        "Attendance saved successfully."
      );

      // ------------------------------------------------
      // RELOAD FROM DATABASE
      // ------------------------------------------------
      await loadAttendance();

      // Keep success message after reload
      setSuccessMsg(
        "Attendance saved successfully."
      );

    } catch (error) {
      console.error(
        "Save attendance error:",
        error
      );

      setErrorMsg(
        error.message ||
          "Unable to save attendance."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // MARK ALL PRESENT
  // ==================================================
  const handleMarkAllPresent = () => {
    setStudents((prev) =>
      prev.map((student) => ({
        ...student,
        attendanceStatus: "PRESENT",
      }))
    );

    setSuccessMsg("");
    setErrorMsg("");
  };

  // ==================================================
  // MARK ALL ABSENT
  // ==================================================
  const handleMarkAllAbsent = () => {
    setStudents((prev) =>
      prev.map((student) => ({
        ...student,
        attendanceStatus: "ABSENT",
      }))
    );

    setSuccessMsg("");
    setErrorMsg("");
  };

  // ==================================================
  // SUMMARY
  // ==================================================
  const presentCount =
    filteredStudents.filter(
      (student) =>
        student.attendanceStatus ===
        "PRESENT"
    ).length;

  const absentCount =
    filteredStudents.filter(
      (student) =>
        student.attendanceStatus ===
        "ABSENT"
    ).length;

  const lateCount =
    filteredStudents.filter(
      (student) =>
        student.attendanceStatus ===
        "LATE"
    ).length;

  const leaveCount =
    filteredStudents.filter(
      (student) =>
        student.attendanceStatus ===
        "LEAVE"
    ).length;

  // ==================================================
  // UI
  // ==================================================
  return (
    <div className="p-6 bg-[#e0e5ec] min-h-screen font-sans text-slate-700">

      {/* ==================================================
          HEADER
      ================================================== */}
      <div
        className="
          bg-[#e0e5ec]
          shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]
          rounded-2xl
          p-6
          border
          border-white/50
          mb-6
        "
      >

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

          {/* TITLE */}
          <div>

            <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest">
              Teacher Portal
            </p>

            <h1 className="text-xl font-black text-slate-800 mt-1">
              Student Attendance
            </h1>

            <p className="text-xs text-slate-500 mt-1">
              Mark and save today's student attendance.
            </p>

          </div>

          {/* DATE + CLASS */}
          <div className="flex flex-wrap items-center gap-3">

            {/* Date */}
            <div
              className="
                px-4
                py-3
                rounded-xl
                bg-[#e0e5ec]
                shadow-[inset_3px_3px_6px_rgb(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]
              "
            >
              <p className="text-[9px] font-bold text-slate-400 uppercase">
                Date
              </p>

              <p className="text-xs font-black text-slate-700 mt-1">
                {today}
              </p>
            </div>

            {/* Class */}
            <select
              value={selectedClass}
              onChange={(e) =>
                setSelectedClass(
                  e.target.value
                )
              }
              className="
                bg-[#e0e5ec]
                shadow-[inset_3px_3px_6px_rgb(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]
                rounded-xl
                px-4
                py-3
                text-xs
                font-bold
                text-slate-700
                outline-none
                border
                border-white/20
              "
            >
              <option value="ALL">
                All Classes
              </option>

              {classes.map((className) => (
                <option
                  key={className}
                  value={className}
                >
                  {className}
                </option>
              ))}
            </select>

          </div>

        </div>

      </div>

      {/* ==================================================
          MESSAGES
      ================================================== */}
      {errorMsg && (
        <div
          className="
            mb-5
            px-5
            py-3
            rounded-xl
            bg-rose-50
            border
            border-rose-200
            text-rose-600
            text-xs
            font-bold
          "
        >
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div
          className="
            mb-5
            px-5
            py-3
            rounded-xl
            bg-emerald-50
            border
            border-emerald-200
            text-emerald-600
            text-xs
            font-bold
          "
        >
          ✓ {successMsg}
        </div>
      )}

      {/* ==================================================
          SUMMARY CARDS
      ================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        {/* Present */}
        <div
          className="
            bg-[#e0e5ec]
            shadow-[7px_7px_14px_rgb(163,177,198,0.55),-7px_-7px_14px_rgba(255,255,255,0.5)]
            rounded-2xl
            p-5
            border
            border-white/40
          "
        >
          <p className="text-[10px] font-black text-slate-400 uppercase">
            Present
          </p>

          <p className="text-3xl font-black text-emerald-600 mt-2">
            {presentCount}
          </p>
        </div>

        {/* Absent */}
        <div
          className="
            bg-[#e0e5ec]
            shadow-[7px_7px_14px_rgb(163,177,198,0.55),-7px_-7px_14px_rgba(255,255,255,0.5)]
            rounded-2xl
            p-5
            border
            border-white/40
          "
        >
          <p className="text-[10px] font-black text-slate-400 uppercase">
            Absent
          </p>

          <p className="text-3xl font-black text-rose-600 mt-2">
            {absentCount}
          </p>
        </div>

        {/* Late */}
        <div
          className="
            bg-[#e0e5ec]
            shadow-[7px_7px_14px_rgb(163,177,198,0.55),-7px_-7px_14px_rgba(255,255,255,0.5)]
            rounded-2xl
            p-5
            border
            border-white/40
          "
        >
          <p className="text-[10px] font-black text-slate-400 uppercase">
            Late
          </p>

          <p className="text-3xl font-black text-orange-500 mt-2">
            {lateCount}
          </p>
        </div>

        {/* Leave */}
        <div
          className="
            bg-[#e0e5ec]
            shadow-[7px_7px_14px_rgb(163,177,198,0.55),-7px_-7px_14px_rgba(255,255,255,0.5)]
            rounded-2xl
            p-5
            border
            border-white/40
          "
        >
          <p className="text-[10px] font-black text-slate-400 uppercase">
            Leave
          </p>

          <p className="text-3xl font-black text-blue-600 mt-2">
            {leaveCount}
          </p>
        </div>

      </div>

      {/* ==================================================
          ATTENDANCE TABLE
      ================================================== */}
      <div
        className="
          bg-[#e0e5ec]
          shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]
          rounded-2xl
          border
          border-white/50
          overflow-hidden
        "
      >

        {/* TABLE HEADER */}
        <div className="p-5 border-b border-slate-300/40">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>

              <h2 className="text-sm font-black text-slate-800">
                Today's Attendance
              </h2>

              <p className="text-[11px] text-slate-500 mt-1">
                Saved attendance is loaded from database.
              </p>

            </div>

            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={handleMarkAllPresent}
                disabled={
                  loading || saving
                }
                className="
                  px-4
                  py-2.5
                  rounded-xl
                  bg-emerald-600
                  text-white
                  text-[11px]
                  font-black
                  shadow-md
                  hover:bg-emerald-700
                  disabled:opacity-50
                  transition
                "
              >
                ✓ All Present
              </button>

              <button
                type="button"
                onClick={handleMarkAllAbsent}
                disabled={
                  loading || saving
                }
                className="
                  px-4
                  py-2.5
                  rounded-xl
                  bg-rose-600
                  text-white
                  text-[11px]
                  font-black
                  shadow-md
                  hover:bg-rose-700
                  disabled:opacity-50
                  transition
                "
              >
                ✕ All Absent
              </button>

            </div>

          </div>

        </div>

        {/* ==================================================
            LOADING
        ================================================== */}
        {loading ? (
          <div className="p-16 text-center">

            <div className="text-2xl mb-3">
              ⏳
            </div>

            <p className="text-xs font-bold text-slate-500">
              Loading attendance...
            </p>

          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-16 text-center">

            <div className="text-3xl mb-3">
              👨‍🎓
            </div>

            <p className="text-sm font-black text-slate-600">
              No students found
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Add students first from the Students page.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead>
                <tr className="border-b border-slate-300/40">

                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase">
                    #
                  </th>

                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase">
                    Student
                  </th>

                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase">
                    Class
                  </th>

                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase">
                    Roll No
                  </th>

                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase text-center">
                    Attendance
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredStudents.map(
                  (student, index) => {

                    const studentId =
                      student._id ||
                      student.id;

                    const currentStatus =
                      String(
                        student.attendanceStatus ||
                          "PRESENT"
                      ).toUpperCase();

                    return (
                      <tr
                        key={studentId}
                        className="
                          border-b
                          border-slate-300/30
                          hover:bg-white/20
                          transition
                        "
                      >

                        {/* Number */}
                        <td className="px-5 py-5 text-xs font-bold text-slate-400">
                          {index + 1}
                        </td>

                        {/* Student */}
                        <td className="px-5 py-5">

                          <div className="flex items-center gap-3">

                            {/* Photo / Initial */}
                            <div
                              className="
                                w-10
                                h-10
                                rounded-xl
                                bg-blue-600
                                text-white
                                flex
                                items-center
                                justify-center
                                text-xs
                                font-black
                                shrink-0
                              "
                            >
                              {String(
                                student.name ||
                                  "S"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <p className="text-xs font-black text-slate-800">
                                {student.name ||
                                  "Unknown Student"}
                              </p>

                              <p className="text-[10px] text-slate-400 mt-1">
                                {student.admissionNo ||
                                  "No admission no"}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* Class */}
                        <td className="px-5 py-5">

                          <p className="text-xs font-bold text-slate-700">
                            {student.className ||
                              "-"}
                          </p>

                          {student.section && (
                            <p className="text-[10px] text-slate-400 mt-1">
                              Section{" "}
                              {student.section}
                            </p>
                          )}

                        </td>

                        {/* Roll */}
                        <td className="px-5 py-5 text-xs font-bold text-slate-600">
                          {student.rollNo ||
                            "-"}
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-5">

                          <div className="flex justify-center gap-2 flex-wrap">

                            {/* PRESENT */}
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(
                                  studentId,
                                  "PRESENT"
                                )
                              }
                              disabled={saving}
                              className={`
                                px-3
                                py-2
                                rounded-xl
                                text-[10px]
                                font-black
                                transition
                                ${
                                  currentStatus ===
                                  "PRESENT"
                                    ? "bg-emerald-600 text-white shadow-md"
                                    : "bg-[#e0e5ec] text-slate-500 shadow-[3px_3px_6px_rgb(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.5)]"
                                }
                              `}
                            >
                              Present
                            </button>

                            {/* ABSENT */}
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(
                                  studentId,
                                  "ABSENT"
                                )
                              }
                              disabled={saving}
                              className={`
                                px-3
                                py-2
                                rounded-xl
                                text-[10px]
                                font-black
                                transition
                                ${
                                  currentStatus ===
                                  "ABSENT"
                                    ? "bg-rose-600 text-white shadow-md"
                                    : "bg-[#e0e5ec] text-slate-500 shadow-[3px_3px_6px_rgb(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.5)]"
                                }
                              `}
                            >
                              Absent
                            </button>

                            {/* LATE */}
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(
                                  studentId,
                                  "LATE"
                                )
                              }
                              disabled={saving}
                              className={`
                                px-3
                                py-2
                                rounded-xl
                                text-[10px]
                                font-black
                                transition
                                ${
                                  currentStatus ===
                                  "LATE"
                                    ? "bg-orange-500 text-white shadow-md"
                                    : "bg-[#e0e5ec] text-slate-500 shadow-[3px_3px_6px_rgb(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.5)]"
                                }
                              `}
                            >
                              Late
                            </button>

                            {/* LEAVE */}
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(
                                  studentId,
                                  "LEAVE"
                                )
                              }
                              disabled={saving}
                              className={`
                                px-3
                                py-2
                                rounded-xl
                                text-[10px]
                                font-black
                                transition
                                ${
                                  currentStatus ===
                                  "LEAVE"
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-[#e0e5ec] text-slate-500 shadow-[3px_3px_6px_rgb(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.5)]"
                                }
                              `}
                            >
                              Leave
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

        {/* ==================================================
            SAVE FOOTER
        ================================================== */}
        {filteredStudents.length > 0 && (
          <div
            className="
              p-5
              border-t
              border-slate-300/40
              flex
              flex-col
              sm:flex-row
              sm:items-center
              sm:justify-between
              gap-4
            "
          >

            <div>

              <p className="text-xs font-bold text-slate-600">
                {filteredStudents.length} student
                {filteredStudents.length !== 1
                  ? "s"
                  : ""}
              </p>

              <p className="text-[10px] text-slate-400 mt-1">
                Attendance will be saved for {today}.
              </p>

            </div>

            <button
              type="button"
              onClick={handleSaveAttendance}
              disabled={saving || loading}
              className="
                px-6
                py-3
                rounded-xl
                bg-blue-600
                text-white
                text-xs
                font-black
                shadow-lg
                shadow-blue-500/20
                hover:bg-blue-700
                active:scale-95
                disabled:opacity-60
                disabled:cursor-not-allowed
                transition
              "
            >
              {saving
                ? "Saving..."
                : "💾 Save Attendance"}
            </button>

          </div>
        )}

      </div>

    </div>
  );
}

export default TeacherAttendance;