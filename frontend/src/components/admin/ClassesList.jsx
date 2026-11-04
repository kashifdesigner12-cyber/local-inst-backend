import React, { useEffect, useState } from "react";
import { apiCall } from "../../services/api";

function ClassesList() {
  // ============================================
  // STATE
  // ============================================

  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add/Edit modal
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  const [className, setClassName] = useState("");
  const [sections, setSections] = useState([]);

  // New section input
  const [newSection, setNewSection] = useState("");

  // Delete modal
  const [deleteModal, setDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ============================================
  // NEUMORPHIC STYLES
  // ============================================

  const neumorphicCard =
    "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-2xl p-6 border border-white/50";

  const neumorphicInner =
    "bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] rounded-xl p-4";

  const neumorphicInput =
    "w-full bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-400";

  // ============================================
  // LOAD CLASSES
  // ============================================

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiCall("/classes", "GET");

      if (!response.success) {
        throw new Error(response.message || "Failed to load classes");
      }

      /*
        Backend response:

        {
          success: true,
          message: "...",
          data: [...]
        }

        apiCall wraps this response inside:

        response.data
      */

      const backendData = response.data;

      let classList = [];

      if (Array.isArray(backendData?.data)) {
        classList = backendData.data;
      } else if (Array.isArray(backendData)) {
        classList = backendData;
      } else if (Array.isArray(backendData?.classes)) {
        classList = backendData.classes;
      }

      setClasses(classList);
    } catch (err) {
      console.error("Load classes error:", err);

      setError(
        err.message ||
          "Unable to load classes. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // INITIAL LOAD
  // ============================================

  useEffect(() => {
    loadClasses();
  }, []);

  // ============================================
  // CLEAR ALERTS
  // ============================================

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // ============================================
  // OPEN ADD MODAL
  // ============================================

  const openAddModal = () => {
    clearMessages();

    setEditingClass(null);
    setClassName("");
    setSections([]);

    setNewSection("");

    setShowClassModal(true);
  };

  // ============================================
  // OPEN EDIT MODAL
  // ============================================

  const openEditModal = (classItem) => {
    clearMessages();

    setEditingClass(classItem);

    setClassName(classItem.name || "");

    setSections(
      Array.isArray(classItem.sections)
        ? [...classItem.sections]
        : []
    );

    setNewSection("");

    setShowClassModal(true);
  };

  // ============================================
  // CLOSE CLASS MODAL
  // ============================================

  const closeClassModal = () => {
    if (saving) return;

    setShowClassModal(false);
    setEditingClass(null);

    setClassName("");
    setSections([]);
    setNewSection("");
  };

  // ============================================
  // ADD SECTION TO FORM
  // ============================================

  const addSectionToForm = () => {
    const section = newSection.trim();

    if (!section) {
      return;
    }

    const alreadyExists = sections.some(
      (item) => item.toLowerCase() === section.toLowerCase()
    );

    if (alreadyExists) {
      setError("This section already exists.");
      return;
    }

    setSections((prev) => [...prev, section]);
    setNewSection("");

    setError("");
  };

  // ============================================
  // REMOVE SECTION FROM FORM
  // ============================================

  const removeSectionFromForm = (sectionToRemove) => {
    setSections((prev) =>
      prev.filter((section) => section !== sectionToRemove)
    );
  };

  // ============================================
  // HANDLE SECTION ENTER KEY
  // ============================================

  const handleSectionKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSectionToForm();
    }
  };

  // ============================================
  // SAVE CLASS
  // ADD / EDIT
  // ============================================

  const handleSaveClass = async (event) => {
    event.preventDefault();

    clearMessages();

    const trimmedName = className.trim();

    if (!trimmedName) {
      setError("Please enter a class name.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: trimmedName,
        sections: sections,
      };

      let response;

      // ========================================
      // EDIT
      // ========================================

      if (editingClass) {
        const id = editingClass._id || editingClass.id;

        response = await apiCall(
          `/classes/${id}`,
          "PUT",
          payload
        );
      }

      // ========================================
      // ADD
      // ========================================

      else {
        response = await apiCall(
          "/classes",
          "POST",
          payload
        );
      }

      if (!response.success) {
        throw new Error(
          response.message ||
            `Failed to ${
              editingClass ? "update" : "create"
            } class`
        );
      }

      setSuccess(
        editingClass
          ? "Class updated successfully."
          : "Class added successfully."
      );

      closeClassModal();

      // MongoDB se fresh data
      await loadClasses();

      // Success message ko thori der show karo
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Save class error:", err);

      setError(
        err.message ||
          "Something went wrong while saving the class."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // OPEN DELETE MODAL
  // ============================================

  const openDeleteModal = (classItem) => {
    clearMessages();

    setClassToDelete(classItem);
    setDeleteModal(true);
  };

  // ============================================
  // CLOSE DELETE MODAL
  // ============================================

  const closeDeleteModal = () => {
    if (deleting) return;

    setDeleteModal(false);
    setClassToDelete(null);
  };

  // ============================================
  // DELETE CLASS
  // ============================================

  const handleDeleteClass = async () => {
    if (!classToDelete) return;

    const id = classToDelete._id || classToDelete.id;

    if (!id) {
      setError("Invalid class ID.");
      return;
    }

    try {
      setDeleting(true);
      clearMessages();

      const response = await apiCall(
        `/classes/${id}`,
        "DELETE"
      );

      if (!response.success) {
        throw new Error(
          response.message || "Failed to delete class"
        );
      }

      setSuccess("Class deleted successfully.");

      closeDeleteModal();

      // Fresh MongoDB data
      await loadClasses();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Delete class error:", err);

      setError(
        err.message ||
          "Something went wrong while deleting the class."
      );
    } finally {
      setDeleting(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="p-6 bg-[#e0e5ec] min-h-screen font-sans text-slate-700">

      {/* ======================================
          HEADER
      ====================================== */}

      <div
        className={`${neumorphicCard} mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}
      >
        <div>
          <h1 className="text-sm font-black text-slate-800">
            Classes & Sections
          </h1>

          <p className="text-xs text-slate-400 mt-1">
            Manage classes and their sections
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md active:scale-95 transition"
        >
          + Add Class
        </button>
      </div>

      {/* ======================================
          SUCCESS MESSAGE
      ====================================== */}

      {success && (
        <div className="mb-5 rounded-xl bg-emerald-100 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-700 shadow-sm">
          ✓ {success}
        </div>
      )}

      {/* ======================================
          ERROR MESSAGE
      ====================================== */}

      {error && (
        <div className="mb-5 rounded-xl bg-rose-100 border border-rose-200 px-4 py-3 text-xs font-bold text-rose-700 shadow-sm flex justify-between items-center gap-3">
          <span>⚠ {error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-rose-700 font-black"
          >
            ×
          </button>
        </div>
      )}

      {/* ======================================
          LOADING
      ====================================== */}

      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>

            <p className="text-xs font-bold text-slate-400 mt-4">
              Loading classes...
            </p>
          </div>
        </div>
      )}

      {/* ======================================
          EMPTY STATE
      ====================================== */}

      {!loading && classes.length === 0 && (
        <div className={neumorphicCard}>
          <div className="text-center py-12">
            <div className="text-4xl mb-4">
              📚
            </div>

            <h3 className="text-sm font-black text-slate-700">
              No Classes Found
            </h3>

            <p className="text-xs text-slate-400 mt-2">
              Start by adding your first class.
            </p>

            <button
              type="button"
              onClick={openAddModal}
              className="mt-5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md active:scale-95 transition"
            >
              + Add First Class
            </button>
          </div>
        </div>
      )}

      {/* ======================================
          CLASSES GRID
      ====================================== */}

      {!loading && classes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {classes.map((classItem) => {
            const id =
              classItem._id || classItem.id;

            const classSections = Array.isArray(
              classItem.sections
            )
              ? classItem.sections
              : [];

            return (
              <div
                key={id}
                className={`${neumorphicCard} transition hover:-translate-y-1`}
              >

                {/* CLASS HEADER */}

                <div className="flex justify-between items-center mb-4">

                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-800 truncate">
                      {classItem.name}
                    </h3>

                    <p className="text-[10px] text-slate-400 mt-1">
                      {classSections.length}{" "}
                      {classSections.length === 1
                        ? "Section"
                        : "Sections"}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-3">

                    {/* EDIT */}

                    <button
                      type="button"
                      onClick={() =>
                        openEditModal(classItem)
                      }
                      title="Edit Class"
                      className="w-8 h-8 rounded-xl bg-[#e0e5ec] shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.8)] text-blue-600 flex items-center justify-center font-bold text-xs active:scale-95 transition hover:text-blue-800"
                    >
                      ✏️
                    </button>

                    {/* DELETE */}

                    <button
                      type="button"
                      onClick={() =>
                        openDeleteModal(classItem)
                      }
                      title="Delete Class"
                      className="w-8 h-8 rounded-xl bg-[#e0e5ec] shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.8)] text-rose-600 flex items-center justify-center font-bold text-xs active:scale-95 transition hover:text-rose-800"
                    >
                      🗑️
                    </button>

                  </div>
                </div>

                {/* SECTIONS */}

                <div className={neumorphicInner}>

                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    SECTIONS
                  </p>

                  {classSections.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      No sections added yet.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-3">

                      {classSections.map(
                        (section, index) => (
                          <span
                            key={`${section}-${index}`}
                            className="bg-[#e0e5ec] shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.8)] px-4 py-1.5 rounded-lg text-xs font-bold text-slate-700"
                          >
                            {section}
                          </span>
                        )
                      )}

                    </div>
                  )}

                </div>
              </div>
            );
          })}

        </div>
      )}

      {/* ======================================
          ADD / EDIT CLASS MODAL
      ====================================== */}

      {showClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">

          <div
            className={`${neumorphicCard} w-full max-w-lg max-h-[90vh] overflow-y-auto`}
          >

            {/* MODAL HEADER */}

            <div className="flex justify-between items-center mb-6">

              <div>
                <h2 className="text-base font-black text-slate-800">
                  {editingClass
                    ? "Edit Class"
                    : "Add New Class"}
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  {editingClass
                    ? "Update class name and sections"
                    : "Create a new class and add sections"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeClassModal}
                disabled={saving}
                className="w-9 h-9 rounded-xl bg-[#e0e5ec] shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.8)] text-slate-500 font-black active:scale-95 transition"
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form onSubmit={handleSaveClass}>

              {/* CLASS NAME */}

              <div className="mb-5">

                <label className="block text-xs font-black text-slate-600 mb-2">
                  Class Name
                </label>

                <input
                  type="text"
                  value={className}
                  onChange={(event) =>
                    setClassName(event.target.value)
                  }
                  placeholder="e.g. SEO"
                  className={neumorphicInput}
                  autoFocus
                  disabled={saving}
                />

              </div>

              {/* SECTION INPUT */}

              <div className="mb-5">

                <label className="block text-xs font-black text-slate-600 mb-2">
                  Add Section
                </label>

                <div className="flex gap-2">

                  <input
                    type="text"
                    value={newSection}
                    onChange={(event) =>
                      setNewSection(event.target.value)
                    }
                    onKeyDown={handleSectionKeyDown}
                    placeholder="e.g. A"
                    className={neumorphicInput}
                    disabled={saving}
                  />

                  <button
                    type="button"
                    onClick={addSectionToForm}
                    disabled={saving}
                    className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 rounded-xl text-xs shadow-md active:scale-95 transition"
                  >
                    + Add
                  </button>

                </div>

                <p className="text-[10px] text-slate-400 mt-2">
                  Type a section name and press Enter or click Add.
                </p>

              </div>

              {/* SECTION LIST */}

              <div className="mb-6">

                <label className="block text-xs font-black text-slate-600 mb-2">
                  Sections
                </label>

                <div
                  className={`${neumorphicInner} min-h-[80px]`}
                >

                  {sections.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-3">
                      No sections added.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-3">

                      {sections.map(
                        (section, index) => (
                          <span
                            key={`${section}-${index}`}
                            className="bg-[#e0e5ec] shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.8)] px-3 py-2 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-2"
                          >
                            {section}

                            <button
                              type="button"
                              onClick={() =>
                                removeSectionFromForm(
                                  section
                                )
                              }
                              disabled={saving}
                              className="text-rose-500 font-black hover:text-rose-700 hover:scale-110 transition"
                            >
                              ×
                            </button>
                          </span>
                        )
                      )}

                    </div>
                  )}

                </div>

              </div>

              {/* ACTION BUTTONS */}

              <div className="flex gap-3 justify-end">

                <button
                  type="button"
                  onClick={closeClassModal}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-[#e0e5ec] shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.8)] active:scale-95 transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md active:scale-95 transition disabled:opacity-60"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                      Saving...
                    </span>
                  ) : editingClass ? (
                    "Update Class"
                  ) : (
                    "Add Class"
                  )}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* ======================================
          DELETE CONFIRMATION MODAL
      ====================================== */}

      {deleteModal && classToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">

          <div
            className={`${neumorphicCard} w-full max-w-sm text-center`}
          >

            <div className="text-4xl mb-4">
              🗑️
            </div>

            <h2 className="text-base font-black text-slate-800">
              Delete Class?
            </h2>

            <p className="text-xs text-slate-500 mt-2 leading-5">
              Are you sure you want to delete{" "}
              <span className="font-black text-slate-700">
                "{classToDelete.name}"
              </span>
              ?
              <br />
              This action cannot be undone.
            </p>

            <div className="flex gap-3 justify-center mt-6">

              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-[#e0e5ec] shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.8)] active:scale-95 transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteClass}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md active:scale-95 transition disabled:opacity-60"
              >
                {deleting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    Deleting...
                  </span>
                ) : (
                  "Yes, Delete"
                )}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default ClassesList;