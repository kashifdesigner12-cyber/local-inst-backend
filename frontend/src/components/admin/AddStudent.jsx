import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiCall } from "../../services/api";

function AddStudent() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [idCardFileName, setIdCardFileName] = useState("");

  // Saare 23 courses
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

  const durationOptions = [
    "2 Months",
    "3 Months",
    "6 Months",
    "1 Year",
  ];

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
    idCardPhoto: "",
    address: "",
    photo: "",
  });

  const neumorphicCard =
    "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-2xl p-6 border border-white/50";

  const neumorphicInput =
    "bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] rounded-xl px-4 py-3 outline-none text-slate-800 placeholder-slate-400 font-medium border border-transparent w-full text-xs transition-all focus:border-blue-400";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const handleCourseToggle = (course) => {
    if (selectedCourses.includes(course)) {
      if (selectedCourses.length === 1) {
        setError("Kam se kam ek course select hona zaroori hai");
        return;
      }
      setSelectedCourses(selectedCourses.filter((c) => c !== course));
    } else {
      setSelectedCourses([...selectedCourses, course]);
    }
  };

  const handleIdCardUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG).");
      return;
    }

    setIdCardFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        idCardPhoto: reader.result,
      }));
      if (error) setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // -------------------------------------------------------------
    // Required Fields Validation Only:
    // First Name, Last Name, CNIC / B-Form, Enrolled Courses
    // -------------------------------------------------------------
    if (!formData.firstName.trim()) {
      setError("First Name is required.");
      return;
    }

    if (!formData.lastName.trim()) {
      setError("Last Name is required.");
      return;
    }

    if (!formData.cnic.trim()) {
      setError("CNIC / B-Form Number is required.");
      return;
    }

    if (selectedCourses.length === 0) {
      setError("Kam se kam ek course zaroor select karein.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Session expired. Dobara login karein.");
        navigate("/login");
        return;
      }

      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      const studentPayload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        name: fullName,
        cnic: formData.cnic.trim(),
        courses: selectedCourses,
        className: selectedCourses.join(", "),
        courseDuration: selectedDuration,
        admissionNo: formData.admissionNo.trim(),
        section: formData.section.trim(),
        rollNo: formData.rollNumber.trim(),
        gender: formData.gender,
        status: formData.status,
        parentName: formData.fatherName.trim(),
        parentPhone: formData.parentPhone.trim(),
        parentWhatsApp: formData.parentPhone.trim(),
        studentPhone: formData.studentPhone.trim(),
        idCardPhoto: formData.idCardPhoto,
        dateOfBirth: formData.dob || undefined,
        address: formData.address.trim(),
        admissionDate: formData.admissionDate || undefined,
        photo: formData.photo.trim(),
      };

      const result = await apiCall("/students", "POST", studentPayload);

      if (!result.success) {
        setError(result.message || "Failed to save student.");
        return;
      }

      setSuccess("Student successfully create ho gaya!");
      setTimeout(() => {
        navigate("/admin/students");
      }, 1000);
    } catch (err) {
      setError(err.message || "Connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-[#e0e5ec] min-h-screen font-sans text-slate-700 space-y-6">
      {/* Header */}
      <div className="bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] p-5 rounded-2xl flex justify-between items-center border border-white/50">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-wide">
            Add New Student - LocalPro1
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Student details enter karein aur courses select karein.
          </p>
        </div>

        <button
          onClick={() => navigate("/admin/students")}
          className="px-4 py-2 bg-[#e0e5ec] shadow-[4px_4px_8px_rgb(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.8)] text-slate-700 font-bold text-xs rounded-xl hover:text-blue-600 transition-all"
        >
          ← Back to Students
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-100 border border-rose-300 text-rose-700 rounded-2xl text-xs font-bold text-center">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-700 rounded-2xl text-xs font-bold text-center">
          ✅ {success}
        </div>
      )}

      <div className={neumorphicCard}>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* UPLOAD ID CARD (OPTIONAL) */}
          <div className="p-5 bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.8)] rounded-2xl border border-white/40">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white shadow-inner flex items-center justify-center text-3xl overflow-hidden border border-slate-300 shrink-0">
                  {formData.idCardPhoto ? (
                    <img src={formData.idCardPhoto} alt="CNIC" className="w-full h-full object-cover" />
                  ) : (
                    "🪪"
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                    Student ID Card / CNIC Copy (Optional)
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    {idCardFileName ? `Selected: ${idCardFileName}` : "Agar available ho to ID Card attach karein (optional)."}
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleIdCardUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="px-6 py-3.5 bg-slate-700 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 shrink-0"
              >
                📁 UPLOAD ID CARD
              </button>
            </div>
          </div>

          {/* Basic Info: First Name, Last Name, CNIC/B-Form, Admission No */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1.5">First Name *</label>
              <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} placeholder="Ali" className={neumorphicInput} />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1.5">Last Name *</label>
              <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} placeholder="Khan" className={neumorphicInput} />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1.5">CNIC / B-Form Number *</label>
              <input type="text" name="cnic" required value={formData.cnic} onChange={handleChange} placeholder="37405-XXXXXXX-X" className={neumorphicInput} />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1.5">Admission No (Optional)</label>
              <input type="text" name="admissionNo" value={formData.admissionNo} onChange={handleChange} placeholder="Auto-generated if empty" className={neumorphicInput} />
            </div>
          </div>

          {/* ALL 23 COURSES CHECKBOXES (MANDATORY) */}
          <div className="p-4 bg-[#e0e5ec] shadow-[inset_2px_2px_5px_rgb(163,177,198,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] rounded-xl border border-blue-400/40">
            <div className="flex justify-between items-center mb-3">
              <label className="text-[12px] font-black uppercase text-slate-800">
                Courses Details (Select Enrolled Courses) *
              </label>
              <span className="text-[11px] font-bold text-blue-600">
                {selectedCourses.length} Selected
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {allCourses.map((course) => {
                const isChecked = selectedCourses.includes(course);
                return (
                  <label
                    key={course}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${
                      isChecked
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                        : "bg-[#e0e5ec] text-slate-700 border-white/50 hover:bg-[#d8dfe8]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCourseToggle(course)}
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <span className="truncate">{course}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* COURSE DURATION (OPTIONAL) */}
          <div className="p-4 bg-[#e0e5ec] shadow-[inset_2px_2px_5px_rgb(163,177,198,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] rounded-xl">
            <label className="block text-[11px] font-black uppercase text-slate-800 mb-2">
              Course Duration (Optional)
            </label>
            <div className="flex flex-wrap gap-4">
              {durationOptions.map((dur) => (
                <label key={dur} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
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

          {/* Gender & Dates (Optional) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1.5">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className={neumorphicInput}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1.5">Date of Birth</label>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={neumorphicInput} />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1.5">Admission Date</label>
              <input type="date" name="admissionDate" value={formData.admissionDate} onChange={handleChange} className={neumorphicInput} />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1.5">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className={neumorphicInput}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Section & Roll No (Optional) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1.5">Section / Timing</label>
              <input type="text" name="section" value={formData.section} onChange={handleChange} placeholder="Morning / Evening" className={neumorphicInput} />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1.5">Roll Number</label>
              <input type="text" name="rollNumber" value={formData.rollNumber} onChange={handleChange} placeholder="101" className={neumorphicInput} />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1.5">Father / Guardian Name</label>
              <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} placeholder="Muhammad Ahmed" className={neumorphicInput} />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1.5">Parent Phone / WhatsApp</label>
              <input type="text" name="parentPhone" value={formData.parentPhone} onChange={handleChange} placeholder="0300-1234567" className={neumorphicInput} />
            </div>
          </div>

          {/* Student Phone & Address (Optional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1.5">Student Phone</label>
              <input type="text" name="studentPhone" value={formData.studentPhone} onChange={handleChange} placeholder="0300-7654321" className={neumorphicInput} />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1.5">Full Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="House #123, Street #4, City" className={neumorphicInput} />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-sm shadow-xl shadow-blue-500/30 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? "Saving Student Profile..." : "SAVE STUDENT PROFILE"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddStudent;
