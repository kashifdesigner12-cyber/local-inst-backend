import React, {
  useEffect,
  useState,
} from "react";
import { apiCall } from "../../services/api";

function TeacherExams() {
  const today = new Date()
    .toISOString()
    .split("T")[0];

  const emptyForm = {
    name: "",
    examType: "MIDTERM",
    className: "",
    startDate: today,
    endDate: today,
    academicYear: "",
  };

  const [exams, setExams] = useState([]);

  const [formData, setFormData] =
    useState(emptyForm);

  const [showModal, setShowModal] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [errorMsg, setErrorMsg] =
    useState("");

  const [successMsg, setSuccessMsg] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const neumorphicCard =
    "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-2xl p-6 border border-white/50";

  const neumorphicInset =
    "bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] rounded-xl px-4 py-2.5 border border-white/20 outline-none text-slate-700 font-medium text-xs w-full";

  const examTypes = [
    {
      value: "MIDTERM",
      label: "Mid Term",
    },
    {
      value: "FINAL",
      label: "Final",
    },
    {
      value: "MONTHLY_TEST",
      label: "Monthly Test",
    },
    {
      value: "QUIZ",
      label: "Quiz",
    },
    {
      value: "ANNUAL",
      label: "Annual",
    },
    {
      value: "OTHER",
      label: "Other",
    },
  ];

  const loadExams = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const result = await apiCall(
        "/exams",
        "GET"
      );

      console.log(
        "Teacher exams response:",
        result
      );

      if (!result.success) {
        setErrorMsg(
          result.message ||
            "Failed to load exams."
        );
        return;
      }

      setExams(
        result.data?.data?.exams || []
      );
    } catch (error) {
      console.error(
        "Load exams error:",
        error
      );

      setErrorMsg(
        error.message ||
          "Unable to load exams."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openModal = () => {
    setErrorMsg("");
    setSuccessMsg("");

    setFormData({
      ...emptyForm,
      startDate: today,
      endDate: today,
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setErrorMsg("");
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();

    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.name.trim()) {
      setErrorMsg(
        "Exam name is required."
      );
      return;
    }

    if (!formData.className.trim()) {
      setErrorMsg(
        "Class is required."
      );
      return;
    }

    if (!formData.startDate) {
      setErrorMsg(
        "Start date is required."
      );
      return;
    }

    if (!formData.endDate) {
      setErrorMsg(
        "End date is required."
      );
      return;
    }

    if (!formData.academicYear.trim()) {
      setErrorMsg(
        "Academic year is required."
      );
      return;
    }

    if (
      new Date(formData.endDate) <
      new Date(formData.startDate)
    ) {
      setErrorMsg(
        "End date cannot be before start date."
      );
      return;
    }

    const payload = {
      name: formData.name.trim(),

      examType:
        formData.examType || "MIDTERM",

      className:
        formData.className.trim(),

      startDate:
        formData.startDate,

      endDate:
        formData.endDate,

      academicYear:
        formData.academicYear.trim(),
    };

    console.log(
      "Creating teacher exam:",
      payload
    );

    setSaving(true);

    try {
      const result = await apiCall(
        "/exams",
        "POST",
        payload
      );

      console.log(
        "Create exam response:",
        result
      );

      if (!result.success) {
        setErrorMsg(
          result.message ||
            "Failed to create exam."
        );
        return;
      }

      const newExam =
        result.data?.data?.exam;

      if (newExam) {
        setExams((prev) => [
          newExam,
          ...prev,
        ]);
      } else {
        await loadExams();
      }

      setShowModal(false);

      setSuccessMsg(
        "Exam created successfully."
      );

      setFormData(emptyForm);

      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    } catch (error) {
      console.error(
        "Create exam error:",
        error
      );

      setErrorMsg(
        error.message ||
          "Unable to connect to backend."
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredExams = exams.filter(
    (exam) => {
      const search =
        searchTerm.trim().toLowerCase();

      if (!search) return true;

      return (
        (exam.name || "")
          .toLowerCase()
          .includes(search) ||
        (exam.className || "")
          .toLowerCase()
          .includes(search) ||
        (exam.examType || "")
          .toLowerCase()
          .includes(search) ||
        (exam.academicYear || "")
          .toLowerCase()
          .includes(search)
      );
    }
  );

  const formatDate = (date) => {
    if (!date) return "-";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "-";
    }

    return parsed.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  return (
    <div>

      {/* Header */}
      <div
        className={`${neumorphicCard} mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4`}
      >
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-blue-600">
            Teacher Panel
          </p>

          <h2 className="text-2xl font-black text-slate-800">
            Create Exam
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            Create and view exams from the backend.
          </p>
        </div>

        <div className="flex gap-2">

          <button
            onClick={loadExams}
            className="bg-[#e0e5ec] text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md hover:text-blue-600 active:scale-95 transition"
          >
            ↻ Refresh
          </button>

          <button
            onClick={openModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md active:scale-95 transition"
          >
            + Create Exam
          </button>

        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-3 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold text-center">
          ✓ {successMsg}
        </div>
      )}

      {errorMsg && !showModal && (
        <div className="mb-6 p-4 bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Search */}
      <div
        className={`${neumorphicCard} mb-6`}
      >
        <input
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(e.target.value)
          }
          placeholder="Search exam, class, type or academic year..."
          className={neumorphicInset}
        />
      </div>

      {/* Exam Table */}
      <div className={neumorphicCard}>

        <div className="mb-5">
          <h3 className="text-sm font-bold text-slate-800">
            Exam Records
          </h3>

          <p className="text-[10px] text-slate-400 mt-1">
            {filteredExams.length} exam(s) found
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400">
            Loading exams...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">

              <thead>
                <tr className="border-b border-slate-300 text-slate-500 uppercase">

                  <th className="pb-3 pr-4">
                    Exam Name
                  </th>

                  <th className="pb-3 pr-4">
                    Type
                  </th>

                  <th className="pb-3 pr-4">
                    Class
                  </th>

                  <th className="pb-3 pr-4">
                    Start
                  </th>

                  <th className="pb-3 pr-4">
                    End
                  </th>

                  <th className="pb-3">
                    Academic Year
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">

                {filteredExams.length > 0 ? (
                  filteredExams.map(
                    (exam) => (
                      <tr
                        key={exam._id}
                        className="hover:bg-white/40 transition"
                      >

                        <td className="py-3 pr-4 font-bold text-slate-800">
                          {exam.name}
                        </td>

                        <td className="py-3 pr-4">
                          <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                            {exam.examType}
                          </span>
                        </td>

                        <td className="py-3 pr-4 text-slate-600">
                          {exam.className}
                        </td>

                        <td className="py-3 pr-4 text-slate-600 whitespace-nowrap">
                          {formatDate(
                            exam.startDate
                          )}
                        </td>

                        <td className="py-3 pr-4 text-slate-600 whitespace-nowrap">
                          {formatDate(
                            exam.endDate
                          )}
                        </td>

                        <td className="py-3 text-slate-600">
                          {exam.academicYear}
                        </td>

                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-10 text-slate-500"
                    >
                      No exams found.
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= CREATE EXAM MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">

          <div
            className={`${neumorphicCard} w-full max-w-2xl bg-[#e0e5ec]`}
          >

            <div className="flex justify-between items-center mb-5 border-b border-slate-300 pb-3">

              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Create New Exam
                </h3>

                <p className="text-[10px] text-slate-500 mt-1">
                  Exam will be saved directly to the backend.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="text-rose-600 font-bold text-sm w-8 h-8 rounded-full bg-[#e0e5ec] shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.8)] flex items-center justify-center disabled:opacity-50"
              >
                ✕
              </button>

            </div>

            {errorMsg && (
              <div className="mb-5 p-3 bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                ⚠️ {errorMsg}
              </div>
            )}

            <form
              onSubmit={handleCreateExam}
              className="space-y-4"
            >

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                  Exam Name *
                </label>

                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={neumorphicInset}
                  placeholder="Mid Term Examination 2026"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                    Exam Type *
                  </label>

                  <select
                    name="examType"
                    value={formData.examType}
                    onChange={handleInputChange}
                    className={neumorphicInset}
                  >
                    {examTypes.map(
                      (type) => (
                        <option
                          key={type.value}
                          value={type.value}
                        >
                          {type.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                    Class *
                  </label>

                  <input
                    name="className"
                    value={formData.className}
                    onChange={handleInputChange}
                    className={neumorphicInset}
                    placeholder="Class 5"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                    Start Date *
                  </label>

                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className={neumorphicInset}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                    End Date *
                  </label>

                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className={neumorphicInset}
                  />
                </div>

              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                  Academic Year *
                </label>

                <input
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleInputChange}
                  className={neumorphicInset}
                  placeholder="2026-2027"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-300 pt-5">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#e0e5ec] text-slate-600 font-bold text-xs shadow-md active:scale-95"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md active:scale-95 disabled:opacity-50"
                >
                  {saving
                    ? "Creating..."
                    : "Create Exam"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default TeacherExams;