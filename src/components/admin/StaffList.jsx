import React, { useEffect, useState } from "react";
import { apiCall } from "../../services/api";

function StaffList() {
  // 'list' = staff table
  // 'add' = add/edit form
  const [viewMode, setViewMode] = useState("list");

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [editingStaff, setEditingStaff] = useState(null);

  // =========================================================
  // FORM STATE
  // =========================================================

  const emptyForm = {
    name: "",
    lastName: "",
    role: "Teacher",
    phone: "",
    email: "",
    joiningDate: "",
    employeeId: "",
    department: "",
    qualification: "",
    salary: "",
    cnic: "",
    bankAccount: "",
    status: "Active",
  };

  const [staffForm, setStaffForm] = useState(emptyForm);

  // =========================================================
  // NEUMORPHIC STYLING
  // =========================================================

  const neumorphicCard =
    "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-2xl p-6 border border-white/50";

  const neumorphicInset =
    "bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] rounded-xl px-4 py-2 border border-white/20 outline-none text-slate-700 font-medium";

  const neumorphicInput =
    "bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] rounded-xl px-4 py-3 outline-none text-slate-900 placeholder-slate-500 font-medium border border-transparent w-full text-xs";

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setStaffForm(emptyForm);
    setEditingStaff(null);
  };

  // =========================================================
  // LOAD STAFF FROM BACKEND
  // GET /api/staff
  // =========================================================

  const fetchStaff = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const token =
        localStorage.getItem("adminToken") ||
        localStorage.getItem("teacherToken");

      if (!token) {
        setErrorMsg("Please login first.");
        return;
      }

      console.log("Loading staff from backend...");

      const result = await apiCall("/staff", "GET");

      console.log("Staff GET response:", result);

      if (!result.success) {
        setErrorMsg(result.message || "Failed to load staff members.");
        return;
      }

      /*
                Backend response:

                {
                    success: true,
                    data: {
                        staff: [...]
                    }
                }

                apiCall returns:

                {
                    success: true,
                    data: backendResponse
                }
            */

      const staffData = result.data?.data?.staff || [];

      setStaffList(staffData);

      console.log(`${staffData.length} staff members loaded.`);
    } catch (error) {
      console.error("Backend connection error:", error);

      setErrorMsg(error.message || "Unable to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  // Load staff when page opens
  useEffect(() => {
    fetchStaff();
  }, []);

  // =========================================================
  // FORM INPUT CHANGE
  // =========================================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setStaffForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // OPEN ADD FORM
  // =========================================================

  const handleOpenAddForm = () => {
    resetForm();

    setErrorMsg("");
    setSuccessMsg("");

    setViewMode("add");
  };

  // =========================================================
  // BACK TO LIST
  // =========================================================

  const handleBackToList = () => {
    if (saving) return;

    resetForm();

    setErrorMsg("");
    setSuccessMsg("");

    setViewMode("list");
  };

  // =========================================================
  // FORMAT DATE FOR INPUT
  // =========================================================

  const formatDateForInput = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    try {
      const date = new Date(dateValue);

      if (Number.isNaN(date.getTime())) {
        return "";
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");

      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  // =========================================================
  // EDIT STAFF
  // GET DATA FROM BACKEND AND PUT INTO FORM
  // =========================================================

  const handleEditStaff = (staff) => {
    setErrorMsg("");
    setSuccessMsg("");

    setEditingStaff(staff);

    /*
            Backend stores:

            name
            designation
            department
            etc.

            UI has:

            first name
            last name
            role

            So backend values are converted back to UI fields.
        */

    const fullName = staff.name || "";

    const nameParts = fullName.trim().split(/\s+/);

    const firstName = nameParts.shift() || "";

    const lastName = nameParts.join(" ");

    setStaffForm({
      name: firstName,

      lastName,

      role: staff.designation || "Teacher",

      phone: staff.phone || "",

      email: staff.email || "",

      joiningDate: formatDateForInput(staff.joiningDate),

      /*
                Employee ID is NOT present in backend Staff model.
                Keep empty when editing.
            */
      employeeId: staff.employeeId || "",

      department: staff.department || "",

      /*
                Qualification is not currently
                present in backend model.
            */
      qualification: staff.qualification || "",

      salary:
        staff.salary !== undefined && staff.salary !== null
          ? String(staff.salary)
          : "",

      /*
                These are not currently
                present in backend model.
            */
      cnic: staff.cnic || "",

      bankAccount: staff.bankAccount || "",

      status: staff.status === "INACTIVE" ? "Inactive" : "Active",
    });

    setViewMode("add");
  };

  // =========================================================
  // CREATE / UPDATE STAFF
  // POST /api/staff
  // PUT  /api/staff/:id
  // =========================================================

  const handleStaffSubmit = async (e) => {
    e.preventDefault();

    setErrorMsg("");
    setSuccessMsg("");

    const token = localStorage.getItem("adminToken");

    if (!token) {
      setErrorMsg("Please login first.");
      return;
    }

    // Combine first + last name
    const fullName = `${staffForm.name} ${staffForm.lastName}`
      .trim()
      .replace(/\s+/g, " ");

    // =====================================================
    // FRONTEND VALIDATION
    // Backend requires:
    // name
    // email
    // phone
    // designation
    // department
    // =====================================================

    if (!fullName) {
      setErrorMsg("Please enter staff name.");
      return;
    }

    if (!staffForm.email.trim()) {
      setErrorMsg("Please enter email address.");
      return;
    }

    if (!staffForm.phone.trim()) {
      setErrorMsg("Please enter phone number.");
      return;
    }

    if (!staffForm.role.trim()) {
      setErrorMsg("Please enter role/designation.");
      return;
    }

    if (!staffForm.department.trim()) {
      setErrorMsg("Please enter department.");
      return;
    }

    // =====================================================
    // BACKEND PAYLOAD
    // =====================================================

    const staffPayload = {
      name: fullName,

      email: staffForm.email.trim(),

      phone: staffForm.phone.trim(),

      /*
                UI "Role" maps to backend "designation"
            */
      designation: staffForm.role.trim(),

      department: staffForm.department.trim(),

      salary: staffForm.salary === "" ? 0 : Number(staffForm.salary),

      joiningDate: staffForm.joiningDate || undefined,

      /*
                Backend expects:
                ACTIVE / INACTIVE
            */
      status: staffForm.status.toUpperCase(),

      /*
                Photo not available in this UI.
                Keep empty.
            */
      photo: "",
    };

    console.log("Sending staff to backend:", staffPayload);

    setSaving(true);

    try {
      let result;

      // =================================================
      // ADD STAFF
      // =================================================

      if (!editingStaff) {
        result = await apiCall("/staff", "POST", staffPayload);

        console.log("Staff POST response:", result);

        if (!result.success) {
          setErrorMsg(result.message || "Failed to add staff member.");
          return;
        }

        /*
                    Backend returns:

                    data: {
                        staff: {...}
                    }
                */

        const newStaff = result.data?.data?.staff;

        if (newStaff) {
          setStaffList((prev) => [newStaff, ...prev]);
        } else {
          await fetchStaff();
        }

        setSuccessMsg("Staff member added successfully!");
      }

      // =================================================
      // UPDATE STAFF
      // =================================================
      else {
        result = await apiCall(
          `/staff/${editingStaff._id}`,
          "PUT",
          staffPayload,
        );

        console.log("Staff PUT response:", result);

        if (!result.success) {
          setErrorMsg(result.message || "Failed to update staff member.");
          return;
        }

        const updatedStaff = result.data?.data?.staff;

        if (updatedStaff) {
          setStaffList((prev) =>
            prev.map((item) =>
              item._id === updatedStaff._id ? updatedStaff : item,
            ),
          );
        } else {
          await fetchStaff();
        }

        setSuccessMsg("Staff member updated successfully!");
      }

      // =================================================
      // RESET / LIST
      // =================================================

      resetForm();

      setViewMode("list");

      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    } catch (error) {
      console.error("Staff save error:", error);

      setErrorMsg(error.message || "Unable to connect to backend.");
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE STAFF
  // DELETE /api/staff/:id
  // =========================================================

  const handleDeleteStaff = async (staff) => {
    if (!staff?._id) {
      setErrorMsg("Invalid staff ID.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${staff.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    setDeletingId(staff._id);

    try {
      const result = await apiCall(`/staff/${staff._id}`, "DELETE");

      console.log("Staff DELETE response:", result);

      if (!result.success) {
        setErrorMsg(result.message || "Failed to delete staff member.");
        return;
      }

      // Remove from current UI immediately
      setStaffList((prev) => prev.filter((item) => item._id !== staff._id));

      setSuccessMsg("Staff member deleted successfully!");

      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    } catch (error) {
      console.error("Delete staff error:", error);

      setErrorMsg(error.message || "Unable to connect to backend.");
    } finally {
      setDeletingId("");
    }
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredStaff = staffList.filter((staff) => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) {
      return true;
    }

    return (
      staff.name?.toLowerCase().includes(search) ||
      staff.email?.toLowerCase().includes(search) ||
      staff.phone?.toLowerCase().includes(search) ||
      staff.designation?.toLowerCase().includes(search) ||
      staff.department?.toLowerCase().includes(search)
    );
  });

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-[#e0e5ec]">
        <p className="text-slate-500 font-semibold animate-pulse">
          Loading Staff Directory...
        </p>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="p-6 bg-[#e0e5ec] min-h-screen font-sans text-slate-700">
      {/* =================================================
                LIST VIEW
            ================================================= */}

      {viewMode === "list" ? (
        <>
          {/* Search & Add Staff Bar */}

          <div
            className={`${neumorphicCard} mb-6 flex flex-col md:flex-row justify-between items-center gap-4`}
          >
            <div className="w-full md:w-1/2">
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${neumorphicInset} text-xs`}
              />
            </div>

            <div>
              <button
                onClick={handleOpenAddForm}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md active:scale-95 transition text-center"
              >
                + Add Staff
              </button>
            </div>
          </div>

          {/* Success Message */}

          {successMsg && (
            <div className="mb-6 p-3 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold text-center">
              ✅ {successMsg}
            </div>
          )}

          {/* Error Message */}

          {errorMsg && (
            <div className="mb-6 p-3 bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold text-center">
              ❌ {errorMsg}
            </div>
          )}

          {/* Staff Table Section */}

          <div className={neumorphicCard}>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Staff</h3>

            <p className="text-xs text-slate-400 mb-4">
              {filteredStaff.length} staff members found
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-xs text-slate-500 uppercase">
                    <th className="pb-3 font-bold">#</th>

                    <th className="pb-3 font-bold">Photo</th>

                    <th className="pb-3 font-bold">Name</th>

                    <th className="pb-3 font-bold">Role</th>

                    <th className="pb-3 font-bold">Employee ID</th>

                    <th className="pb-3 font-bold">Phone</th>

                    <th className="pb-3 font-bold">Department</th>

                    <th className="pb-3 font-bold">Salary</th>

                    <th className="pb-3 font-bold">Status</th>

                    <th className="pb-3 font-bold text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="text-xs divide-y divide-slate-200">
                  {filteredStaff.length > 0 ? (
                    filteredStaff.map((st, index) => {
                      const status = st.status || "ACTIVE";

                      const statusLabel =
                        status === "INACTIVE" ? "Inactive" : "Active";

                      return (
                        <tr
                          key={st._id || index}
                          className="hover:bg-white/40 transition-colors"
                        >
                          {/* # */}

                          <td className="py-3 text-slate-500 font-bold">
                            {index + 1}
                          </td>

                          {/* Photo */}

                          <td className="py-3">
                            <div className="w-8 h-8 rounded-full bg-[#e0e5ec] shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.8)] flex items-center justify-center font-bold text-slate-600 text-[10px] overflow-hidden">
                              {st.photo ? (
                                <img
                                  src={st.photo}
                                  alt={st.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : st.name ? (
                                st.name.charAt(0).toUpperCase()
                              ) : (
                                "S"
                              )}
                            </div>
                          </td>

                          {/* Name */}

                          <td className="py-3 font-black text-slate-800">
                            {st.name || "N/A"}
                          </td>

                          {/* Role */}

                          <td className="py-3 text-slate-600">
                            {st.designation || "Teacher"}
                          </td>

                          {/* Employee ID */}

                          <td className="py-3 text-slate-600 font-mono">
                            {st.employeeId || "N/A"}
                          </td>

                          {/* Phone */}

                          <td className="py-3 text-slate-600">
                            {st.phone || "N/A"}
                          </td>

                          {/* Department */}

                          <td className="py-3 text-slate-600">
                            {st.department || "Academics"}
                          </td>

                          {/* Salary */}

                          <td className="py-3 text-slate-600 font-mono">
                            {st.salary !== undefined ? st.salary : "0.00"}
                          </td>

                          {/* Status */}

                          <td className="py-3">
                            <span
                              className={`px-3 py-1 rounded-xl font-bold text-[10px] ${
                                status === "INACTIVE"
                                  ? "text-rose-600"
                                  : "text-emerald-600"
                              } bg-[#e0e5ec] shadow-[inset_2px_2px_4px_rgb(163,177,198,0.6),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]`}
                            >
                              {statusLabel}
                            </span>
                          </td>

                          {/* Actions */}

                          <td className="py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditStaff(st)}
                                disabled={deletingId === st._id}
                                className="bg-[#e0e5ec] shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.5)] text-blue-600 px-3 py-1.5 rounded-xl font-bold text-[11px] active:scale-95 transition hover:text-blue-800 disabled:opacity-50"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => handleDeleteStaff(st)}
                                disabled={deletingId === st._id}
                                className="bg-[#e0e5ec] shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.5)] text-rose-600 px-3 py-1.5 rounded-xl font-bold text-[11px] active:scale-95 transition hover:text-rose-800 disabled:opacity-50"
                              >
                                {deletingId === st._id
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
                        className="text-center py-12 text-slate-500 font-medium"
                      >
                        No staff members found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}

            <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-300/50 text-xs text-slate-500">
              <span>
                Showing 1 to {filteredStaff.length} of {staffList.length}{" "}
                results
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled
                  className="px-3 py-1 bg-[#e0e5ec] shadow-[2px_2px_4px_rgb(163,177,198,0.6),-2px_-2px_4px_rgba(255,255,255,0.5)] rounded-lg font-bold disabled:opacity-50"
                >
                  «
                </button>

                <span className="px-3 py-1 bg-[#e0e5ec] shadow-[inset_2px_2px_4px_rgb(163,177,198,0.6),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] rounded-lg font-bold text-blue-600">
                  Page 1 of 1
                </span>

                <button
                  disabled
                  className="px-3 py-1 bg-[#e0e5ec] shadow-[2px_2px_4px_rgb(163,177,198,0.6),-2px_-2px_4px_rgba(255,255,255,0.5)] rounded-lg font-bold disabled:opacity-50"
                >
                  »
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* =================================================
                   ADD / EDIT STAFF FORM
                ================================================= */

        <div className={neumorphicCard}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
              </h2>

              <p className="text-xs font-semibold text-slate-600">
                Enter complete professional & personal details.
              </p>
            </div>

            <button
              onClick={handleBackToList}
              disabled={saving}
              className="px-4 py-2 bg-slate-300 text-slate-800 rounded-xl text-xs font-bold shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.5)] hover:bg-slate-400 transition disabled:opacity-50"
            >
              ← Back to Staff List
            </button>
          </div>

          {/* Form Error */}

          {errorMsg && (
            <div className="mb-5 p-3 bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold text-center">
              ❌ {errorMsg}
            </div>
          )}

          <form onSubmit={handleStaffSubmit} className="space-y-4">
            {/* Row 1 */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-800 uppercase mb-1">
                  First Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={staffForm.name}
                  onChange={handleInputChange}
                  required
                  className={neumorphicInput}
                  placeholder="Muhammad"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-800 uppercase mb-1">
                  Last Name
                </label>

                <input
                  type="text"
                  name="lastName"
                  value={staffForm.lastName}
                  onChange={handleInputChange}
                  required
                  className={neumorphicInput}
                  placeholder="Akram"
                />
              </div>
            </div>

            {/* Row 2 */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-800 uppercase mb-1">
                  Role
                </label>

                <input
                  type="text"
                  name="role"
                  value={staffForm.role}
                  onChange={handleInputChange}
                  required
                  className={neumorphicInput}
                  placeholder="Teacher"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-800 uppercase mb-1">
                  Phone / WhatsApp
                </label>

                <input
                  type="text"
                  name="phone"
                  value={staffForm.phone}
                  onChange={handleInputChange}
                  required
                  className={neumorphicInput}
                  placeholder="03XX-XXXXXXX"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-800 uppercase mb-1">
                  Email Address
                </label>

                <input
                  type="email"
                  name="email"
                  value={staffForm.email}
                  onChange={handleInputChange}
                  required
                  className={neumorphicInput}
                  placeholder="staff@school.com"
                />
              </div>
            </div>

            {/* Row 3 */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-800 uppercase mb-1">
                  Joining Date
                </label>

                <input
                  type="date"
                  name="joiningDate"
                  value={staffForm.joiningDate}
                  onChange={handleInputChange}
                  required
                  className={neumorphicInput}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-800 uppercase mb-1">
                  Employee ID
                </label>

                <input
                  type="text"
                  name="employeeId"
                  value={staffForm.employeeId}
                  onChange={handleInputChange}
                  required
                  className={neumorphicInput}
                  placeholder="EMP-2026-01"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-800 uppercase mb-1">
                  Department
                </label>

                <input
                  type="text"
                  name="department"
                  value={staffForm.department}
                  onChange={handleInputChange}
                  required
                  className={neumorphicInput}
                  placeholder="Computer Science"
                />
              </div>
            </div>

            {/* Row 4 */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-800 uppercase mb-1">
                  Qualification
                </label>

                <input
                  type="text"
                  name="qualification"
                  value={staffForm.qualification}
                  onChange={handleInputChange}
                  required
                  className={neumorphicInput}
                  placeholder="BSCS / MCS"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-800 uppercase mb-1">
                  Salary
                </label>

                <input
                  type="number"
                  name="salary"
                  value={staffForm.salary}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className={neumorphicInput}
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-800 uppercase mb-1">
                  CNIC Number
                </label>

                <input
                  type="text"
                  name="cnic"
                  value={staffForm.cnic}
                  onChange={handleInputChange}
                  required
                  className={neumorphicInput}
                  placeholder="XXXXX-XXXXXXX-X"
                />
              </div>
            </div>

            {/* Row 5 */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-800 uppercase mb-1">
                  Bank Account / IBAN
                </label>

                <input
                  type="text"
                  name="bankAccount"
                  value={staffForm.bankAccount}
                  onChange={handleInputChange}
                  required
                  className={neumorphicInput}
                  placeholder="PK35XXXX000000000000"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-800 uppercase mb-1">
                  Status
                </label>

                <select
                  name="status"
                  value={staffForm.status}
                  onChange={handleInputChange}
                  className={neumorphicInput}
                >
                  <option value="Active">Active</option>

                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Backend limitation notice */}

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold">
              Note: Employee ID, Qualification, CNIC and Bank Account are
              currently UI-only fields because the existing backend Staff model
              does not contain these fields.
            </div>

            {/* Buttons */}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-[4px_4px_10px_rgb(163,177,198,0.6),-4px_-4px_10px_rgba(255,255,255,0.5)] hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving
                  ? editingStaff
                    ? "Updating Staff..."
                    : "Saving Staff..."
                  : editingStaff
                    ? "Update Staff Profile"
                    : "Save Staff Profile to Database"}
              </button>

              <button
                type="button"
                onClick={handleBackToList}
                disabled={saving}
                className="px-6 py-3 bg-slate-300 text-slate-800 rounded-xl text-xs font-bold shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.5)] hover:bg-slate-400 transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default StaffList;
