import React, { useEffect, useMemo, useState } from "react";
import { apiCall } from "../../services/api";

// ======================================================
// MONTHS
// ======================================================

const MONTHS = [
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

// ======================================================
// CURRENT MONTH
// ======================================================

const getCurrentMonth = () => {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
};

// ======================================================
// MONTH NAME
// ======================================================

const getMonthName = (month) => {
  if (!month) {
    return "";
  }

  const parts = month.split("-");

  if (parts.length !== 2) {
    return month;
  }

  const index = Number(parts[1]) - 1;

  return MONTHS[index] || month;
};

// ======================================================
// PERFORMANCE LABEL
// ======================================================

const getPerformanceLabel = (percentage) => {
  const value = Number(percentage);

  if (Number.isNaN(value)) {
    return "";
  }

  if (value >= 90) {
    return "Excellent";
  }

  if (value >= 80) {
    return "Very Good";
  }

  if (value >= 70) {
    return "Good";
  }

  if (value >= 60) {
    return "Satisfactory";
  }

  if (value >= 50) {
    return "Needs Improvement";
  }

  return "Needs Attention";
};

// ======================================================
// PERFORMANCE COLOR
// ======================================================

const getPerformanceColor = (percentage) => {
  const value = Number(percentage);

  if (Number.isNaN(value)) {
    return "text-slate-400";
  }

  if (value >= 90) {
    return "text-emerald-600";
  }

  if (value >= 80) {
    return "text-blue-600";
  }

  if (value >= 70) {
    return "text-indigo-600";
  }

  if (value >= 60) {
    return "text-amber-600";
  }

  return "text-rose-600";
};

// ======================================================
// MAIN COMPONENT
// ======================================================

function TeacherPerformance() {
  // ====================================================
  // STATE
  // ====================================================

  const [students, setStudents] = useState([]);

  const [performances, setPerformances] = useState([]);

  const [month, setMonth] = useState(
    getCurrentMonth()
  );

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [savingStudent, setSavingStudent] =
    useState("");

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  // ====================================================
  // PERFORMANCE FORM DATA
  //
  // {
  //   studentId: {
  //      percentage: "70",
  //      remarks: "Good"
  //   }
  // }
  // ====================================================

  const [formData, setFormData] = useState({});

  // ====================================================
  // LOAD STUDENTS
  // ====================================================

  const loadStudents = async () => {
    try {
      const result = await apiCall(
        "/students?limit=100",
        "GET"
      );

      if (!result.success) {
        setError(
          result.message ||
            "Failed to load students."
        );

        return;
      }

      const list =
        result.data?.data?.students || [];

      setStudents(list);
    } catch (error) {
      console.error(
        "Load students error:",
        error
      );

      setError(
        "Unable to load students."
      );
    }
  };

  // ====================================================
  // LOAD PERFORMANCE FOR SELECTED MONTH
  // ====================================================

  const loadPerformance = async () => {
    try {
      const result = await apiCall(
        `/performance?month=${month}`,
        "GET"
      );

      if (!result.success) {
        setError(
          result.message ||
            "Failed to load performance."
        );

        return;
      }

      const list =
        result.data?.data?.performances || [];

      setPerformances(list);

      // ----------------------------------------------
      // CREATE FORM DATA FROM DATABASE
      // ----------------------------------------------

      const newFormData = {};

      list.forEach((item) => {
        const studentId =
          item.student?._id ||
          item.student;

        if (!studentId) {
          return;
        }

        newFormData[String(studentId)] = {
          percentage:
            item.percentage !== undefined &&
            item.percentage !== null
              ? String(item.percentage)
              : "",

          remarks:
            item.remarks || "",
        };
      });

      setFormData(newFormData);
    } catch (error) {
      console.error(
        "Load performance error:",
        error
      );

      setError(
        "Unable to load performance data."
      );
    }
  };

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      await loadStudents();

      setLoading(false);
    };

    load();
  }, []);

  // ====================================================
  // LOAD PERFORMANCE WHEN MONTH CHANGES
  // ====================================================

  useEffect(() => {
    const load = async () => {
      setError("");

      await loadPerformance();
    };

    if (month) {
      load();
    }
  }, [month]);

  // ====================================================
  // PERFORMANCE MAP
  // ====================================================

  const performanceMap = useMemo(() => {
    const map = {};

    performances.forEach((item) => {
      const studentId =
        item.student?._id ||
        item.student;

      if (!studentId) {
        return;
      }

      map[String(studentId)] = item;
    });

    return map;
  }, [performances]);

  // ====================================================
  // FILTER STUDENTS
  // ====================================================

  const filteredStudents = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter((student) => {
      const name =
        String(student.name || "")
          .toLowerCase();

      const admissionNo =
        String(
          student.admissionNo || ""
        ).toLowerCase();

      const className =
        String(
          student.className || ""
        ).toLowerCase();

      const section =
        String(
          student.section || ""
        ).toLowerCase();

      return (
        name.includes(query) ||
        admissionNo.includes(query) ||
        className.includes(query) ||
        section.includes(query)
      );
    });
  }, [students, search]);

  // ====================================================
  // HANDLE PERCENTAGE CHANGE
  // ====================================================

  const handlePercentageChange = (
    studentId,
    value
  ) => {
    // ----------------------------------------------
    // Allow empty value while typing
    // ----------------------------------------------

    if (value === "") {
      setFormData((previous) => ({
        ...previous,

        [studentId]: {
          ...(previous[studentId] || {}),
          percentage: "",
        },
      }));

      return;
    }

    // ----------------------------------------------
    // Only numbers
    // ----------------------------------------------

    if (!/^\d{0,3}$/.test(value)) {
      return;
    }

    const numericValue = Number(value);

    // ----------------------------------------------
    // Maximum 100
    // ----------------------------------------------

    if (numericValue > 100) {
      return;
    }

    setFormData((previous) => ({
      ...previous,

      [studentId]: {
        ...(previous[studentId] || {}),
        percentage: value,
      },
    }));
  };

  // ====================================================
  // HANDLE REMARKS CHANGE
  // ====================================================

  const handleRemarksChange = (
    studentId,
    value
  ) => {
    setFormData((previous) => ({
      ...previous,

      [studentId]: {
        ...(previous[studentId] || {}),
        remarks: value,
      },
    }));
  };

  // ====================================================
  // SAVE ONE STUDENT PERFORMANCE
  // ====================================================

  const handleSave = async (student) => {
    const studentId = String(
      student._id
    );

    setError("");
    setMessage("");

    const data =
      formData[studentId] || {};

    const percentage =
      data.percentage;

    // ----------------------------------------------
    // VALIDATE PERCENTAGE
    // ----------------------------------------------

    if (
      percentage === undefined ||
      percentage === null ||
      percentage === ""
    ) {
      setError(
        `Please enter performance percentage for ${student.name}.`
      );

      return;
    }

    const numericPercentage =
      Number(percentage);

    if (
      Number.isNaN(numericPercentage) ||
      numericPercentage < 0 ||
      numericPercentage > 100
    ) {
      setError(
        "Performance must be between 0% and 100%."
      );

      return;
    }

    // ----------------------------------------------
    // SAVE
    // ----------------------------------------------

    setSavingStudent(studentId);

    try {
      const result = await apiCall(
        "/performance",
        "POST",
        {
          studentId,
          month,
          percentage:
            numericPercentage,
          remarks:
            data.remarks || "",
        }
      );

      if (!result.success) {
        setError(
          result.message ||
            "Failed to save performance."
        );

        return;
      }

      setMessage(
        `${student.name}'s performance saved successfully.`
      );

      // --------------------------------------------
      // RELOAD PERFORMANCE
      // --------------------------------------------

      await loadPerformance();
    } catch (error) {
      console.error(
        "Save performance error:",
        error
      );

      setError(
        "Unable to save performance."
      );
    } finally {
      setSavingStudent("");
    }
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div
      className="
        min-h-screen
        bg-[#e0e5ec]
        p-6
        text-slate-700
      "
    >
      {/* ==================================================
          HEADER
      ================================================== */}

      <div
        className="
          bg-[#e0e5ec]
          rounded-2xl
          p-6
          mb-6
          border
          border-white/50
          shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]
        "
      >
        <div
          className="
            flex
            flex-col
            lg:flex-row
            lg:items-center
            lg:justify-between
            gap-5
          "
        >
          {/* Title */}

          <div>
            <p
              className="
                text-[10px]
                font-black
                text-blue-600
                uppercase
                tracking-widest
              "
            >
              Teacher Portal
            </p>

            <h1
              className="
                text-2xl
                font-black
                text-slate-800
                mt-1
              "
            >
              Student Performance
            </h1>

            <p
              className="
                text-xs
                text-slate-500
                mt-1
              "
            >
              Enter monthly performance percentage
              for each student.
            </p>
          </div>

          {/* Month */}

          <div
            className="
              flex
              flex-col
              sm:flex-row
              gap-3
            "
          >
            <div>
              <label
                className="
                  block
                  text-[10px]
                  font-black
                  text-slate-400
                  uppercase
                  mb-2
                "
              >
                Performance Month
              </label>

              <input
                type="month"
                value={month}
                onChange={(e) =>
                  setMonth(e.target.value)
                }
                className="
                  px-4
                  py-3
                  rounded-xl
                  bg-[#e0e5ec]
                  text-xs
                  font-bold
                  text-slate-700
                  outline-none
                  shadow-[inset_3px_3px_6px_rgb(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]
                "
              />
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          MESSAGES
      ================================================== */}

      {message && (
        <div
          className="
            mb-5
            p-4
            rounded-xl
            bg-emerald-100
            border
            border-emerald-200
            text-emerald-700
            text-xs
            font-bold
          "
        >
          ✓ {message}
        </div>
      )}

      {error && (
        <div
          className="
            mb-5
            p-4
            rounded-xl
            bg-rose-100
            border
            border-rose-200
            text-rose-700
            text-xs
            font-bold
          "
        >
          ⚠️ {error}
        </div>
      )}

      {/* ==================================================
          CONTROLS
      ================================================== */}

      <div
        className="
          bg-[#e0e5ec]
          rounded-2xl
          p-5
          mb-6
          border
          border-white/50
          shadow-[7px_7px_14px_rgb(163,177,198,0.55),-7px_-7px_14px_rgba(255,255,255,0.55)]
        "
      >
        <div
          className="
            flex
            flex-col
            md:flex-row
            md:items-center
            md:justify-between
            gap-4
          "
        >
          {/* Selected Month */}

          <div>
            <p
              className="
                text-[10px]
                font-black
                text-slate-400
                uppercase
              "
            >
              Entering Performance For
            </p>

            <p
              className="
                text-lg
                font-black
                text-blue-600
                mt-1
              "
            >
              {getMonthName(month)}
              {" "}
              {month?.split("-")[0]}
            </p>
          </div>

          {/* Search */}

          <div className="w-full md:w-80">
            <label
              className="
                block
                text-[10px]
                font-black
                text-slate-400
                uppercase
                mb-2
              "
            >
              Search Student
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search name, admission no..."
              className="
                w-full
                px-4
                py-3
                rounded-xl
                bg-[#e0e5ec]
                text-xs
                font-bold
                text-slate-700
                outline-none
                placeholder:text-slate-400
                shadow-[inset_3px_3px_6px_rgb(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]
              "
            />
          </div>
        </div>
      </div>

      {/* ==================================================
          STUDENTS
      ================================================== */}

      {loading ? (
        <div
          className="
            bg-[#e0e5ec]
            rounded-2xl
            p-12
            text-center
            shadow-[7px_7px_14px_rgb(163,177,198,0.55),-7px_-7px_14px_rgba(255,255,255,0.55)]
          "
        >
          <div
            className="
              text-2xl
              mb-3
            "
          >
            ⏳
          </div>

          <p
            className="
              text-sm
              font-black
              text-slate-600
            "
          >
            Loading students...
          </p>
        </div>
      ) : students.length === 0 ? (
        <div
          className="
            bg-[#e0e5ec]
            rounded-2xl
            p-12
            text-center
            shadow-[7px_7px_14px_rgb(163,177,198,0.55),-7px_-7px_14px_rgba(255,255,255,0.55)]
          "
        >
          <div className="text-3xl mb-3">
            👨‍🎓
          </div>

          <p
            className="
              text-sm
              font-black
              text-slate-600
            "
          >
            No students found
          </p>

          <p
            className="
              text-xs
              text-slate-400
              mt-1
            "
          >
            Add students first from the Students
            section.
          </p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div
          className="
            bg-[#e0e5ec]
            rounded-2xl
            p-12
            text-center
            shadow-[7px_7px_14px_rgb(163,177,198,0.55),-7px_-7px_14px_rgba(255,255,255,0.55)]
          "
        >
          <div className="text-3xl mb-3">
            🔍
          </div>

          <p
            className="
              text-sm
              font-black
              text-slate-600
            "
          >
            No matching students
          </p>

          <p
            className="
              text-xs
              text-slate-400
              mt-1
            "
          >
            Try another student name or admission
            number.
          </p>
        </div>
      ) : (
        <div
          className="
            bg-[#e0e5ec]
            rounded-2xl
            border
            border-white/50
            overflow-hidden
            shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]
          "
        >
          {/* ==================================================
              TABLE HEADER
          ================================================== */}

          <div
            className="
              hidden
              lg:grid
              lg:grid-cols-[70px_1.5fr_1fr_180px_1.5fr_130px]
              gap-4
              items-center
              px-6
              py-4
              border-b
              border-slate-300/40
              bg-white/10
            "
          >
            <div
              className="
                text-[10px]
                font-black
                text-slate-400
                uppercase
              "
            >
              #
            </div>

            <div
              className="
                text-[10px]
                font-black
                text-slate-400
                uppercase
              "
            >
              Student
            </div>

            <div
              className="
                text-[10px]
                font-black
                text-slate-400
                uppercase
              "
            >
              Class
            </div>

            <div
              className="
                text-[10px]
                font-black
                text-slate-400
                uppercase
              "
            >
              Performance %
            </div>

            <div
              className="
                text-[10px]
                font-black
                text-slate-400
                uppercase
              "
            >
              Remarks
            </div>

            <div
              className="
                text-[10px]
                font-black
                text-slate-400
                uppercase
                text-right
              "
            >
              Action
            </div>
          </div>

          {/* ==================================================
              STUDENT ROWS
          ================================================== */}

          <div>
            {filteredStudents.map(
              (student, index) => {
                const studentId = String(
                  student._id
                );

                const data =
                  formData[studentId] || {};

                const percentage =
                  data.percentage ?? "";

                const existing =
                  performanceMap[
                    studentId
                  ];

                const saving =
                  savingStudent === studentId;

                return (
                  <div
                    key={studentId}
                    className="
                      px-5
                      lg:px-6
                      py-5
                      border-b
                      border-slate-300/30
                      last:border-b-0
                      hover:bg-white/10
                      transition
                    "
                  >
                    {/* ==================================================
                        DESKTOP
                    ================================================== */}

                    <div
                      className="
                        hidden
                        lg:grid
                        lg:grid-cols-[70px_1.5fr_1fr_180px_1.5fr_130px]
                        gap-4
                        items-center
                      "
                    >
                      {/* Number */}

                      <div
                        className="
                          w-9
                          h-9
                          rounded-xl
                          bg-white/20
                          flex
                          items-center
                          justify-center
                          text-xs
                          font-black
                          text-slate-500
                        "
                      >
                        {index + 1}
                      </div>

                      {/* Student */}

                      <div className="flex items-center gap-3">
                        <div
                          className="
                            w-11
                            h-11
                            rounded-xl
                            bg-blue-600
                            text-white
                            flex
                            items-center
                            justify-center
                            text-sm
                            font-black
                            shrink-0
                            shadow-md
                          "
                        >
                          {String(
                            student.name ||
                              "S"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p
                            className="
                              text-sm
                              font-black
                              text-slate-800
                              truncate
                            "
                          >
                            {student.name ||
                              "Student"}
                          </p>

                          <p
                            className="
                              text-[10px]
                              text-slate-400
                              mt-1
                            "
                          >
                            {student.admissionNo ||
                              "No admission no"}
                          </p>
                        </div>
                      </div>

                      {/* Class */}

                      <div>
                        <p
                          className="
                            text-xs
                            font-black
                            text-slate-700
                          "
                        >
                          {student.className ||
                            "-"}
                          {student.section
                            ? `-${student.section}`
                            : ""}
                        </p>

                        {student.rollNo && (
                          <p
                            className="
                              text-[10px]
                              text-slate-400
                              mt-1
                            "
                          >
                            Roll No:
                            {" "}
                            {student.rollNo}
                          </p>
                        )}
                      </div>

                      {/* Percentage */}

                      <div>
                        <div
                          className="
                            relative
                            flex
                            items-center
                          "
                        >
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={
                              percentage
                            }
                            onChange={(e) =>
                              handlePercentageChange(
                                studentId,
                                e.target.value
                              )
                            }
                            placeholder="70"
                            className="
                              w-full
                              px-4
                              py-3
                              pr-10
                              rounded-xl
                              bg-[#e0e5ec]
                              text-sm
                              font-black
                              text-slate-700
                              outline-none
                              shadow-[inset_3px_3px_6px_rgb(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]
                            "
                          />

                          <span
                            className="
                              absolute
                              right-4
                              text-sm
                              font-black
                              text-slate-400
                            "
                          >
                            %
                          </span>
                        </div>

                        {percentage !==
                          "" && (
                          <p
                            className={`
                              text-[9px]
                              font-black
                              mt-2
                              ${getPerformanceColor(
                                percentage
                              )}
                            `}
                          >
                            {getPerformanceLabel(
                              percentage
                            )}
                          </p>
                        )}
                      </div>

                      {/* Remarks */}

                      <div>
                        <input
                          type="text"
                          value={
                            data.remarks ||
                            ""
                          }
                          onChange={(e) =>
                            handleRemarksChange(
                              studentId,
                              e.target.value
                            )
                          }
                          placeholder="Optional remarks..."
                          className="
                            w-full
                            px-4
                            py-3
                            rounded-xl
                            bg-[#e0e5ec]
                            text-xs
                            font-medium
                            text-slate-700
                            outline-none
                            placeholder:text-slate-400
                            shadow-[inset_3px_3px_6px_rgb(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]
                          "
                        />
                      </div>

                      {/* Save */}

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            handleSave(
                              student
                            )
                          }
                          disabled={saving}
                          className="
                            px-5
                            py-3
                            rounded-xl
                            bg-blue-600
                            text-white
                            text-xs
                            font-black
                            shadow-lg
                            shadow-blue-500/25
                            hover:bg-blue-700
                            active:scale-95
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                            transition
                          "
                        >
                          {saving
                            ? "Saving..."
                            : existing
                              ? "✓ Update"
                              : "💾 Save"}
                        </button>
                      </div>
                    </div>

                    {/* ==================================================
                        MOBILE / TABLET
                    ================================================== */}

                    <div
                      className="
                        lg:hidden
                      "
                    >
                      {/* Student Header */}

                      <div
                        className="
                          flex
                          items-center
                          justify-between
                          gap-3
                          mb-5
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            gap-3
                            min-w-0
                          "
                        >
                          <div
                            className="
                              w-11
                              h-11
                              rounded-xl
                              bg-blue-600
                              text-white
                              flex
                              items-center
                              justify-center
                              text-sm
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

                          <div className="min-w-0">
                            <p
                              className="
                                text-sm
                                font-black
                                text-slate-800
                                truncate
                              "
                            >
                              {student.name ||
                                "Student"}
                            </p>

                            <p
                              className="
                                text-[10px]
                                text-slate-400
                                mt-1
                              "
                            >
                              {student.admissionNo ||
                                "No admission no"}
                              {" • "}
                              {student.className ||
                                "-"}
                              {student.section
                                ? `-${student.section}`
                                : ""}
                            </p>
                          </div>
                        </div>

                        <div
                          className="
                            text-[10px]
                            font-black
                            text-slate-400
                          "
                        >
                          #{index + 1}
                        </div>
                      </div>

                      {/* Percentage + Remarks */}

                      <div
                        className="
                          grid
                          grid-cols-1
                          sm:grid-cols-2
                          gap-4
                        "
                      >
                        {/* Percentage */}

                        <div>
                          <label
                            className="
                              block
                              text-[10px]
                              font-black
                              text-slate-400
                              uppercase
                              mb-2
                            "
                          >
                            Performance %
                          </label>

                          <div
                            className="
                              relative
                              flex
                              items-center
                            "
                          >
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={
                                percentage
                              }
                              onChange={(e) =>
                                handlePercentageChange(
                                  studentId,
                                  e.target.value
                                )
                              }
                              placeholder="70"
                              className="
                                w-full
                                px-4
                                py-3
                                pr-10
                                rounded-xl
                                bg-[#e0e5ec]
                                text-sm
                                font-black
                                text-slate-700
                                outline-none
                                shadow-[inset_3px_3px_6px_rgb(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]
                              "
                            />

                            <span
                              className="
                                absolute
                                right-4
                                text-sm
                                font-black
                                text-slate-400
                              "
                            >
                              %
                            </span>
                          </div>

                          {percentage !==
                            "" && (
                            <p
                              className={`
                                text-[9px]
                                font-black
                                mt-2
                                ${getPerformanceColor(
                                  percentage
                                )}
                              `}
                            >
                              {getPerformanceLabel(
                                percentage
                              )}
                            </p>
                          )}
                        </div>

                        {/* Remarks */}

                        <div>
                          <label
                            className="
                              block
                              text-[10px]
                              font-black
                              text-slate-400
                              uppercase
                              mb-2
                            "
                          >
                            Remarks
                          </label>

                          <input
                            type="text"
                            value={
                              data.remarks ||
                              ""
                            }
                            onChange={(e) =>
                              handleRemarksChange(
                                studentId,
                                e.target.value
                              )
                            }
                            placeholder="Optional remarks..."
                            className="
                              w-full
                              px-4
                              py-3
                              rounded-xl
                              bg-[#e0e5ec]
                              text-xs
                              font-medium
                              text-slate-700
                              outline-none
                              placeholder:text-slate-400
                              shadow-[inset_3px_3px_6px_rgb(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]
                            "
                          />
                        </div>
                      </div>

                      {/* Save */}

                      <div className="flex justify-end mt-4">
                        <button
                          type="button"
                          onClick={() =>
                            handleSave(
                              student
                            )
                          }
                          disabled={saving}
                          className="
                            px-6
                            py-3
                            rounded-xl
                            bg-blue-600
                            text-white
                            text-xs
                            font-black
                            shadow-lg
                            shadow-blue-500/25
                            hover:bg-blue-700
                            active:scale-95
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                            transition
                          "
                        >
                          {saving
                            ? "Saving..."
                            : existing
                              ? "✓ Update Performance"
                              : "💾 Save Performance"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* ==================================================
          FOOTER INFO
      ================================================== */}

      {!loading &&
        students.length > 0 &&
        filteredStudents.length > 0 && (
          <div
            className="
              mt-6
              flex
              flex-col
              sm:flex-row
              sm:items-center
              sm:justify-between
              gap-3
              text-[10px]
              font-bold
              text-slate-400
            "
          >
            <p>
              Showing{" "}
              <span className="text-slate-600">
                {filteredStudents.length}
              </span>{" "}
              of{" "}
              <span className="text-slate-600">
                {students.length}
              </span>{" "}
              students
            </p>

            <p>
              Performance month:{" "}
              <span className="text-blue-600">
                {getMonthName(month)}
                {" "}
                {month?.split("-")[0]}
              </span>
            </p>
          </div>
        )}
    </div>
  );
}

export default TeacherPerformance;