import React, { useEffect, useState } from "react";
import { apiCall } from "../../services/api";

function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    designation: "",
    department: "",
    salary: "",
    joiningDate: "",
    status: "ACTIVE",
    photo: "",
  });

  // =========================================================
  // SAME STUDENTS PAGE THEME
  // =========================================================

  const neumorphicCard =
    "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-2xl p-6 border border-white/50";

  const neumorphicInset =
    "bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] rounded-xl px-4 py-2.5 border border-white/20 outline-none text-slate-700 font-medium text-xs w-full";

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      designation: "",
      department: "",
      salary: "",
      joiningDate: "",
      status: "ACTIVE",
      photo: "",
    });

    setEditingStaff(null);
  };

  // =========================================================
  // LOAD STAFF FROM BACKEND
  // =========================================================

  const loadStaff = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        setErrorMsg("Please login first.");
        return;
      }

      console.log("Loading staff from backend...");

      const result = await apiCall("/staff", "GET");

      console.log("Staff GET response:", result);

      if (!result.success) {
        setErrorMsg(
          result.message || "Failed to load staff."
        );
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
          data: response
        }
      */

      const staffList =
        result.data?.data?.staff || [];

      setStaff(
        Array.isArray(staffList)
          ? staffList
          : []
      );

      console.log(
        `${staffList.length} staff loaded.`
      );
    } catch (error) {
      console.error(
        "Load staff error:",
        error
      );

      setErrorMsg(
        error.message ||
          "Unable to load staff."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD WHEN PAGE OPENS
  // =========================================================

  useEffect(() => {
    loadStaff();
  }, []);

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // IMAGE
  // =========================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        photo: reader.result,
      }));
    };

    reader.readAsDataURL(file);
  };

  // =========================================================
  // OPEN ADD MODAL
  // =========================================================

  const handleOpenModal = () => {
    resetForm();
    setErrorMsg("");
    setSuccessMsg("");
    setShowModal(true);
  };

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);

    setFormData({
      name: staffMember?.name || "",
      email: staffMember?.email || "",
      phone: staffMember?.phone || "",
      designation:
        staffMember?.designation || "",
      department:
        staffMember?.department || "",
      salary:
        staffMember?.salary !== undefined &&
        staffMember?.salary !== null
          ? String(staffMember.salary)
          : "",
      joiningDate: staffMember?.joiningDate
        ? new Date(staffMember.joiningDate)
            .toISOString()
            .split("T")[0]
        : "",
      status:
        staffMember?.status || "ACTIVE",
      photo: staffMember?.photo || "",
    });

    setErrorMsg("");
    setSuccessMsg("");
    setShowModal(true);
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const handleCloseModal = () => {
    if (saving) return;

    setShowModal(false);
    setErrorMsg("");
    resetForm();
  };

  // =========================================================
  // ADD / UPDATE STAFF
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMsg("");
    setSuccessMsg("");

    // -------------------------------------------------------
    // EXACT BACKEND REQUIRED FIELDS
    // -------------------------------------------------------

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();
    const designation =
      formData.designation.trim();
    const department =
      formData.department.trim();

    if (!name) {
      setErrorMsg(
        "Please enter staff name."
      );
      return;
    }

    if (!email) {
      setErrorMsg(
        "Please enter staff email."
      );
      return;
    }

    if (!phone) {
      setErrorMsg(
        "Please enter staff phone."
      );
      return;
    }

    if (!designation) {
      setErrorMsg(
        "Please enter designation."
      );
      return;
    }

    if (!department) {
      setErrorMsg(
        "Please enter department."
      );
      return;
    }

    // -------------------------------------------------------
    // EXACT PAYLOAD FOR BACKEND
    // -------------------------------------------------------

    const staffPayload = {
      name,
      email,
      phone,
      designation,
      department,
      salary:
        formData.salary === ""
          ? 0
          : Number(formData.salary),
      joiningDate:
        formData.joiningDate || undefined,
      status:
        formData.status.toUpperCase(),
      photo: formData.photo || "",
    };

    console.log(
      "===================================="
    );

    console.log(
      "SENDING STAFF TO BACKEND:"
    );

    console.log(staffPayload);

    console.log(
      "===================================="
    );

    setSaving(true);

    try {
      let result;

      // -----------------------------------------------------
      // UPDATE
      // -----------------------------------------------------

      if (editingStaff?._id) {
        result = await apiCall(
          `/staff/${editingStaff._id}`,
          "PUT",
          staffPayload
        );
      }

      // -----------------------------------------------------
      // CREATE
      // -----------------------------------------------------

      else {
        result = await apiCall(
          "/staff",
          "POST",
          staffPayload
        );
      }

      console.log(
        "Staff POST/PUT response:",
        result
      );

      if (!result.success) {
        setErrorMsg(
          result.message ||
            "Failed to save staff."
        );
        return;
      }

      // -----------------------------------------------------
      // SUCCESS
      // -----------------------------------------------------

      setShowModal(false);

      setSuccessMsg(
        editingStaff
          ? "Staff successfully updated!"
          : "Staff successfully added!"
      );

      resetForm();

      // Reload actual database records
      await loadStaff();

      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    } catch (error) {
      console.error(
        "Save staff error:",
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

  // =========================================================
  // DELETE STAFF
  // =========================================================

  const handleDelete = async (staffMember) => {
    if (!staffMember?._id) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${staffMember.name}"?`
    );

    if (!confirmed) return;

    setDeletingId(staffMember._id);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const result = await apiCall(
        `/staff/${staffMember._id}`,
        "DELETE"
      );

      console.log(
        "Staff DELETE response:",
        result
      );

      if (!result.success) {
        setErrorMsg(
          result.message ||
            "Failed to delete staff."
        );
        return;
      }

      setStaff((prev) =>
        prev.filter(
          (item) =>
            item._id !== staffMember._id
        )
      );

      setSuccessMsg(
        "Staff successfully deleted!"
      );

      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    } catch (error) {
      console.error(
        "Delete staff error:",
        error
      );

      setErrorMsg(
        error.message ||
          "Unable to delete staff."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = () => {
    setSuccessMsg("");
    setErrorMsg("");
    loadStaff();
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredStaff = staff.filter(
    (staffMember) => {
      const q =
        search.trim().toLowerCase();

      if (!q) return true;

      return (
        String(
          staffMember?.name || ""
        )
          .toLowerCase()
          .includes(q) ||
        String(
          staffMember?.email || ""
        )
          .toLowerCase()
          .includes(q) ||
        String(
          staffMember?.phone || ""
        )
          .toLowerCase()
          .includes(q) ||
        String(
          staffMember?.designation || ""
        )
          .toLowerCase()
          .includes(q) ||
        String(
          staffMember?.department || ""
        )
          .toLowerCase()
          .includes(q)
      );
    }
  );

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="p-6 bg-[#e0e5ec] min-h-screen font-sans text-slate-700">

      {/* ===================================================
          TOP BAR
      =================================================== */}

      <div
        className={`${neumorphicCard} mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}
      >

        <div>
          <h1 className="text-sm font-black text-slate-800">
            Staff Management
          </h1>

          <p className="text-[11px] text-slate-500 mt-0.5">
            Manage staff credentials and profiles.
          </p>
        </div>

        <div className="flex gap-3">

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-[#e0e5ec] text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md hover:text-blue-600 active:scale-95 transition disabled:opacity-50"
          >
            ↻ Refresh
          </button>

          <button
            onClick={handleOpenModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md active:scale-95 transition"
          >
            + Add Staff
          </button>

        </div>

      </div>

      {/* ===================================================
          SUCCESS MESSAGE
      =================================================== */}

      {successMsg && (
        <div className="mb-6 p-3 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold text-center">
          ✅ {successMsg}
        </div>
      )}

      {/* ===================================================
          ERROR MESSAGE
      =================================================== */}

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold text-center">
          ⚠️ {errorMsg}

          <button
            onClick={() => setErrorMsg("")}
            className="ml-3 underline"
          >
            Close
          </button>
        </div>
      )}

      {/* ===================================================
          SEARCH
      =================================================== */}

      <div className={`${neumorphicCard} mb-6`}>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Staff Directory
            </h3>

            <p className="text-[10px] text-slate-500 mt-1">
              {loading
                ? "Loading staff..."
                : `${filteredStaff.length} staff member(s) found`}
            </p>
          </div>

          <div className="w-full md:w-80">

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search staff..."
              className={neumorphicInset}
            />

          </div>

        </div>

      </div>

      {/* ===================================================
          STAFF TABLE
      =================================================== */}

      <div className={neumorphicCard}>

        <div className="flex justify-between items-center mb-4">

          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Staff Directory
            </h3>

            <p className="text-[10px] text-slate-500 mt-1">
              {loading
                ? "Loading staff from database..."
                : `${staff.length} staff member(s) in database`}
            </p>
          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left border-collapse text-xs min-w-[1000px]">

            <thead>

              <tr className="border-b border-slate-300 text-slate-500 uppercase">

                <th className="pb-3 pr-4">
                  Photo
                </th>

                <th className="pb-3 pr-4">
                  Name
                </th>

                <th className="pb-3 pr-4">
                  Email
                </th>

                <th className="pb-3 pr-4">
                  Phone
                </th>

                <th className="pb-3 pr-4">
                  Designation
                </th>

                <th className="pb-3 pr-4">
                  Department
                </th>

                <th className="pb-3 pr-4">
                  Salary
                </th>

                <th className="pb-3 pr-4">
                  Status
                </th>

                <th className="pb-3 text-center">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-200">

              {/* LOADING */}

              {loading && (
                <tr>

                  <td
                    colSpan="9"
                    className="text-center py-10 text-slate-500 font-semibold"
                  >
                    Loading staff from database...
                  </td>

                </tr>
              )}

              {/* NO STAFF */}

              {!loading &&
                filteredStaff.length === 0 && (
                  <tr>

                    <td
                      colSpan="9"
                      className="text-center py-10 text-slate-500 font-semibold"
                    >
                      {search
                        ? "No matching staff found."
                        : "No staff found in database."}
                    </td>

                  </tr>
                )}

              {/* STAFF */}

              {!loading &&
                filteredStaff.map(
                  (staffMember) => (
                    <tr
                      key={staffMember._id}
                      className="hover:bg-white/30 transition"
                    >

                      {/* PHOTO */}

                      <td className="py-3 pr-4">

                        {staffMember.photo ? (

                          <img
                            src={staffMember.photo}
                            alt={staffMember.name}
                            className="w-10 h-10 rounded-full object-cover shadow-sm border border-white"
                          />

                        ) : (

                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black">
                            {String(
                              staffMember.name ||
                                "S"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                        )}

                      </td>

                      {/* NAME */}

                      <td className="py-3 pr-4">

                        <div>
                          <p className="font-bold text-slate-800">
                            {staffMember.name ||
                              "-"}
                          </p>

                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {staffMember.joiningDate
                              ? new Date(
                                  staffMember.joiningDate
                                ).toLocaleDateString()
                              : "-"}
                          </p>
                        </div>

                      </td>

                      {/* EMAIL */}

                      <td className="py-3 pr-4 text-slate-600">
                        {staffMember.email ||
                          "-"}
                      </td>

                      {/* PHONE */}

                      <td className="py-3 pr-4 text-slate-600">
                        {staffMember.phone ||
                          "-"}
                      </td>

                      {/* DESIGNATION */}

                      <td className="py-3 pr-4">

                        <span className="font-bold text-slate-700">
                          {staffMember.designation ||
                            "-"}
                        </span>

                      </td>

                      {/* DEPARTMENT */}

                      <td className="py-3 pr-4 text-slate-600">
                        {staffMember.department ||
                          "-"}
                      </td>

                      {/* SALARY */}

                      <td className="py-3 pr-4">

                        <span className="font-bold text-slate-700">
                          Rs.{" "}
                          {Number(
                            staffMember.salary ||
                              0
                          ).toLocaleString()}
                        </span>

                      </td>

                      {/* STATUS */}

                      <td className="py-3 pr-4">

                        {staffMember.status ===
                        "ACTIVE" ? (

                          <span className="inline-flex px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">
                            ACTIVE
                          </span>

                        ) : (

                          <span className="inline-flex px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black">
                            INACTIVE
                          </span>

                        )}

                      </td>

                      {/* ACTIONS */}

                      <td className="py-3">

                        <div className="flex items-center justify-center gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                staffMember
                              )
                            }
                            disabled={
                              deletingId ===
                              staffMember._id
                            }
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#e9f1ff] text-blue-600 font-bold text-[11px] shadow-sm hover:bg-[#dceaff] hover:text-blue-700 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="text-sm leading-none">
                              ✏️
                            </span>

                            <span>
                              Edit
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                staffMember
                              )
                            }
                            disabled={
                              deletingId ===
                              staffMember._id
                            }
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#ffe7eb] text-rose-600 font-bold text-[11px] shadow-sm hover:bg-[#ffd9df] hover:text-rose-700 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="text-sm leading-none">
                              🗑️
                            </span>

                            <span>
                              {deletingId ===
                              staffMember._id
                                ? "Deleting..."
                                : "Delete"}
                            </span>
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ===================================================
          ADD / EDIT MODAL
      =================================================== */}

      {showModal && (

        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">

          <div
            className={`${neumorphicCard} w-full max-w-3xl bg-[#e0e5ec] max-h-[92vh] overflow-y-auto`}
          >

            {/* MODAL HEADER */}

            <div className="flex justify-between items-center mb-5 border-b border-slate-300 pb-3">

              <div>

                <h2 className="text-sm font-black text-slate-800">
                  {editingStaff
                    ? "Edit Staff"
                    : "Add New Staff"}
                </h2>

                <p className="text-[10px] text-slate-500 mt-1">
                  Enter staff credentials and profile information.
                </p>

              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className="text-slate-500 hover:text-rose-600 font-bold text-lg"
              >
                ✕
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* NAME */}

                <div className="md:col-span-2">

                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Full Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className={neumorphicInset}
                    required
                  />

                </div>

                {/* EMAIL */}

                <div>

                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Email *
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="staff@example.com"
                    className={neumorphicInset}
                    required
                  />

                </div>

                {/* PHONE */}

                <div>

                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Phone *
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="03XX-XXXXXXX"
                    className={neumorphicInset}
                    required
                  />

                </div>

                {/* DESIGNATION */}

                <div>

                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Designation *
                  </label>

                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    placeholder="Teacher"
                    className={neumorphicInset}
                    required
                  />

                </div>

                {/* DEPARTMENT */}

                <div>

                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Department *
                  </label>

                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="Science"
                    className={neumorphicInset}
                    required
                  />

                </div>

                {/* SALARY */}

                <div>

                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Salary
                  </label>

                  <input
                    type="number"
                    min="0"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    placeholder="50000"
                    className={neumorphicInset}
                  />

                </div>

                {/* JOINING DATE */}

                <div>

                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Joining Date
                  </label>

                  <input
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleInputChange}
                    className={neumorphicInset}
                  />

                </div>

                {/* STATUS */}

                <div>

                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={neumorphicInset}
                  >
                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="INACTIVE">
                      Inactive
                    </option>
                  </select>

                </div>

                {/* PHOTO */}

                <div>

                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Staff Photo
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-[11px] text-slate-500"
                  />

                </div>

              </div>

              {/* PHOTO PREVIEW */}

              {formData.photo && (

                <div className="flex items-center gap-3">

                  <img
                    src={formData.photo}
                    alt="Staff preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                  />

                  <span className="text-[10px] text-slate-500 font-semibold">
                    Photo preview
                  </span>

                </div>

              )}

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 pt-5 border-t border-slate-300">

                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#e0e5ec] shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.8)] text-slate-600 rounded-xl text-xs font-bold active:scale-95 transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-7 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 active:scale-95 transition disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingStaff
                    ? "Update Staff"
                    : "Save Staff"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default StaffManagement;