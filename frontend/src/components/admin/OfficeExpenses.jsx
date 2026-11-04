import React, { useEffect, useMemo, useState } from "react";
import { apiCall } from "../../services/api";

function OfficeExpenses() {
  const today = new Date().toISOString().split("T")[0];

  const emptyForm = {
    category: "Utilities",
    description: "",
    amount: "",
    date: today,
    paymentMethod: "CASH",
    reference: "",
  };

  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [formData, setFormData] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const neumorphicCard =
    "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-2xl p-6 border border-white/50";

  const neumorphicInset =
    "bg-[#e0e5ec] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] rounded-xl px-4 py-2.5 border border-white/20 outline-none text-slate-700 font-medium text-xs w-full";

  // Backend Transaction model accepts ONLY these categories.
  const categories = [
    "Fee",
    "Salary",
    "Maintenance",
    "Transport",
    "Utilities",
    "Stationery",
    "Donation",
    "Event",
    "Other",
  ];

  // Backend Transaction model accepts these payment methods.
  const paymentMethods = [
    { value: "CASH", label: "Cash" },
    { value: "BANK", label: "Bank" },
    { value: "ONLINE", label: "Online" },
    { value: "OTHER", label: "Other" },
  ];

  // =========================================================
  // Load Expenses / Transactions
  // GET /api/transactions
  // =========================================================

  const loadExpenses = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const result = await apiCall(
        "/transactions?type=EXPENSE&limit=100",
        "GET"
      );

      console.log("Expenses GET response:", result);

      if (!result.success) {
        setErrorMsg(
          result.message || "Failed to load office expenses."
        );
        return;
      }

      const transactionList =
        result.data?.data?.transactions || [];

      setExpenses(transactionList);
    } catch (error) {
      console.error("Load expenses error:", error);

      setErrorMsg(
        error.message || "Unable to load office expenses."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // Load Financial Summary
  // GET /api/transactions/summary
  // =========================================================

  const loadSummary = async () => {
    try {
      const result = await apiCall(
        "/transactions/summary",
        "GET"
      );

      console.log("Transaction summary response:", result);

      if (!result.success) {
        return;
      }

      const data = result.data?.data || {};

      setSummary({
        totalIncome: Number(data.totalIncome || 0),
        totalExpense: Number(data.totalExpense || 0),
        balance: Number(data.balance || 0),
      });
    } catch (error) {
      console.error("Load summary error:", error);
    }
  };

  // =========================================================
  // Initial Load
  // =========================================================

  useEffect(() => {
    loadExpenses();
    loadSummary();
  }, []);

  // =========================================================
  // Refresh
  // =========================================================

  const refreshData = async () => {
    setSuccessMsg("");
    await Promise.all([
      loadExpenses(),
      loadSummary(),
    ]);
  };

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

  // =========================================================
  // Open Add Modal
  // =========================================================

  const openAddModal = () => {
    setEditingExpense(null);
    setErrorMsg("");

    setFormData({
      ...emptyForm,
      date: today,
    });

    setShowModal(true);
  };

  // =========================================================
  // Open Edit Modal
  // =========================================================

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setErrorMsg("");

    const dateValue = expense.date
      ? new Date(expense.date).toISOString().split("T")[0]
      : today;

    setFormData({
      category: expense.category || "Other",
      description: expense.description || "",
      amount: expense.amount ?? "",
      date: dateValue,
      paymentMethod: expense.paymentMethod || "CASH",
      reference: expense.reference || "",
    });

    setShowModal(true);
  };

  // =========================================================
  // Close Modal
  // =========================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingExpense(null);
    setErrorMsg("");
  };

  // =========================================================
  // Save Expense
  //
  // POST /api/transactions
  // PUT  /api/transactions/:id
  // =========================================================

  const handleSaveExpense = async (e) => {
    e.preventDefault();

    setErrorMsg("");
    setSuccessMsg("");

    const description =
      formData.description.trim();

    const amount = Number(formData.amount);

    if (!description) {
      setErrorMsg(
        "Please enter expense description."
      );
      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setErrorMsg(
        "Amount must be greater than zero."
      );
      return;
    }

    if (!formData.category) {
      setErrorMsg(
        "Please select a category."
      );
      return;
    }

    const payload = {
      type: "EXPENSE",
      category: formData.category,
      description,
      amount,
      date: formData.date || today,
      paymentMethod:
        formData.paymentMethod || "CASH",
      reference:
        formData.reference.trim(),
    };

    console.log(
      editingExpense
        ? "Updating expense:"
        : "Creating expense:",
      payload
    );

    setSaving(true);

    try {
      let result;

      if (editingExpense?._id) {
        result = await apiCall(
          `/transactions/${editingExpense._id}`,
          "PUT",
          payload
        );
      } else {
        result = await apiCall(
          "/transactions",
          "POST",
          payload
        );
      }

      console.log(
        "Expense save response:",
        result
      );

      if (!result.success) {
        setErrorMsg(
          result.message ||
            "Failed to save office expense."
        );
        return;
      }

      setSuccessMsg(
        editingExpense
          ? "Expense updated successfully."
          : "Expense added successfully."
      );

      setShowModal(false);
      setEditingExpense(null);
      setFormData({
        ...emptyForm,
        date: today,
      });

      await Promise.all([
        loadExpenses(),
        loadSummary(),
      ]);

      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    } catch (error) {
      console.error(
        "Save expense error:",
        error
      );

      setErrorMsg(
        error.message ||
          "Unable to save expense."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // Delete Expense
  //
  // DELETE /api/transactions/:id
  // =========================================================

  const handleDeleteExpense = async (expense) => {
    if (!expense?._id) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${expense.description}" expense of PKR ${Number(
        expense.amount || 0
      ).toLocaleString()}?`
    );

    if (!confirmed) {
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    setDeletingId(expense._id);

    try {
      const result = await apiCall(
        `/transactions/${expense._id}`,
        "DELETE"
      );

      console.log(
        "Expense delete response:",
        result
      );

      if (!result.success) {
        setErrorMsg(
          result.message ||
            "Failed to delete expense."
        );
        return;
      }

      setSuccessMsg(
        "Expense deleted successfully."
      );

      await Promise.all([
        loadExpenses(),
        loadSummary(),
      ]);

      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    } catch (error) {
      console.error(
        "Delete expense error:",
        error
      );

      setErrorMsg(
        error.message ||
          "Unable to delete expense."
      );
    } finally {
      setDeletingId("");
    }
  };

  // =========================================================
  // Filter Expenses
  // =========================================================

  const filteredExpenses = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

    return expenses.filter((expense) => {
      const description =
        expense.description || "";

      const category =
        expense.category || "";

      const reference =
        expense.reference || "";

      const matchesSearch =
        !search ||
        description
          .toLowerCase()
          .includes(search) ||
        category
          .toLowerCase()
          .includes(search) ||
        reference
          .toLowerCase()
          .includes(search);

      const matchesCategory =
        categoryFilter === "All" ||
        category === categoryFilter;

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    expenses,
    searchTerm,
    categoryFilter,
  ]);

  // =========================================================
  // Visible Total
  // =========================================================

  const visibleExpenseTotal =
    filteredExpenses.reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

  // =========================================================
  // Format Date
  // =========================================================

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

  // =========================================================
  // Loading Screen
  // =========================================================

  if (loading) {
    return (
      <div className="p-6 bg-[#e0e5ec] min-h-screen font-sans text-slate-700 flex items-center justify-center">
        <div className={neumorphicCard}>
          <p className="text-xs font-bold text-slate-500 animate-pulse">
            Loading office expenses from database...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="p-6 bg-[#e0e5ec] min-h-screen font-sans text-slate-700">

      {/* =====================================================
          Header
      ====================================================== */}

      <div
        className={`${neumorphicCard} mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}
      >
        <div>
          <h1 className="text-sm font-black text-slate-800">
            Office Expenses
          </h1>

          <p className="text-xs text-slate-400">
            Manage and track office expenses
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={refreshData}
            className="flex-1 md:flex-none bg-[#e0e5ec] shadow-[4px_4px_8px_rgb(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.5)] text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs active:scale-95 transition"
          >
            ↻ Refresh
          </button>

          <button
            onClick={openAddModal}
            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md active:scale-95 transition"
          >
            + Add Expense
          </button>
        </div>
      </div>

      {/* =====================================================
          Success
      ====================================================== */}

      {successMsg && (
        <div className="mb-6 p-3 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold text-center">
          ✅ {successMsg}
        </div>
      )}

      {/* =====================================================
          Error
      ====================================================== */}

      {errorMsg && !showModal && (
        <div className="mb-6 p-3 bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* =====================================================
          Summary
      ====================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

        <div className={neumorphicCard}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Total Expenses
          </p>

          <h3 className="text-lg font-black text-rose-600">
            PKR{" "}
            {summary.totalExpense.toLocaleString()}
          </h3>
        </div>

        <div className={neumorphicCard}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Current Balance
          </p>

          <h3
            className={`text-lg font-black ${
              summary.balance >= 0
                ? "text-emerald-600"
                : "text-rose-600"
            }`}
          >
            PKR{" "}
            {summary.balance.toLocaleString()}
          </h3>
        </div>

        <div className={neumorphicCard}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Showing Expenses
          </p>

          <h3 className="text-lg font-black text-blue-600">
            PKR{" "}
            {visibleExpenseTotal.toLocaleString()}
          </h3>
        </div>

      </div>

      {/* =====================================================
          Filters
      ====================================================== */}

      <div
        className={`${neumorphicCard} mb-6 flex flex-col md:flex-row gap-4 items-center`}
      >
        <div className="w-full md:flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            placeholder="Search description, category or reference..."
            className={neumorphicInset}
          />
        </div>

        <div className="w-full md:w-56">
          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value)
            }
            className={neumorphicInset}
          >
            <option value="All">
              All Categories
            </option>

            {categories.map((category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* =====================================================
          Expense List
      ====================================================== */}

      <div className={neumorphicCard}>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Expense Records
            </h3>

            <p className="text-[10px] text-slate-400 mt-1">
              {filteredExpenses.length} record(s) found
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left border-collapse text-xs">

            <thead>
              <tr className="border-b border-slate-300 text-slate-500 uppercase">

                <th className="pb-3 pr-4">
                  Date
                </th>

                <th className="pb-3 pr-4">
                  Category
                </th>

                <th className="pb-3 pr-4">
                  Description
                </th>

                <th className="pb-3 pr-4">
                  Amount
                </th>

                <th className="pb-3 pr-4">
                  Method
                </th>

                <th className="pb-3 pr-4">
                  Reference
                </th>

                <th className="pb-3 text-right">
                  Action
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">

              {filteredExpenses.length > 0 ? (
                filteredExpenses.map(
                  (expense) => (
                    <tr
                      key={expense._id}
                      className="hover:bg-white/40 transition"
                    >

                      <td className="py-3 pr-4 text-slate-600 whitespace-nowrap">
                        {formatDate(
                          expense.date
                        )}
                      </td>

                      <td className="py-3 pr-4">
                        <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg font-bold text-[10px]">
                          {expense.category}
                        </span>
                      </td>

                      <td className="py-3 pr-4 font-bold text-slate-800">
                        {expense.description}
                      </td>

                      <td className="py-3 pr-4 text-rose-600 font-bold font-mono whitespace-nowrap">
                        PKR{" "}
                        {Number(
                          expense.amount || 0
                        ).toLocaleString()}
                      </td>

                      <td className="py-3 pr-4 text-slate-600">
                        {expense.paymentMethod ||
                          "CASH"}
                      </td>

                      <td className="py-3 pr-4 text-slate-500">
                        {expense.reference ||
                          "-"}
                      </td>

                      <td className="py-3 text-right">

                        <div className="flex justify-end gap-2">

                          <button
                            onClick={() =>
                              openEditModal(
                                expense
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-[#e0e5ec] shadow-[2px_2px_5px_rgb(163,177,198,0.6),-2px_-2px_5px_rgba(255,255,255,0.7)] text-blue-600 font-bold text-[10px] active:scale-95 transition"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteExpense(
                                expense
                              )
                            }
                            disabled={
                              deletingId ===
                              expense._id
                            }
                            className="px-3 py-1.5 rounded-lg bg-[#e0e5ec] shadow-[2px_2px_5px_rgb(163,177,198,0.6),-2px_-2px_5px_rgba(255,255,255,0.7)] text-rose-600 font-bold text-[10px] active:scale-95 transition disabled:opacity-50"
                          >
                            {deletingId ===
                            expense._id
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </div>

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
                    No expense records found.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>
      </div>

      {/* =====================================================
          Add / Edit Modal
      ====================================================== */}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">

          <div
            className={`${neumorphicCard} w-full max-w-xl bg-[#e0e5ec] max-h-[92vh] overflow-y-auto`}
          >

            {/* Modal Header */}

            <div className="flex justify-between items-center mb-5">

              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {editingExpense
                    ? "Edit Office Expense"
                    : "Add Office Expense"}
                </h3>

                <p className="text-[10px] text-slate-500 mt-1">
                  Saved directly to the financial transactions database.
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

            {/* Modal Error */}

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                ⚠️ {errorMsg}
              </div>
            )}

            <form
              onSubmit={handleSaveExpense}
              className="space-y-4"
            >

              {/* Category + Amount */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Category
                  </label>

                  <select
                    name="category"
                    value={
                      formData.category
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                    className={
                      neumorphicInset
                    }
                  >

                    {categories.map(
                      (category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      )
                    )}

                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Amount (PKR)
                  </label>

                  <input
                    type="number"
                    name="amount"
                    min="0.01"
                    step="0.01"
                    value={
                      formData.amount
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                    className={
                      neumorphicInset
                    }
                    placeholder="Enter amount"
                  />
                </div>

              </div>

              {/* Description */}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Description
                </label>

                <textarea
                  name="description"
                  rows="3"
                  value={
                    formData.description
                  }
                  onChange={
                    handleInputChange
                  }
                  required
                  className={`${neumorphicInset} resize-none`}
                  placeholder="e.g. Electricity bill for office"
                />
              </div>

              {/* Date + Method */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Date
                  </label>

                  <input
                    type="date"
                    name="date"
                    value={
                      formData.date
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                    className={
                      neumorphicInset
                    }
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Payment Method
                  </label>

                  <select
                    name="paymentMethod"
                    value={
                      formData.paymentMethod
                    }
                    onChange={
                      handleInputChange
                    }
                    className={
                      neumorphicInset
                    }
                  >

                    {paymentMethods.map(
                      (method) => (
                        <option
                          key={
                            method.value
                          }
                          value={
                            method.value
                          }
                        >
                          {method.label}
                        </option>
                      )
                    )}

                  </select>
                </div>

              </div>

              {/* Reference */}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Reference (Optional)
                </label>

                <input
                  type="text"
                  name="reference"
                  value={
                    formData.reference
                  }
                  onChange={
                    handleInputChange
                  }
                  className={
                    neumorphicInset
                  }
                  placeholder="Invoice / bill number"
                />
              </div>

              {/* Buttons */}

              <div className="flex justify-end gap-3 pt-5 border-t border-slate-300">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#e0e5ec] shadow-[3px_3px_6px_rgb(163,177,198,0.6),-3px_-3px_6px_rgba(255,255,255,0.8)] text-slate-600 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingExpense
                    ? "Update Expense"
                    : "Save Expense"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default OfficeExpenses;
