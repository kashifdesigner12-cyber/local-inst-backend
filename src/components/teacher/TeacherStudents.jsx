import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiCall } from "../../services/api";

function TeacherStudents() {
  const today = new Date()
    .toISOString()
    .split("T")[0];

  const emptyForm = {
    name: "",
    admissionNo: "",
    className: "",
    section: "",
    rollNo: "",
    gender: "MALE",
    parentName: "",
    parentPhone: "",
    parentWhatsApp: "",
    parentEmail: "",
    dateOfBirth: "",
    address: "",
    admissionDate: today,
    status: "ACTIVE",
  };

  const [students, setStudents] = useState([]);

  const [showModal, setShowModal] =
    useState(false);

  const [formData, setFormData] =
    useState(emptyForm);

  const [photoFile, setPhotoFile] =
    useState(null);

  const [photoPreview, setPhotoPreview] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [classFilter, setClassFilter] =
    useState("ALL");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [errorMsg, setErrorMsg] =
    useState("");

  const [successMsg, setSuccessMsg] =
    useState("");

  const neumorphicCard =
    "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-2xl p-6 border border-white/50";

  const neumorphicInset =
    "bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] rounded-xl px-4 py-2.5 border border-white/20 outline-none text-slate-700 font-medium text-xs w-full";

  const loadStudents = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const result = await apiCall(
        "/students?limit=100",
        "GET"
      );

      console.log(
        "Teacher students response:",
        result
      );

      if (!result.success) {
        setErrorMsg(
          result.message ||
            "Failed to load students."
        );
        return;
      }

      setStudents(
        result.data?.data?.students || []
      );
    } catch (error) {
      console.error(
        "Load teacher students error:",
        error
      );

      setErrorMsg(
        error.message ||
          "Unable to load students."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const classOptions = useMemo(() => {
    const classes = students
      .map((student) => student.className)
      .filter(Boolean);

    return [...new Set(classes)].sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const name =
        student.name || "";

      const admissionNo =
        student.admissionNo || "";

      const className =
        student.className || "";

      const section =
        student.section || "";

      const matchesSearch =
        !search ||
        name.toLowerCase().includes(search) ||
        admissionNo
          .toLowerCase()
          .includes(search) ||
        className
          .toLowerCase()
          .includes(search) ||
        section
          .toLowerCase()
          .includes(search);

      const matchesClass =
        classFilter === "ALL" ||
        className === classFilter;

      return (
        matchesSearch &&
        matchesClass
      );
    });
  }, [
    students,
    searchTerm,
    classFilter,
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(
        "Photo must be less than 5 MB."
      );
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrorMsg(
        "Only JPG, JPEG, PNG or WEBP images are allowed."
      );
      return;
    }

    setErrorMsg("");
    setPhotoFile(file);

    const reader = new FileReader();

    reader.onload = () => {
      setPhotoPreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setFormData({
      ...emptyForm,
      admissionDate: today,
    });

    setPhotoFile(null);
    setPhotoPreview("");
  };

  const openModal = () => {
    setErrorMsg("");
    setSuccessMsg("");
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setErrorMsg("");
    resetForm();
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();

    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.name.trim()) {
      setErrorMsg(
        "Student name is required."
      );
      return;
    }

    if (!formData.admissionNo.trim()) {
      setErrorMsg(
        "Admission number is required."
      );
      return;
    }

    if (!formData.className.trim()) {
      setErrorMsg(
        "Class is required."
      );
      return;
    }

    if (!formData.section.trim()) {
      setErrorMsg(
        "Section is required."
      );
      return;
    }

    if (!formData.parentName.trim()) {
      setErrorMsg(
        "Parent name is required."
      );
      return;
    }

    if (!formData.parentWhatsApp.trim()) {
      setErrorMsg(
        "Parent WhatsApp number is required."
      );
      return;
    }

    const payload = new FormData();

    payload.append(
      "name",
      formData.name.trim()
    );

    payload.append(
      "admissionNo",
      formData.admissionNo.trim()
    );

    payload.append(
      "className",
      formData.className.trim()
    );

    payload.append(
      "section",
      formData.section.trim()
    );

    if (formData.rollNo.trim()) {
      payload.append(
        "rollNo",
        formData.rollNo.trim()
      );
    }

    payload.append(
      "gender",
      formData.gender
    );

    payload.append(
      "status",
      formData.status
    );

    payload.append(
      "parentName",
      formData.parentName.trim()
    );

    if (formData.parentPhone.trim()) {
      payload.append(
        "parentPhone",
        formData.parentPhone.trim()
      );
    }

    payload.append(
      "parentWhatsApp",
      formData.parentWhatsApp.trim()
    );

    if (formData.parentEmail.trim()) {
      payload.append(
        "parentEmail",
        formData.parentEmail.trim()
      );
    }

    if (formData.dateOfBirth) {
      payload.append(
        "dateOfBirth",
        formData.dateOfBirth
      );
    }

    if (formData.address.trim()) {
      payload.append(
        "address",
        formData.address.trim()
      );
    }

    if (formData.admissionDate) {
      payload.append(
        "admissionDate",
        formData.admissionDate
      );
    }

    if (photoFile) {
      payload.append(
        "photo",
        photoFile
      );
    }

    setSaving(true);

    try {
      const result = await apiCall(
        "/students",
        "POST",
        payload
      );

      console.log(
        "Teacher student POST response:",
        result
      );

      if (!result.success) {
        setErrorMsg(
          result.message ||
            "Failed to add student."
        );
        return;
      }

      const newStudent =
        result.data?.data?.student;

      if (newStudent) {
        setStudents((prev) => [
          newStudent,
          ...prev,
        ]);
      } else {
        await loadStudents();
      }

      setShowModal(false);
      resetForm();

      setSuccessMsg(
        "Student added successfully."
      );

      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    } catch (error) {
      console.error(
        "Add teacher student error:",
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
            Students
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            View students and add new students.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadStudents}
            className="bg-[#e0e5ec] text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md hover:text-blue-600 active:scale-95 transition"
          >
            ↻ Refresh
          </button>

          <button
            onClick={openModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md active:scale-95 transition"
          >
            + Add Student
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

      {/* Filters */}
      <div
        className={`${neumorphicCard} mb-6 flex flex-col md:flex-row gap-4`}
      >
        <input
          type="text"
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(e.target.value)
          }
          placeholder="Search student name, admission no, class..."
          className={neumorphicInset}
        />

        <select
          value={classFilter}
          onChange={(e) =>
            setClassFilter(e.target.value)
          }
          className={`${neumorphicInset} md:max-w-xs`}
        >
          <option value="ALL">
            All Classes
          </option>

          {classOptions.map((className) => (
            <option
              key={className}
              value={className}
            >
              {className}
            </option>
          ))}
        </select>
      </div>

      {/* Students */}
      <div className={neumorphicCard}>

        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Student Records
            </h3>

            <p className="text-[10px] text-slate-400 mt-1">
              {filteredStudents.length} student(s) found
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400">
            Loading students...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">

              <thead>
                <tr className="border-b border-slate-300 text-slate-500 uppercase">
                  <th className="pb-3 pr-4">
                    Student
                  </th>

                  <th className="pb-3 pr-4">
                    Admission No
                  </th>

                  <th className="pb-3 pr-4">
                    Class
                  </th>

                  <th className="pb-3 pr-4">
                    Section
                  </th>

                  <th className="pb-3 pr-4">
                    Roll No
                  </th>

                  <th className="pb-3 pr-4">
                    Parent
                  </th>

                  <th className="pb-3">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">

                {filteredStudents.length > 0 ? (
                  filteredStudents.map(
                    (student) => (
                      <tr
                        key={student._id}
                        className="hover:bg-white/40 transition"
                      >

                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">

                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#e0e5ec] shadow-[inset_2px_2px_4px_rgb(163,177,198,0.5)] flex items-center justify-center">

                              {student.photo ? (
                                <img
                                  src={
                                    student.photo.startsWith(
                                      "http"
                                    )
                                      ? student.photo
                                      : `https://apinstitute.localpro1.net${student.photo}`
                                  }
                                  alt={student.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>
                                  👤
                                </span>
                              )}

                            </div>

                            <div>
                              <p className="font-bold text-slate-800">
                                {student.name}
                              </p>

                              <p className="text-[9px] text-slate-400">
                                {student.gender || "-"}
                              </p>
                            </div>

                          </div>
                        </td>

                        <td className="py-3 pr-4 font-bold text-slate-700">
                          {student.admissionNo || "-"}
                        </td>

                        <td className="py-3 pr-4">
                          {student.className || "-"}
                        </td>

                        <td className="py-3 pr-4">
                          {student.section || "-"}
                        </td>

                        <td className="py-3 pr-4">
                          {student.rollNo || "-"}
                        </td>

                        <td className="py-3 pr-4">
                          <p className="font-bold">
                            {student.parentName || "-"}
                          </p>

                          <p className="text-[9px] text-slate-400">
                            {student.parentWhatsApp || "-"}
                          </p>
                        </td>

                        <td className="py-3">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                              student.status ===
                              "ACTIVE"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {student.status || "-"}
                          </span>
                        </td>

                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-10 text-slate-500"
                    >
                      No students found in database.
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= ADD STUDENT MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">

          <div
            className={`${neumorphicCard} w-full max-w-4xl bg-[#e0e5ec] max-h-[92vh] overflow-y-auto`}
          >

            {/* Modal Header */}
            <div className="flex justify-between items-center mb-5 border-b border-slate-300 pb-3">

              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Add New Student
                </h3>

                <p className="text-[10px] text-slate-500 mt-1">
                  Student will be saved to the backend database.
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
              onSubmit={handleAddStudent}
              className="space-y-5"
            >

              {/* Photo */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                  Student Photo
                </label>

                <div className="flex items-center gap-4">

                  <div className="w-20 h-20 rounded-2xl bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.8)] flex items-center justify-center overflow-hidden">

                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Student preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">
                        👤
                      </span>
                    )}

                  </div>

                  <div>
                    <label className="cursor-pointer inline-block px-4 py-2.5 bg-[#e0e5ec] shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.8)] hover:text-blue-600 text-slate-700 font-bold text-xs rounded-xl transition">
                      📤 Upload Image

                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>

                    <p className="text-[10px] text-slate-400 mt-2">
                      JPG, JPEG, PNG or WEBP • Maximum 5 MB
                    </p>
                  </div>

                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                    Student Name *
                  </label>

                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={neumorphicInset}
                    placeholder="Student full name"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                    Admission No *
                  </label>

                  <input
                    name="admissionNo"
                    value={formData.admissionNo}
                    onChange={handleInputChange}
                    className={neumorphicInset}
                    placeholder="ADM-001"
                  />
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
                    Section *
                  </label>

                  <input
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    className={neumorphicInset}
                    placeholder="A"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                    Roll No
                  </label>

                  <input
                    name="rollNo"
                    value={formData.rollNo}
                    onChange={handleInputChange}
                    className={neumorphicInset}
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                    Gender
                  </label>

                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={neumorphicInset}
                  >
                    <option value="MALE">
                      Male
                    </option>

                    <option value="FEMALE">
                      Female
                    </option>

                    <option value="OTHER">
                      Other
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                    Date of Birth
                  </label>

                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className={neumorphicInset}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
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

              </div>

              {/* Parent */}
              <div className="border-t border-slate-300 pt-5">

                <h4 className="text-xs font-black text-slate-800 mb-4">
                  Parent Information
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                      Parent Name *
                    </label>

                    <input
                      name="parentName"
                      value={formData.parentName}
                      onChange={handleInputChange}
                      className={neumorphicInset}
                      placeholder="Father / Mother / Guardian"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                      Parent WhatsApp *
                    </label>

                    <input
                      name="parentWhatsApp"
                      value={formData.parentWhatsApp}
                      onChange={handleInputChange}
                      className={neumorphicInset}
                      placeholder="923001234567"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                      Parent Phone
                    </label>

                    <input
                      name="parentPhone"
                      value={formData.parentPhone}
                      onChange={handleInputChange}
                      className={neumorphicInset}
                      placeholder="03001234567"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                      Parent Email
                    </label>

                    <input
                      type="email"
                      name="parentEmail"
                      value={formData.parentEmail}
                      onChange={handleInputChange}
                      className={neumorphicInset}
                      placeholder="parent@example.com"
                    />
                  </div>

                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                  Address
                </label>

                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="3"
                  className={`${neumorphicInset} resize-none`}
                  placeholder="Student address"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-300 pt-5">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#e0e5ec] text-slate-600 font-bold text-xs shadow-md active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md active:scale-95 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Student"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default TeacherStudents;