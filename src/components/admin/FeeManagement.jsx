import React, { useEffect, useMemo, useState } from "react";
import { apiCall } from "../../services/api";

function FeeManagement() {
  const [feeList, setFeeList] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showAddModal, setShowAddModal] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const getDefaultMonth = () => {
    const date = new Date();

    return date.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const generateReceiptNumber = () => {
    return `REC-${Math.floor(100000000 + Math.random() * 900000000)}`;
  };

  const [formData, setFormData] = useState({
    studentId: "",
    feeType: "MONTHLY",
    month: getDefaultMonth(),
    receiptNumber: generateReceiptNumber(),
    amount: "",
    discount: "0",
    paidAmount: "",
    paymentDate: today,
    paymentMethod: "CASH",
    notes: "",
  });

  // =========================================================
  // Neumorphic Classes
  // =========================================================

  const neumorphicCard =
    "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-2xl p-6 border border-white/50";

  const neumorphicInset =
    "bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] rounded-xl px-4 py-2.5 border border-white/20 outline-none text-slate-700 font-medium text-xs w-full";

  // =========================================================
  // Load Students
  // =========================================================

  const loadStudents = async () => {
    try {
      const result = await apiCall("/students", "GET");

      console.log("Students GET response:", result);

      if (!result.success) {
        setErrorMsg(result.message || "Failed to load students.");
        return;
      }

      const studentList = result.data?.data?.students || [];

      setStudents(studentList);

      console.log(`${studentList.length} students loaded.`);
    } catch (error) {
      console.error("Load students error:", error);

      setErrorMsg(error.message || "Unable to load students.");
    }
  };

  // =========================================================
  // Load Fees
  // =========================================================

  const loadFees = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const result = await apiCall("/fees?limit=100", "GET");

      console.log("Fees GET response:", result);

      if (!result.success) {
        setErrorMsg(result.message || "Failed to load fee records.");
        return;
      }

      const fees = result.data?.data?.fees || [];

      setFeeList(fees);

      console.log(`${fees.length} fee records loaded.`);
    } catch (error) {
      console.error("Load fees error:", error);

      setErrorMsg(error.message || "Unable to load fee records.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // Initial Load
  // =========================================================

  useEffect(() => {
    const loadPageData = async () => {
      await Promise.all([loadStudents(), loadFees()]);
    };

    loadPageData();
  }, []);

  // =========================================================
  // Open Add Modal
  // =========================================================

  const openAddModal = () => {
    setErrorMsg("");

    setFormData({
      studentId: "",
      feeType: "MONTHLY",
      month: getDefaultMonth(),
      receiptNumber: generateReceiptNumber(),
      amount: "",
      discount: "0",
      paidAmount: "",
      paymentDate: today,
      paymentMethod: "CASH",
      notes: "",
    });

    setShowAddModal(true);
  };

  // =========================================================
  // Close Modal
  // =========================================================

  const closeModal = () => {
    if (saving) return;

    setShowAddModal(false);
    setErrorMsg("");
  };

  // =========================================================
  // Form Change
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // Add Fee Payment
  // =========================================================

  const handleAddPayment = async (e) => {
    e.preventDefault();

    setErrorMsg("");
    setSuccessMsg("");

    // -------------------------------------------------------
    // Frontend Validation
    // -------------------------------------------------------

    if (!formData.studentId) {
      setErrorMsg("Please select a student.");
      return;
    }

    if (!formData.month.trim()) {
      setErrorMsg("Please enter fee month.");
      return;
    }

    if (formData.amount === "" || Number(formData.amount) < 0) {
      setErrorMsg("Please enter a valid fee amount.");
      return;
    }

    const amount = Number(formData.amount) || 0;

    const discount = Number(formData.discount) || 0;

    const paidAmount = Number(formData.paidAmount) || 0;

    if (discount > amount) {
      setErrorMsg("Discount cannot exceed total fee amount.");
      return;
    }

    const payable = Math.max(0, amount - discount);

    if (paidAmount > payable) {
      setErrorMsg(
        `Paid amount cannot exceed net payable amount Rs ${payable.toLocaleString()}.`,
      );
      return;
    }

    // -------------------------------------------------------
    // Backend Payload
    // -------------------------------------------------------

    const feePayload = {
      studentId: formData.studentId,

      feeType: formData.feeType,

      month: formData.month.trim(),

      receiptNumber: formData.receiptNumber.trim(),

      amount: amount,

      discount: discount,

      paidAmount: paidAmount,

      paymentMethod: formData.paymentMethod,

      date: formData.paymentDate || undefined,

      notes: formData.notes.trim(),
    };

    console.log("Sending fee payload:", feePayload);

    setSaving(true);

    try {
      const result = await apiCall("/fees", "POST", feePayload);

      console.log("Fee POST response:", result);

      if (!result.success) {
        setErrorMsg(result.message || "Failed to add fee payment.");
        return;
      }

      setSuccessMsg("Fee payment added successfully.");

      setShowAddModal(false);

      setFormData({
        studentId: "",
        feeType: "MONTHLY",
        month: getDefaultMonth(),
        receiptNumber: generateReceiptNumber(),
        amount: "",
        discount: "0",
        paidAmount: "",
        paymentDate: today,
        paymentMethod: "CASH",
        notes: "",
      });

      await loadFees();

      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    } catch (error) {
      console.error("Add fee error:", error);

      setErrorMsg(error.message || "Unable to connect to backend.");
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // Selected Student
  // =========================================================

  const selectedStudent = useMemo(() => {
    return students.find(
      (student) => String(student._id) === String(formData.studentId),
    );
  }, [students, formData.studentId]);

  // =========================================================
  // Summary
  // =========================================================

  const totalFeesSum = feeList.reduce(
    (acc, fee) => acc + (Number(fee.amount) || 0),
    0,
  );

  const totalCollectedSum = feeList.reduce(
    (acc, fee) => acc + (Number(fee.paidAmount) || 0),
    0,
  );

  const totalDiscountSum = feeList.reduce(
    (acc, fee) => acc + (Number(fee.discount) || 0),
    0,
  );

  const totalPendingSum = feeList.reduce(
    (acc, fee) => acc + (Number(fee.remainingAmount) || 0),
    0,
  );

  // =========================================================
  // Filter Fees
  // =========================================================

  const filteredFees = feeList.filter((fee) => {
    const student = fee.student || {};

    const studentName = student.name || "";

    const admissionNo = student.admissionNo || "";

    const rollNo = student.rollNo || "";

    const className = student.className || "";

    const receiptNumber = fee.receiptNumber || "";

    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      !search ||
      studentName.toLowerCase().includes(search) ||
      admissionNo.toLowerCase().includes(search) ||
      rollNo.toLowerCase().includes(search) ||
      className.toLowerCase().includes(search) ||
      receiptNumber.toLowerCase().includes(search);

    const backendStatus = fee.status || "PENDING";

    const matchesStatus =
      statusFilter === "All" || backendStatus === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  // =========================================================
  // Status Helper
  // =========================================================

  const getStatusClass = (status) => {
    if (status === "PAID") {
      return "text-emerald-600";
    }

    if (status === "PARTIAL") {
      return "text-amber-600";
    }

    return "text-rose-600";
  };

  const formatStatus = (status) => {
    if (!status) return "Pending";

    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  // =========================================================
  // Loading
  // =========================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#e0e5ec]">
        <p className="text-slate-500 font-semibold animate-pulse">
          Loading Fee Records from Backend...
        </p>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="p-6 bg-[#e0e5ec] min-h-screen font-sans text-slate-700">
      {/* =====================================================
          Brand Banner
      ====================================================== */}

      <div className="bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-2xl p-5 mb-6 border border-white/50 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#e0e5ec] shadow-[4px_4px_8px_rgb(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.5)] rounded-xl flex items-center justify-center font-black text-blue-600 text-sm">
            LP
          </div>

          <div>
            <h2 className="text-base font-black text-slate-800 tracking-wider">
              localpro1
            </h2>

            <p className="text-[11px] text-slate-500 font-medium">
              Fee & Financial Management Portal
            </p>
          </div>
        </div>

        <div className="bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] px-4 py-2 rounded-xl text-xs font-bold text-blue-600">
          POWERED BY localpro1
        </div>
      </div>

      {/* =====================================================
          Success Message
      ====================================================== */}

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold text-center">
          ✅ {successMsg}
        </div>
      )}

      {/* =====================================================
          Error Message
      ====================================================== */}

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* =====================================================
          Header
      ====================================================== */}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-lg font-black text-slate-800">Fee Management</h1>

          <p className="text-xs text-slate-500">
            Track and manage student fee payments and balances
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={loadFees}
            className="flex-1 md:flex-none bg-[#e0e5ec] shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] hover:shadow-[2px_2px_5px_rgb(163,177,198,0.6)] text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs active:scale-95 transition"
          >
            ↻ Refresh
          </button>

          <button
            onClick={openAddModal}
            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md active:scale-95 transition"
          >
            + Add Payment
          </button>
        </div>
      </div>

      {/* =====================================================
          Summary Cards
      ====================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={neumorphicCard}>
          <p className="text-xs font-bold text-slate-500 mb-1">Total Fees</p>

          <h3 className="text-base font-black text-blue-600">
            Rs {totalFeesSum.toLocaleString()}
          </h3>
        </div>

        <div className={neumorphicCard}>
          <p className="text-xs font-bold text-slate-500 mb-1">
            Total Collected
          </p>

          <h3 className="text-base font-black text-emerald-600">
            Rs {totalCollectedSum.toLocaleString()}
          </h3>
        </div>

        <div className={neumorphicCard}>
          <p className="text-xs font-bold text-slate-500 mb-1">
            Total Discount
          </p>

          <h3 className="text-base font-black text-amber-600">
            Rs {totalDiscountSum.toLocaleString()}
          </h3>
        </div>

        <div className={neumorphicCard}>
          <p className="text-xs font-bold text-slate-500 mb-1">Total Pending</p>

          <h3 className="text-base font-black text-rose-600">
            Rs {totalPendingSum.toLocaleString()}
          </h3>
        </div>
      </div>

      {/* =====================================================
          Filters
      ====================================================== */}

      <div
        className={`${neumorphicCard} mb-6 flex flex-col md:flex-row gap-4 items-center justify-between`}
      >
        <div className="w-full md:w-96">
          <input
            type="text"
            placeholder="Search student, admission, roll, class, receipt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${neumorphicInset} text-xs`}
          />
        </div>

        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={neumorphicInset}
          >
            <option value="All">All Statuses</option>

            <option value="PAID">Paid</option>

            <option value="PARTIAL">Partial</option>

            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* =====================================================
          Fee Table
      ====================================================== */}

      <div className={neumorphicCard}>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Fee Records</h3>

        <p className="text-xs text-slate-400 mb-4">
          Showing {filteredFees.length} of {feeList.length} records
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-xs text-slate-500 uppercase">
                <th className="pb-3 font-bold">#</th>

                <th className="pb-3 font-bold">Student</th>

                <th className="pb-3 font-bold">Admission</th>

                <th className="pb-3 font-bold">Class</th>

                <th className="pb-3 font-bold">Receipt</th>

                <th className="pb-3 font-bold">Fee Type</th>

                <th className="pb-3 font-bold">Amount</th>

                <th className="pb-3 font-bold">Discount</th>

                <th className="pb-3 font-bold">Paid</th>

                <th className="pb-3 font-bold">Remaining</th>

                <th className="pb-3 font-bold">Month</th>

                <th className="pb-3 font-bold">Status</th>
              </tr>
            </thead>

            <tbody className="text-xs divide-y divide-slate-200">
              {filteredFees.length > 0 ? (
                filteredFees.map((fee, index) => {
                  const student = fee.student || {};

                  return (
                    <tr
                      key={fee._id || index}
                      className="hover:bg-white/40 transition-colors"
                    >
                      <td className="py-3 text-slate-500 font-bold">
                        {index + 1}
                      </td>

                      <td className="py-3 font-black text-slate-800">
                        {student.name || "N/A"}
                      </td>

                      <td className="py-3 text-slate-600 font-mono">
                        {student.admissionNo || "N/A"}
                      </td>

                      <td className="py-3 text-slate-600">
                        {student.className || "N/A"}
                        {student.section ? ` - ${student.section}` : ""}
                      </td>

                      <td className="py-3 text-slate-600 font-mono font-bold">
                        {fee.receiptNumber || "N/A"}
                      </td>

                      <td className="py-3 text-slate-600">
                        {fee.feeType || "MONTHLY"}
                      </td>

                      <td className="py-3 text-slate-800 font-bold">
                        Rs {Number(fee.amount || 0).toLocaleString()}
                      </td>

                      <td className="py-3 text-amber-600 font-semibold">
                        Rs {Number(fee.discount || 0).toLocaleString()}
                      </td>

                      <td className="py-3 text-emerald-600 font-bold">
                        Rs {Number(fee.paidAmount || 0).toLocaleString()}
                      </td>

                      <td className="py-3 text-rose-600 font-bold">
                        Rs {Number(fee.remainingAmount || 0).toLocaleString()}
                      </td>

                      <td className="py-3 text-slate-600">
                        {fee.month || "N/A"}
                      </td>

                      <td className="py-3">
                        <span
                          className={`bg-[#e0e5ec] shadow-[inset_2px_2px_4px_rgb(163,177,198,0.6),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] px-3 py-1 rounded-xl font-bold text-[10px] ${getStatusClass(
                            fee.status,
                          )}`}
                        >
                          {formatStatus(fee.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="12"
                    className="text-center py-12 text-slate-500 font-medium"
                  >
                    No fee records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          Add Payment Modal
      ====================================================== */}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#e0e5ec] shadow-[15px_15px_30px_rgb(163,177,198,0.8),-15px_-15px_30px_rgba(255,255,255,0.6)] rounded-3xl p-6 w-full max-w-3xl border border-white/60 my-8 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}

            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-black text-slate-800">
                  Add Fee Payment
                </h3>

                <p className="text-[10px] text-slate-500 mt-1">
                  Create a new student fee record.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-[#e0e5ec] shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.5)] text-slate-600 font-bold flex items-center justify-center active:scale-95 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Error */}

            {errorMsg && (
              <div className="mb-5 p-3 bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddPayment} className="space-y-4 text-xs">
              {/* =================================================
                  Student
              ================================================== */}

              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Student
                </label>

                <select
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  required
                  className={neumorphicInset}
                >
                  <option value="">Select Student</option>

                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name || "Unnamed Student"}
                      {" — "}
                      {student.admissionNo || "No Admission"}
                      {" — "}
                      {student.className || ""}
                      {student.section ? `-${student.section}` : ""}
                    </option>
                  ))}
                </select>

                {students.length === 0 && (
                  <p className="text-[10px] text-rose-500 mt-2 font-semibold">
                    No students found. Please add a student first.
                  </p>
                )}
              </div>

              {/* =================================================
                  Selected Student Info
              ================================================== */}

              {selectedStudent && (
                <div className="bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] rounded-xl p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Selected Student
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-[9px] text-slate-400">Name</p>

                      <p className="font-bold text-slate-700">
                        {selectedStudent.name || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] text-slate-400">Admission No</p>

                      <p className="font-bold text-slate-700">
                        {selectedStudent.admissionNo || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] text-slate-400">Roll No</p>

                      <p className="font-bold text-slate-700">
                        {selectedStudent.rollNo || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] text-slate-400">Class</p>

                      <p className="font-bold text-slate-700">
                        {selectedStudent.className || "N/A"}
                        {selectedStudent.section
                          ? ` - ${selectedStudent.section}`
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================
                  Fee Type + Month
              ================================================== */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Fee Type
                  </label>

                  <select
                    name="feeType"
                    value={formData.feeType}
                    onChange={handleChange}
                    className={neumorphicInset}
                  >
                    <option value="MONTHLY">Monthly</option>

                    <option value="ADMISSION">Admission</option>

                    <option value="EXAM">Exam</option>

                    <option value="TRANSPORT">Transport</option>

                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Fee Month / Period
                  </label>

                  <input
                    type="text"
                    name="month"
                    value={formData.month}
                    onChange={handleChange}
                    required
                    className={neumorphicInset}
                    placeholder="September 2026"
                  />
                </div>
              </div>

              {/* =================================================
                  Receipt + Date
              ================================================== */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Receipt Number
                  </label>

                  <input
                    type="text"
                    name="receiptNumber"
                    value={formData.receiptNumber}
                    onChange={handleChange}
                    className={neumorphicInset}
                    placeholder="REC-123456789"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Payment Date
                  </label>

                  <input
                    type="date"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleChange}
                    className={neumorphicInset}
                  />
                </div>
              </div>

              {/* =================================================
                  Amounts
              ================================================== */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Total Amount (Rs)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="amount"
                    required
                    value={formData.amount}
                    onChange={handleChange}
                    className={neumorphicInset}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Discount (Rs)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    className={neumorphicInset}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Paid Amount (Rs)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="paidAmount"
                    value={formData.paidAmount}
                    onChange={handleChange}
                    className={neumorphicInset}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* =================================================
                  Payable Preview
              ================================================== */}

              <div className="bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] rounded-xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">
                      Total
                    </p>

                    <p className="text-sm font-black text-blue-600">
                      Rs {(Number(formData.amount) || 0).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">
                      Net Payable
                    </p>

                    <p className="text-sm font-black text-amber-600">
                      Rs{" "}
                      {Math.max(
                        0,
                        (Number(formData.amount) || 0) -
                          (Number(formData.discount) || 0),
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">
                      Remaining
                    </p>

                    <p className="text-sm font-black text-rose-600">
                      Rs{" "}
                      {Math.max(
                        0,
                        (Number(formData.amount) || 0) -
                          (Number(formData.discount) || 0) -
                          (Number(formData.paidAmount) || 0),
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
                  Payment Method
              ================================================== */}

              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Payment Method
                </label>

                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className={neumorphicInset}
                >
                  <option value="CASH">Cash</option>

                  <option value="BANK">Bank</option>

                  <option value="ONLINE">Online</option>

                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* =================================================
                  Notes
              ================================================== */}

              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Notes / Remarks
                </label>

                <textarea
                  name="notes"
                  rows="3"
                  value={formData.notes}
                  onChange={handleChange}
                  className={`${neumorphicInset} resize-none`}
                  placeholder="Any additional notes..."
                />
              </div>

              {/* =================================================
                  Buttons
              ================================================== */}

              <div className="flex justify-end gap-3 pt-5 border-t border-slate-300/50">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#e0e5ec] shadow-[4px_4px_8px_rgb(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.5)] font-bold text-slate-600 active:scale-95 transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || students.length === 0}
                  className="px-7 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md active:scale-95 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "+ Add Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeeManagement;
