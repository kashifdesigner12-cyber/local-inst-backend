import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiCall, API_BASE_URL } from "../../services/api";

function StudentList() {
  const navigate = useNavigate();
  const idCardInputRef = useRef(null);

  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // View Details Modal State
  const [viewingStudent, setViewingStudent] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [idCardFile, setIdCardFile] = useState(null);
  const [idCardPreview, setIdCardPreview] = useState("");
  const [idCardFileName, setIdCardFileName] = useState("");

  // All 23 Courses
  const allCourses = [
    "Digital marketing",
    "Artificial Intelligence",
    "Coding with python",
    "Google Adsense",
    "Meta Ads/Google Ads",
    "Wordpress+SEO",
    "Generative AI",
    "IT Support, Hardware & Networking Basics",
    "Graphic Design",
    "Freelancing",
    "Ai Content Creation",
    "Basic Computer",
    "DIT(1 Year)",
    "Data Analytics",
    "Full Stack Development",
    "SEO",
    "Web Development",
    "Prompt Engineering",
    "Microsoft courses",
    "Ecommerce",
    "Content & Copy Writing",
    "Amazon Virtual Assistant",
    "Spoken English",
  ];

  const durationOptions = ["2 Months", "3 Months", "6 Months", "1 Year"];

  const [selectedCourses, setSelectedCourses] = useState(["SEO"]);
  const [selectedDuration, setSelectedDuration] = useState("3 Months");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    admissionNo: "",
    gender: "Male",
    dob: "",
    admissionDate: "",
    status: "Active",
    section: "Morning",
    rollNumber: "",
    fatherName: "",
    parentPhone: "",
    studentPhone: "",
    cnic: "",
    address: "",
  });

  const neumorphicCard =
    "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-2xl p-6 border border-white/50";

  const neumorphicInset =
    "bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] rounded-xl px-4 py-2.5 border border-white/20 outline-none text-slate-700 font-medium text-xs w-full";

  // =========================================================
  // Reset Form
  // =========================================================

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      admissionNo: "",
      gender: "Male",
      dob: "",
      admissionDate: "",
      status: "Active",
      section: "Morning",
      rollNumber: "",
      fatherName: "",
      parentPhone: "",
      studentPhone: "",
      cnic: "",
      address: "",
    });

    setSelectedCourses(["SEO"]);
    setSelectedDuration("3 Months");

    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview("");

    setIdCardFile(null);
    if (idCardPreview) URL.revokeObjectURL(idCardPreview);
    setIdCardPreview("");
    setIdCardFileName("");
  };

  // =========================================================
  // Load Students
  // GET /api/students
  // =========================================================

  const loadStudents = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const result = await apiCall("/students?page=1&limit=100", "GET");

      if (!result.success) {
        setErrorMsg(result.message || "Failed to load students.");
        return;
      }

      const studentList = result.data?.data?.students || [];
      setStudents(studentList);
    } catch (error) {
      setErrorMsg(error.message || "Unable to load students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();

    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      if (idCardPreview) URL.revokeObjectURL(idCardPreview);
    };
  }, []);

  // =========================================================
  // Input Change
  // =========================================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCourseToggle = (course) => {
    if (selectedCourses.includes(course)) {
      if (selectedCourses.length === 1) {
        setErrorMsg("At least one course must be selected.");
        return;
      }
      setSelectedCourses(selectedCourses.filter((c) => c !== course));
    } else {
      setSelectedCourses([...selectedCourses, course]);
    }
  };

  // =========================================================
  // Student Photo Upload
  // =========================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Invalid image. Only JPG, PNG, WEBP are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Student photo size must be 5 MB or less.");
      e.target.value = "";
      return;
    }

    setErrorMsg("");
    if (photoPreview) URL.revokeObjectURL(photoPreview);

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // =========================================================
  // ID Card / CNIC Upload (REQUIRED)
  // =========================================================

  const handleIdCardChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Invalid ID Card format. Upload an image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg("ID Card size must be 8 MB or less.");
      e.target.value = "";
      return;
    }

    setErrorMsg("");
    setIdCardFileName(file.name);
    if (idCardPreview) URL.revokeObjectURL(idCardPreview);

    setIdCardFile(file);
    setIdCardPreview(URL.createObjectURL(file));
  };

  // =========================================================
  // Open / Close Modal
  // =========================================================

  const handleOpenModal = () => {
    setErrorMsg("");
    setSuccessMsg("");
    resetForm();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setShowModal(false);
    setErrorMsg("");
    resetForm();
  };

  // =========================================================
  // Add Student (POST /api/students)
  // =========================================================

  const handleAddStudent = async (e) => {
    e.preventDefault();

    setErrorMsg("");
    setSuccessMsg("");

    const fullName = `${formData.firstName} ${formData.lastName}`
      .trim()
      .replace(/\s+/g, " ");

    if (!fullName) {
      setErrorMsg("Please enter student name.");
      return;
    }

    if (!formData.admissionNo.trim()) {
      setErrorMsg("Please enter admission number.");
      return;
    }

    if (!idCardFile) {
      setErrorMsg("ID Card / CNIC Copy upload is strictly REQUIRED.");
      return;
    }

    if (selectedCourses.length === 0) {
      setErrorMsg("Please select at least one course.");
      return;
    }

    if (!formData.section.trim()) {
      setErrorMsg("Please enter section.");
      return;
    }

    if (!formData.fatherName.trim()) {
      setErrorMsg("Please enter father/guardian name.");
      return;
    }

    if (!formData.parentPhone.trim()) {
      setErrorMsg("Please enter parent phone / WhatsApp.");
      return;
    }

    setSaving(true);

    try {
      const payload = new FormData();

      payload.append("name", fullName);
      payload.append("admissionNo", formData.admissionNo.trim());
      payload.append("className", selectedCourses.join(", "));
      payload.append("courseDuration", selectedDuration);
      payload.append("section", formData.section.trim());

      if (formData.rollNumber.trim()) {
        payload.append("rollNo", formData.rollNumber.trim());
      }

      payload.append("gender", formData.gender.toUpperCase());
      payload.append("status", formData.status.toUpperCase());
      payload.append("parentName", formData.fatherName.trim());
      payload.append("parentPhone", formData.parentPhone.trim());
      payload.append("parentWhatsApp", formData.parentPhone.trim());

      if (formData.studentPhone.trim()) {
        payload.append("studentPhone", formData.studentPhone.trim());
      }

      if (formData.cnic.trim()) {
        payload.append("cnic", formData.cnic.trim());
      }

      if (formData.address.trim()) {
        payload.append("address", formData.address.trim());
      }

      if (formData.dob) {
        payload.append("dateOfBirth", formData.dob);
      }

      if (formData.admissionDate) {
        payload.append("admissionDate", formData.admissionDate);
      }

      // Student Avatar Photo
      if (photoFile) {
        payload.append("photo", photoFile);
      }

      // ID Card / CNIC File
      if (idCardFile) {
        payload.append("idCard", idCardFile);
      }

      const result = await apiCall("/students", "POST", payload);

      if (!result.success) {
        setErrorMsg(result.message || "Failed to add student.");
        return;
      }

      const newStudent = result.data?.data?.student;

      if (newStudent) {
        setStudents((prev) => [newStudent, ...prev]);
      } else {
        await loadStudents();
      }

      setShowModal(false);
      setSuccessMsg("Student successfully added with courses and ID Card!");
      resetForm();

      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    } catch (error) {
      setErrorMsg(error.message || "Unable to connect to backend.");
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // Delete Student
  // =========================================================

  const handleDeleteStudent = async (student) => {
    if (!student?._id) return;

    const confirmed = window.confirm(`Delete student "${student.name}"?`);
    if (!confirmed) return;

    setErrorMsg("");
    setSuccessMsg("");
    setDeletingId(student._id);

    try {
      const result = await apiCall(`/students/${student._id}`, "DELETE");

      if (!result.success) {
        setErrorMsg(result.message || "Failed to delete student.");
        return;
      }

      setStudents((prev) => prev.filter((item) => item._id !== student._id));
      setSuccessMsg("Student deleted successfully.");

      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    } catch (error) {
      setErrorMsg(error.message || "Unable to delete student.");
    } finally {
      setDeletingId("");
    }
  };

  const getMediaUrl = (path) => {
    if (!path) return "";
    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("data:")
    ) {
      return path;
    }
    return `${API_BASE_URL.replace("/api", "")}${path}`;
  };

  return (
    <div className="p-6 bg-[#e0e5ec] min-h-screen font-sans text-slate-700">
      {/* Header */}
      <div
        className={`${neumorphicCard} mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}
      >
        <div>
          <h1 className="text-sm font-black text-slate-800">
            Students Management
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Manage student credentials, courses, and CNIC/ID Card documents.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadStudents}
            disabled={loading}
            className="bg-[#e0e5ec] text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs shadow-[4px_4px_8px_rgb(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.7)] active:scale-95 transition disabled:opacity-50"
          >
            ↻ Refresh
          </button>

          <button
            onClick={handleOpenModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md active:scale-95 transition"
          >
            + Add Student
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mb-6 p-3 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold text-center">
          ✅ {successMsg}
        </div>
      )}

      {errorMsg && !showModal && !viewingStudent && (
        <div className="mb-6 p-3 bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold text-center">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className={`${neumorphicCard} text-center py-12`}>
          <p className="text-xs font-bold text-slate-500 animate-pulse">
            Loading students from database...
          </p>
        </div>
      ) : (
        <div className={neumorphicCard}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Students Directory
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                {students.length} student(s) found
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 uppercase">
                  <th className="pb-3 pr-4">Photo</th>
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Admission No</th>
                  <th className="pb-3 pr-4">CNIC / ID Card</th>
                  <th className="pb-3 pr-4">Father Name</th>
                  <th className="pb-3 pr-4">WhatsApp</th>
                  <th className="pb-3 pr-4">Enrolled Course(s)</th>
                  <th className="pb-3 pr-4">Duration</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {students.length > 0 ? (
                  students.map((student) => {
                    const photoUrl = getMediaUrl(student.photo);

                    return (
                      <tr
                        key={student._id}
                        className="hover:bg-white/40 transition"
                      >
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

                        <td className="py-3 pr-4 font-bold text-slate-800">
                          {student.name || "-"}
                        </td>

                        <td className="py-3 pr-4 text-slate-600 font-mono">
                          {student.admissionNo || "-"}
                        </td>

                        <td className="py-3 pr-4 text-slate-600 font-mono">
                          <div className="flex flex-col gap-0.5">
                            <span>{student.cnic || "No CNIC"}</span>
                            {(student.idCardPhoto || student.idCard) && (
                              <span className="text-[10px] text-emerald-600 font-bold">
                                🪪 ID Attached
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 pr-4 text-slate-600">
                          {student.parentName || "-"}
                        </td>

                        <td className="py-3 pr-4 text-slate-600 font-mono">
                          {student.parentWhatsApp || student.parentPhone || "-"}
                        </td>

                        <td className="py-3 pr-4 text-slate-600 max-w-xs truncate font-medium">
                          {student.className || "-"}
                        </td>

                        <td className="py-3 pr-4 text-slate-600 font-semibold">
                          {student.courseDuration || "3 Months"}
                        </td>

                        <td className="py-3 pr-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                              student.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {student.status || "-"}
                          </span>
                        </td>

                        {/* Action Buttons: View Details + Delete */}
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setViewingStudent(student)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] shadow-sm active:scale-95 transition"
                              title="View Full Profile & ID Card"
                            >
                              👁️ View
                            </button>

                            <button
                              onClick={() => handleDeleteStudent(student)}
                              disabled={deletingId === student._id}
                              className="px-3 py-1.5 rounded-lg bg-[#e0e5ec] shadow-[2px_2px_5px_rgb(163,177,198,0.6),-2px_-2px_5px_rgba(255,255,255,0.7)] text-rose-600 font-bold text-[10px] active:scale-95 transition disabled:opacity-50"
                            >
                              {deletingId === student._id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="10"
                      className="text-center py-10 text-slate-500"
                    >
                      No students found in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================
          VIEW STUDENT DETAILS MODAL
      ====================================================== */}

      {viewingStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            className={`${neumorphicCard} w-full max-w-3xl bg-[#e0e5ec] max-h-[92vh] overflow-y-auto`}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-5 border-b border-slate-300 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-800">
                  Student Profile Details
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  Admission No:{" "}
                  <span className="font-mono font-bold text-blue-600">
                    {viewingStudent.admissionNo}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewingStudent(null)}
                className="text-rose-600 font-bold text-sm w-8 h-8 rounded-full bg-[#e0e5ec] shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.8)] flex items-center justify-center hover:bg-rose-50 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile Top Banner: Photo & Primary Info */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.8)] rounded-2xl">
                <div className="w-24 h-24 rounded-2xl bg-white shadow-md overflow-hidden flex items-center justify-center border border-white/60 shrink-0">
                  {getMediaUrl(viewingStudent.photo) ? (
                    <img
                      src={getMediaUrl(viewingStudent.photo)}
                      alt={viewingStudent.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">👤</span>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h2 className="text-lg font-black text-slate-900">
                      {viewingStudent.name}
                    </h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        viewingStudent.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                          : "bg-rose-100 text-rose-700 border border-rose-300"
                      }`}
                    >
                      {viewingStudent.status}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-500">
                    Gender:{" "}
                    <span className="text-slate-700 font-medium">
                      {viewingStudent.gender || "Male"}
                    </span>{" "}
                    • Section:{" "}
                    <span className="text-slate-700 font-medium">
                      {viewingStudent.section || "-"}
                    </span>{" "}
                    • Roll No:{" "}
                    <span className="text-slate-700 font-medium">
                      {viewingStudent.rollNo || "-"}
                    </span>
                  </p>

                  <p className="text-xs font-bold text-slate-500">
                    CNIC / B-Form:{" "}
                    <span className="text-blue-700 font-mono font-bold">
                      {viewingStudent.cnic || "Not Provided"}
                    </span>
                  </p>
                </div>
              </div>

              {/* ID CARD / CNIC COPY (LARGE PREVIEW) */}
              <div className="p-4 bg-[#e0e5ec] shadow-[inset_2px_2px_5px_rgb(163,177,198,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] rounded-xl border border-blue-400/40">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    🪪 ID Card / CNIC Document Copy
                  </h4>
                  {(viewingStudent.idCardPhoto || viewingStudent.idCard) && (
                    <a
                      href={getMediaUrl(
                        viewingStudent.idCardPhoto || viewingStudent.idCard
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      Open Full Size ↗
                    </a>
                  )}
                </div>

                <div className="w-full min-h-[220px] max-h-[380px] rounded-xl bg-white flex items-center justify-center overflow-hidden border border-slate-300 shadow-inner p-2">
                  {viewingStudent.idCardPhoto || viewingStudent.idCard ? (
                    <img
                      src={getMediaUrl(
                        viewingStudent.idCardPhoto || viewingStudent.idCard
                      )}
                      alt="Student ID Card Copy"
                      className="max-h-[360px] w-auto max-w-full object-contain rounded-lg shadow-sm"
                      onError={(e) => {
                        e.currentTarget.src = "";
                        e.currentTarget.alt = "Failed to load ID card image";
                      }}
                    />
                  ) : (
                    <div className="text-center py-8 text-slate-400 font-semibold text-xs">
                      No ID Card Image uploaded for this student.
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Course Details */}
                <div className="p-4 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_rgb(163,177,198,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] space-y-2">
                  <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wide border-b border-slate-300 pb-1">
                    📚 Academic Details
                  </h4>
                  <p>
                    <strong className="text-slate-500">Enrolled Courses:</strong>
                    <span className="block font-bold text-slate-800 mt-0.5">
                      {viewingStudent.className}
                    </span>
                  </p>
                  <p>
                    <strong className="text-slate-500">Course Duration:</strong>
                    <span className="font-bold text-blue-600 ml-1">
                      {viewingStudent.courseDuration || "3 Months"}
                    </span>
                  </p>
                  <p>
                    <strong className="text-slate-500">Admission Date:</strong>
                    <span className="ml-1 text-slate-700 font-medium">
                      {viewingStudent.admissionDate
                        ? new Date(viewingStudent.admissionDate).toLocaleDateString()
                        : "-"}
                    </span>
                  </p>
                  <p>
                    <strong className="text-slate-500">Date of Birth:</strong>
                    <span className="ml-1 text-slate-700 font-medium">
                      {viewingStudent.dateOfBirth
                        ? new Date(viewingStudent.dateOfBirth).toLocaleDateString()
                        : "-"}
                    </span>
                  </p>
                </div>

                {/* Guardian & Contact Details */}
                <div className="p-4 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_rgb(163,177,198,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] space-y-2">
                  <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wide border-b border-slate-300 pb-1">
                    📞 Guardian & Contact
                  </h4>
                  <p>
                    <strong className="text-slate-500">Father / Guardian:</strong>
                    <span className="font-bold text-slate-800 ml-1">
                      {viewingStudent.parentName || "-"}
                    </span>
                  </p>
                  <p>
                    <strong className="text-slate-500">WhatsApp / Phone:</strong>
                    <span className="font-mono font-bold text-slate-800 ml-1">
                      {viewingStudent.parentWhatsApp ||
                        viewingStudent.parentPhone ||
                        "-"}
                    </span>
                  </p>
                  <p>
                    <strong className="text-slate-500">Student Phone:</strong>
                    <span className="font-mono font-bold text-slate-800 ml-1">
                      {viewingStudent.studentPhone || "Not Provided"}
                    </span>
                  </p>
                  <p>
                    <strong className="text-slate-500">Full Address:</strong>
                    <span className="block font-medium text-slate-700 mt-0.5">
                      {viewingStudent.address || "No address provided."}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-slate-300 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingStudent(null)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition active:scale-95"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          Add Student Modal
      ====================================================== */}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            className={`${neumorphicCard} w-full max-w-4xl bg-[#e0e5ec] max-h-[92vh] overflow-y-auto`}
          >
            <div className="flex justify-between items-center mb-5 border-b border-slate-300 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Add New Student - LocalPro1 Institute
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">
                  Upload ID card, select course details and student credentials.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
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

            <form onSubmit={handleAddStudent} className="space-y-4">
              
              {/* PHOTO & REQUIRED ID CARD UPLOAD */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Student Photo */}
                <div className="p-3 bg-[#e0e5ec] shadow-[inset_2px_2px_4px_rgb(163,177,198,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] rounded-xl flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-slate-300 shadow-inner shrink-0">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">👤</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                      Student Photo (Optional)
                    </label>
                    <label className="cursor-pointer inline-block px-3 py-1.5 bg-[#e0e5ec] shadow-[2px_2px_4px_rgb(163,177,198,0.6),-2px_-2px_4px_rgba(255,255,255,0.8)] text-slate-700 font-bold text-[11px] rounded-lg hover:text-blue-600 transition">
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {photoFile && (
                      <p className="text-[10px] text-emerald-600 font-semibold truncate max-w-[150px]">
                        ✓ {photoFile.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* ID CARD / CNIC (REQUIRED) */}
                <div className="p-3 bg-[#e0e5ec] shadow-[inset_2px_2px_4px_rgb(163,177,198,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] rounded-xl flex items-center gap-3 border border-blue-400/40">
                  <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-slate-300 shadow-inner shrink-0">
                    {idCardPreview ? (
                      <img
                        src={idCardPreview}
                        alt="ID Card"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">🪪</span>
                    )}
                  </div>

                  <div className="flex-1">
                    <label className="block text-[10px] font-black text-slate-800 uppercase mb-1">
                      ID Card / CNIC Copy <span className="text-rose-500">* (Required)</span>
                    </label>

                    <input
                      ref={idCardInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleIdCardChange}
                      className="hidden"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          idCardInputRef.current &&
                          idCardInputRef.current.click()
                        }
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg shadow-sm transition active:scale-95"
                      >
                        📁 Upload ID Card
                      </button>

                      <span className="text-[10px] font-semibold text-slate-500 truncate max-w-[120px]">
                        {idCardFileName ? idCardFileName : "Required"}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className={neumorphicInset}
                    placeholder="First name"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={neumorphicInset}
                    placeholder="Last name"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Admission No *
                  </label>
                  <input
                    type="text"
                    name="admissionNo"
                    value={formData.admissionNo}
                    onChange={handleInputChange}
                    required
                    className={neumorphicInset}
                    placeholder="ADM-001"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    CNIC / B-Form
                  </label>
                  <input
                    type="text"
                    name="cnic"
                    value={formData.cnic}
                    onChange={handleInputChange}
                    className={neumorphicInset}
                    placeholder="37405-XXXXXXX-X"
                  />
                </div>
              </div>

              {/* Gender, DOB, Admission Date, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={neumorphicInset}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className={neumorphicInset}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Admission Date
                  </label>
                  <input
                    type="date"
                    name="admissionDate"
                    value={formData.admissionDate}
                    onChange={handleInputChange}
                    className={neumorphicInset}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={neumorphicInset}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* COURSE DURATION SELECTION */}
              <div className="p-3 bg-[#e0e5ec] shadow-[inset_2px_2px_4px_rgb(163,177,198,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] rounded-xl">
                <label className="block text-[10px] font-black uppercase text-slate-700 mb-2">
                  Course Duration *
                </label>
                <div className="flex flex-wrap gap-4">
                  {durationOptions.map((dur) => (
                    <label
                      key={dur}
                      className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700"
                    >
                      <input
                        type="radio"
                        name="courseDuration"
                        value={dur}
                        checked={selectedDuration === dur}
                        onChange={() => setSelectedDuration(dur)}
                        className="w-4 h-4 accent-blue-600"
                      />
                      {dur}
                    </label>
                  ))}
                </div>
              </div>

              {/* ALL 23 COURSES SELECTION */}
              <div className="p-3 bg-[#e0e5ec] shadow-[inset_2px_2px_4px_rgb(163,177,198,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[11px] font-black uppercase text-slate-700">
                    Courses Details (Select Enrolled Courses) *
                  </label>
                  <span className="text-[10px] font-bold text-blue-600">
                    {selectedCourses.length} Selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {allCourses.map((course) => {
                    const isChecked = selectedCourses.includes(course);
                    return (
                      <label
                        key={course}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] font-bold cursor-pointer transition ${
                          isChecked
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-[#e0e5ec] text-slate-700 border-white/60 hover:bg-[#d6dbe5]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleCourseToggle(course)}
                          className="w-3.5 h-3.5 accent-blue-600 rounded"
                        />
                        <span className="truncate">{course}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Section, Roll No, Parents */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Section *
                  </label>
                  <input
                    type="text"
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    required
                    className={neumorphicInset}
                    placeholder="Morning / Evening"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    name="rollNumber"
                    value={formData.rollNumber}
                    onChange={handleInputChange}
                    className={neumorphicInset}
                    placeholder="101"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Father Name *
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleInputChange}
                    required
                    className={neumorphicInset}
                    placeholder="Father name"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    WhatsApp *
                  </label>
                  <input
                    type="text"
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleInputChange}
                    required
                    className={neumorphicInset}
                    placeholder="0300-1234567"
                  />
                </div>
              </div>

              {/* Student Phone & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Student Phone
                  </label>
                  <input
                    type="text"
                    name="studentPhone"
                    value={formData.studentPhone}
                    onChange={handleInputChange}
                    className={neumorphicInset}
                    placeholder="0300-7654321"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Full Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={neumorphicInset}
                    placeholder="House #, Street, City"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-300">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="px-6 py-2 bg-[#e0e5ec] shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.8)] text-slate-600 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-7 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition disabled:opacity-50"
                >
                  {saving ? "Saving Student..." : "Save Full Student"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentList;