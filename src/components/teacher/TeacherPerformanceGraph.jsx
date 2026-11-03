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

  const monthIndex = Number(parts[1]) - 1;

  return MONTHS[monthIndex] || month;
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
// BAR HEIGHT
// ======================================================

const getBarHeight = (percentage) => {
  const value = Number(percentage);

  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
};

// ======================================================
// MAIN COMPONENT
// ======================================================

function TeacherPerformanceGraph() {
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

  const [error, setError] = useState("");

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
  // LOAD PERFORMANCE
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
    if (!month) {
      return;
    }

    setError("");

    loadPerformance();
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
  // GRAPH STUDENTS
  // ====================================================

  const graphStudents = useMemo(() => {
    return filteredStudents.map(
      (student) => {
        const performance =
          performanceMap[
            String(student._id)
          ];

        const percentage =
          performance?.percentage !==
            undefined &&
          performance?.percentage !== null
            ? Number(
                performance.percentage
              )
            : null;

        return {
          ...student,
          percentage,
          remarks:
            performance?.remarks || "",
        };
      }
    );
  }, [
    filteredStudents,
    performanceMap,
  ]);

  // ====================================================
  // STATISTICS
  // ====================================================

  const statistics = useMemo(() => {
    const values = graphStudents
      .map((student) => student.percentage)
      .filter(
        (value) =>
          value !== null &&
          !Number.isNaN(value)
      );

    if (values.length === 0) {
      return {
        average: 0,
        highest: 0,
        lowest: 0,
        totalRated: 0,
      };
    }

    const total = values.reduce(
      (sum, value) => sum + value,
      0
    );

    return {
      average: Math.round(
        total / values.length
      ),
      highest: Math.max(...values),
      lowest: Math.min(...values),
      totalRated: values.length,
    };
  }, [graphStudents]);

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
          {/* TITLE */}

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
              Performance Graph
            </h1>

            <p
              className="
                text-xs
                text-slate-500
                mt-1
              "
            >
              View every student's performance
              percentage for the selected month.
            </p>
          </div>

          {/* MONTH */}

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
              Select Month
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

      {/* ==================================================
          ERROR
      ================================================== */}

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
          SUMMARY CARDS
      ================================================== */}

      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-4
          gap-5
          mb-7
        "
      >
        {/* Average */}

        <div
          className="
            bg-[#e0e5ec]
            rounded-2xl
            p-5
            border
            border-white/50
            shadow-[7px_7px_14px_rgb(163,177,198,0.55),-7px_-7px_14px_rgba(255,255,255,0.55)]
          "
        >
          <p
            className="
              text-[10px]
              font-black
              text-slate-400
              uppercase
            "
          >
            Class Average
          </p>

          <p
            className="
              text-3xl
              font-black
              text-blue-600
              mt-2
            "
          >
            {statistics.average}%
          </p>

          <p
            className="
              text-[10px]
              font-bold
              text-slate-400
              mt-1
            "
          >
            {getMonthName(month)}
          </p>
        </div>

        {/* Highest */}

        <div
          className="
            bg-[#e0e5ec]
            rounded-2xl
            p-5
            border
            border-white/50
            shadow-[7px_7px_14px_rgb(163,177,198,0.55),-7px_-7px_14px_rgba(255,255,255,0.55)]
          "
        >
          <p
            className="
              text-[10px]
              font-black
              text-slate-400
              uppercase
            "
          >
            Highest
          </p>

          <p
            className="
              text-3xl
              font-black
              text-emerald-600
              mt-2
            "
          >
            {statistics.highest}%
          </p>

          <p
            className="
              text-[10px]
              font-bold
              text-slate-400
              mt-1
            "
          >
            Best performance
          </p>
        </div>

        {/* Lowest */}

        <div
          className="
            bg-[#e0e5ec]
            rounded-2xl
            p-5
            border
            border-white/50
            shadow-[7px_7px_14px_rgb(163,177,198,0.55),-7px_-7px_14px_rgba(255,255,255,0.55)]
          "
        >
          <p
            className="
              text-[10px]
              font-black
              text-slate-400
              uppercase
            "
          >
            Lowest
          </p>

          <p
            className="
              text-3xl
              font-black
              text-rose-600
              mt-2
            "
          >
            {statistics.lowest}%
          </p>

          <p
            className="
              text-[10px]
              font-bold
              text-slate-400
              mt-1
            "
          >
            Needs attention
          </p>
        </div>

        {/* Rated */}

        <div
          className="
            bg-[#e0e5ec]
            rounded-2xl
            p-5
            border
            border-white/50
            shadow-[7px_7px_14px_rgb(163,177,198,0.55),-7px_-7px_14px_rgba(255,255,255,0.55)]
          "
        >
          <p
            className="
              text-[10px]
              font-black
              text-slate-400
              uppercase
            "
          >
            Students Rated
          </p>

          <p
            className="
              text-3xl
              font-black
              text-indigo-600
              mt-2
            "
          >
            {statistics.totalRated}
          </p>

          <p
            className="
              text-[10px]
              font-bold
              text-slate-400
              mt-1
            "
          >
            out of {students.length}
          </p>
        </div>
      </div>

      {/* ==================================================
          SEARCH
      ================================================== */}

      <div
        className="
          bg-[#e0e5ec]
          rounded-2xl
          p-5
          mb-7
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
          <div>
            <h2
              className="
                text-sm
                font-black
                text-slate-800
              "
            >
              Student Performance
            </h2>

            <p
              className="
                text-[10px]
                text-slate-500
                mt-1
              "
            >
              {getMonthName(month)} performance
              of all students.
            </p>
          </div>

          <div className="w-full md:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search student..."
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
          LOADING
      ================================================== */}

      {loading ? (
        <div
          className="
            bg-[#e0e5ec]
            rounded-2xl
            p-14
            text-center
            shadow-[7px_7px_14px_rgb(163,177,198,0.55),-7px_-7px_14px_rgba(255,255,255,0.55)]
          "
        >
          <div className="text-3xl mb-3">
            ⏳
          </div>

          <p
            className="
              text-sm
              font-black
              text-slate-600
            "
          >
            Loading performance graph...
          </p>
        </div>
      ) : students.length === 0 ? (
        <div
          className="
            bg-[#e0e5ec]
            rounded-2xl
            p-14
            text-center
            shadow-[7px_7px_14px_rgb(163,177,198,0.55),-7px_-7px_14px_rgba(255,255,255,0.55)]
          "
        >
          <div className="text-4xl mb-3">
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
            Add students first.
          </p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div
          className="
            bg-[#e0e5ec]
            rounded-2xl
            p-14
            text-center
            shadow-[7px_7px_14px_rgb(163,177,198,0.55),-7px_-7px_14px_rgba(255,255,255,0.55)]
          "
        >
          <div className="text-4xl mb-3">
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
        </div>
      ) : (
        <>
          {/* ==================================================
              GRAPH
          ================================================== */}

          <div
            className="
              bg-[#e0e5ec]
              rounded-2xl
              p-6
              mb-7
              border
              border-white/50
              shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]
            "
          >
            {/* Graph Header */}

            <div
              className="
                flex
                flex-col
                md:flex-row
                md:items-center
                md:justify-between
                gap-3
                mb-6
              "
            >
              <div>
                <h2
                  className="
                    text-lg
                    font-black
                    text-slate-800
                  "
                >
                  Student Performance Graph
                </h2>

                <p
                  className="
                    text-xs
                    text-slate-500
                    mt-1
                  "
                >
                  {getMonthName(month)}
                  {" "}
                  performance percentage
                </p>
              </div>

              <div
                className="
                  px-4
                  py-2
                  rounded-xl
                  bg-blue-50
                  text-blue-600
                  text-[10px]
                  font-black
                "
              >
                0% — 100%
              </div>
            </div>

            {/* ==================================================
                DESKTOP GRAPH
            ================================================== */}

            <div
              className="
                overflow-x-auto
                pb-4
              "
            >
              <div
                className="
                  min-w-[850px]
                  relative
                "
              >
                {/* Y AXIS */}

                <div
                  className="
                    absolute
                    left-0
                    top-0
                    bottom-16
                    w-12
                    flex
                    flex-col
                    justify-between
                    items-end
                    pr-2
                  "
                >
                  {[100, 80, 60, 40, 20, 0].map(
                    (value) => (
                      <span
                        key={value}
                        className="
                          text-[10px]
                          font-black
                          text-slate-400
                        "
                      >
                        {value}%
                      </span>
                    )
                  )}
                </div>

                {/* GRAPH AREA */}

                <div
                  className="
                    ml-14
                    h-[430px]
                    relative
                    border-l-2
                    border-b-2
                    border-slate-300/70
                  "
                >
                  {/* GRID */}

                  {[0, 20, 40, 60, 80, 100].map(
                    (value) => {
                      const bottom =
                        `${value}%`;

                      return (
                        <div
                          key={value}
                          className="
                            absolute
                            left-0
                            right-0
                            border-t
                            border-dashed
                            border-slate-300/60
                          "
                          style={{
                            bottom,
                          }}
                        />
                      );
                    }
                  )}

                  {/* BARS */}

                  <div
                    className="
                      absolute
                      inset-0
                      flex
                      items-end
                      justify-around
                      gap-5
                      px-5
                    "
                  >
                    {graphStudents.map(
                      (student) => {
                        const percentage =
                          student.percentage;

                        const height =
                          percentage === null
                            ? 0
                            : getBarHeight(
                                percentage
                              );

                        return (
                          <div
                            key={student._id}
                            className="
                              flex-1
                              max-w-[90px]
                              h-full
                              flex
                              flex-col
                              justify-end
                              items-center
                              group
                            "
                          >
                            {/* VALUE */}

                            {percentage !==
                              null && (
                              <div
                                className="
                                  mb-2
                                  text-xs
                                  font-black
                                  text-blue-600
                                "
                              >
                                {percentage}%
                              </div>
                            )}

                            {/* BAR */}

                            <div
                              className="
                                w-full
                                max-w-[60px]
                                rounded-t-xl
                                bg-blue-600
                                shadow-[5px_0_10px_rgba(37,99,235,0.15)]
                                transition-all
                                duration-500
                                relative
                                hover:bg-blue-700
                              "
                              style={{
                                height:
                                  percentage ===
                                  null
                                    ? "6px"
                                    : `${height}%`,
                              }}
                              title={
                                percentage !==
                                null
                                  ? `${student.name}: ${percentage}%`
                                  : `${student.name}: No performance`
                              }
                            >
                              {percentage !==
                                null && (
                                <div
                                  className="
                                    absolute
                                    left-1/2
                                    -translate-x-1/2
                                    -top-1
                                    w-2
                                    h-2
                                    rounded-full
                                    bg-blue-700
                                  "
                                />
                              )}
                            </div>

                            {/* STUDENT NAME */}

                            <div
                              className="
                                mt-3
                                w-full
                                text-center
                              "
                            >
                              <p
                                className="
                                  text-[10px]
                                  font-black
                                  text-slate-700
                                  truncate
                                "
                                title={
                                  student.name
                                }
                              >
                                {student.name ||
                                  "Student"}
                              </p>

                              <p
                                className="
                                  text-[8px]
                                  font-bold
                                  text-slate-400
                                  mt-1
                                "
                              >
                                {student.className ||
                                  "-"}
                                {student.section
                                  ? `-${student.section}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================
              STUDENT DETAIL CARDS
          ================================================== */}

          <div className="mb-5">
            <h2
              className="
                text-lg
                font-black
                text-slate-800
              "
            >
              Student Details
            </h2>

            <p
              className="
                text-xs
                text-slate-500
                mt-1
              "
            >
              Individual performance for{" "}
              {getMonthName(month)}.
            </p>
          </div>

          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              xl:grid-cols-3
              gap-5
            "
          >
            {graphStudents.map(
              (student) => {
                const percentage =
                  student.percentage;

                return (
                  <div
                    key={student._id}
                    className="
                      bg-[#e0e5ec]
                      rounded-2xl
                      p-5
                      border
                      border-white/50
                      shadow-[7px_7px_14px_rgb(163,177,198,0.55),-7px_-7px_14px_rgba(255,255,255,0.55)]
                    "
                  >
                    {/* Student */}

                    <div
                      className="
                        flex
                        items-center
                        gap-3
                      "
                    >
                      <div
                        className="
                          w-12
                          h-12
                          rounded-xl
                          bg-blue-600
                          text-white
                          flex
                          items-center
                          justify-center
                          text-sm
                          font-black
                          shadow-md
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
                        <h3
                          className="
                            text-sm
                            font-black
                            text-slate-800
                            truncate
                          "
                        >
                          {student.name ||
                            "Student"}
                        </h3>

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

                        <p
                          className="
                            text-[10px]
                            text-slate-400
                            mt-1
                          "
                        >
                          {student.className ||
                            "-"}
                          {student.section
                            ? `-${student.section}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    {/* Percentage */}

                    <div className="mt-5">
                      <div
                        className="
                          flex
                          items-end
                          justify-between
                          mb-2
                        "
                      >
                        <span
                          className="
                            text-[10px]
                            font-black
                            text-slate-400
                            uppercase
                          "
                        >
                          Performance
                        </span>

                        {percentage !==
                        null ? (
                          <span
                            className="
                              text-xl
                              font-black
                              text-blue-600
                            "
                          >
                            {percentage}%
                          </span>
                        ) : (
                          <span
                            className="
                              text-xs
                              font-black
                              text-slate-400
                            "
                          >
                            Not Rated
                          </span>
                        )}
                      </div>

                      {/* Progress */}

                      <div
                        className="
                          w-full
                          h-3
                          rounded-full
                          bg-slate-300/60
                          overflow-hidden
                          shadow-inner
                        "
                      >
                        <div
                          className="
                            h-full
                            rounded-full
                            bg-blue-600
                            transition-all
                            duration-500
                          "
                          style={{
                            width:
                              percentage ===
                              null
                                ? "0%"
                                : `${getBarHeight(
                                    percentage
                                  )}%`,
                          }}
                        />
                      </div>

                      {/* Label */}

                      {percentage !==
                        null && (
                        <div
                          className="
                            flex
                            items-center
                            justify-between
                            mt-3
                          "
                        >
                          <span
                            className="
                              text-[10px]
                              font-black
                              text-slate-500
                            "
                          >
                            {getPerformanceLabel(
                              percentage
                            )}
                          </span>

                          <span
                            className="
                              text-[10px]
                              font-bold
                              text-slate-400
                            "
                          >
                            {getMonthName(
                              month
                            )}
                          </span>
                        </div>
                      )}

                      {/* Remarks */}

                      {student.remarks && (
                        <div
                          className="
                            mt-4
                            px-3
                            py-3
                            rounded-xl
                            bg-white/20
                            border
                            border-white/30
                          "
                        >
                          <p
                            className="
                              text-[9px]
                              font-black
                              text-slate-400
                              uppercase
                              mb-1
                            "
                          >
                            Teacher Remarks
                          </p>

                          <p
                            className="
                              text-xs
                              font-medium
                              text-slate-600
                            "
                          >
                            {student.remarks}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default TeacherPerformanceGraph;