import { useEffect, useState } from "react";
import {
  createCategory,
  createExpense,
  deactivateCategory,
  deleteExpense,
  getCategories,
  getExpenses,
  updateExpense,
} from "../services/api";

function ExpensesPage({ currentUser }) {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);

  const [message, setMessage] = useState("Loading expenses...");
  const [categoryMessage, setCategoryMessage] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    category: "Bills",
    amount: "",
    date: "",
    note: "",
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
  });

  const [editingExpenseId, setEditingExpenseId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  async function fetchExpenses() {
    try {
      const data = await getExpenses();
      setExpenses(data);
      setMessage("");
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
      setMessage("Failed to load expenses. Please check the backend server.");
    }
  }

  async function fetchCategories() {
    try {
      const data = await getCategories();
      setCategories(data);

      if (data.length > 0 && !formData.category) {
        setFormData((currentFormData) => ({
          ...currentFormData,
          category: data[0].name,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setCategoryMessage("Failed to load categories. Please check the backend server.");
    }
  }

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  function handleCategoryInputChange(event) {
    const { name, value } = event.target;

    setCategoryFormData({
      ...categoryFormData,
      [name]: value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!currentUser) {
      setMessage("Please log in to add or update expenses.");
      return;
    }

    if (!formData.title || !formData.category || !formData.amount || !formData.date) {
      setMessage("Please fill in title, category, amount, and date.");
      return;
    }

    const expensePayload = {
      title: formData.title.trim(),
      category: formData.category,
      amount: Number(formData.amount),
      date: formData.date,
      note: formData.note.trim(),
    };

    try {
      if (editingExpenseId) {
        await updateExpense(editingExpenseId, expensePayload);
        setMessage("Expense updated successfully.");
        setEditingExpenseId(null);
      } else {
        await createExpense(expensePayload);
        setMessage("Expense added successfully.");
      }

      await fetchExpenses();

      setFormData({
        title: "",
        category: categories[0]?.name || "Bills",
        amount: "",
        date: "",
        note: "",
      });
    } catch (error) {
      console.error("Failed to save expense:", error);
      setMessage("Failed to save expense. Please check the backend server.");
    }
  }

  function handleEdit(expense) {
    if (!currentUser) {
      setMessage("Please log in to edit expenses.");
      return;
    }

    setEditingExpenseId(expense.id);

    setFormData({
      title: expense.title,
      category: expense.category,
      amount: String(expense.amount),
      date: expense.date,
      note: expense.note || "",
    });

    setMessage("Editing selected expense. Update the form and submit.");
  }

  function handleCancelEdit() {
    setEditingExpenseId(null);

    setFormData({
      title: "",
      category: categories[0]?.name || "Bills",
      amount: "",
      date: "",
      note: "",
    });

    setMessage("");
  }

  async function handleDelete(expenseId) {
    if (!currentUser) {
      setMessage("Please log in to delete expenses.");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this expense?");

    if (!confirmDelete) {
      return;
    }

    try {
      await deleteExpense(expenseId);
      await fetchExpenses();

      setMessage("Expense deleted successfully.");
    } catch (error) {
      console.error("Failed to delete expense:", error);
      setMessage("Failed to delete expense. Please check the backend server.");
    }
  }

  async function handleCreateCategory(event) {
    event.preventDefault();

    if (!currentUser) {
      setCategoryMessage("Please log in to manage categories.");
      return;
    }

    const categoryName = categoryFormData.name.trim();

    if (!categoryName) {
      setCategoryMessage("Please enter a category name.");
      return;
    }

    try {
      const newCategory = await createCategory({
        name: categoryName,
        description: categoryFormData.description.trim(),
      });

      await fetchCategories();

      setFormData({
        ...formData,
        category: newCategory.name,
      });

      setCategoryFormData({
        name: "",
        description: "",
      });

      setCategoryMessage("Category added successfully.");
    } catch (error) {
      console.error("Failed to create category:", error);
      setCategoryMessage(error.message || "Failed to create category.");
    }
  }

  async function handleDeactivateCategory(category) {
    if (!currentUser) {
      setCategoryMessage("Please log in to manage categories.");
      return;
    }

    const confirmDeactivate = window.confirm(
      `Deactivate "${category.name}"? Old expenses will still keep this category name.`
    );

    if (!confirmDeactivate) {
      return;
    }

    try {
      await deactivateCategory(category.id);
      await fetchCategories();

      if (formData.category === category.name) {
        setFormData({
          ...formData,
          category: "Bills",
        });
      }

      if (categoryFilter === category.name) {
        setCategoryFilter("All");
      }

      setCategoryMessage("Category deactivated successfully.");
    } catch (error) {
      console.error("Failed to deactivate category:", error);
      setCategoryMessage(error.message || "Failed to deactivate category.");
    }
  }

  function handleClearFilters() {
    setSearchTerm("");
    setCategoryFilter("All");
  }

  const categoryOptions = categories.map((category) => category.name);

  const filterCategories = [
    "All",
    ...new Set([
      ...categoryOptions,
      ...expenses.map((expense) => expense.category || "Uncategorised"),
    ]),
  ];

  const filteredExpenses = expenses.filter((expense) => {
    const searchValue = searchTerm.toLowerCase();

    const matchesSearch =
      expense.title.toLowerCase().includes(searchValue) ||
      (expense.note || "").toLowerCase().includes(searchValue);

    const matchesCategory =
      categoryFilter === "All" || expense.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalAmount = expenses.reduce((sum, expense) => {
    return sum + Number(expense.amount || 0);
  }, 0);

  const filteredTotalAmount = filteredExpenses.reduce((sum, expense) => {
    return sum + Number(expense.amount || 0);
  }, 0);

  return (
    <div className="page-grid">
      <section className="summary-section">
        <h2>Total Spending</h2>
        <p>
          All recorded expenses:
          <span className="total-amount">${totalAmount.toFixed(2)}</span>
        </p>

        <p className="chart-note">
          Filtered total: ${filteredTotalAmount.toFixed(2)} from{" "}
          {filteredExpenses.length} record(s)
        </p>
      </section>

      {currentUser ? (
        <section className="form-section">
          <h2>{editingExpenseId ? "Edit Expense" : "Add New Expense"}</h2>

          {message && !message.includes("Loading") && (
            <div
              className={
                message.includes("successfully")
                  ? "app-message success"
                  : message.includes("Failed")
                  ? "app-message error"
                  : "app-message warning"
              }
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input
                name="title"
                type="text"
                placeholder="e.g. Lunch, Rent, Transport"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                {categoryOptions.map((categoryName) => (
                  <option key={categoryName}>{categoryName}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Amount</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Note</label>
              <textarea
                name="note"
                rows="3"
                placeholder="Optional note"
                value={formData.note}
                onChange={handleInputChange}
              ></textarea>
            </div>

            <button type="submit">
              {editingExpenseId ? "Update Expense" : "Add Expense"}
            </button>

            {editingExpenseId && (
              <button
                type="button"
                className="secondary-btn"
                onClick={handleCancelEdit}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </section>
      ) : (
        <section className="form-section">
          <h2>Add New Expense</h2>
          <div className="app-message warning">
            Please log in to add, edit, or delete expenses.
          </div>
        </section>
      )}

      {currentUser ? (
        <section className="form-section">
          <h2>Category Management</h2>
          <p className="chart-note">
            Add new categories here. Deactivated categories are removed from future
            selection, but old expense records will keep their original category names.
          </p>

          {categoryMessage && (
            <div
              className={
                categoryMessage.includes("successfully")
                  ? "app-message success"
                  : categoryMessage.includes("Failed") ||
                    categoryMessage.includes("cannot") ||
                    categoryMessage.includes("exists")
                  ? "app-message error"
                  : "app-message warning"
              }
            >
              {categoryMessage}
            </div>
          )}

          <form onSubmit={handleCreateCategory}>
            <div className="form-group">
              <label>New Category Name</label>
              <input
                name="name"
                type="text"
                placeholder="e.g. Health, Study, Travel"
                value={categoryFormData.name}
                onChange={handleCategoryInputChange}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                rows="2"
                placeholder="Optional category description"
                value={categoryFormData.description}
                onChange={handleCategoryInputChange}
              ></textarea>
            </div>

            <button type="submit">Add Category</button>
          </form>

          <div className="category-chip-list">
            {categories.map((category) => (
              <div className="category-chip" key={category.id}>
                <div>
                  <strong>{category.name}</strong>
                  <small>
                    {category.is_default ? "Default category" : "Custom category"}
                  </small>
                </div>

                {!category.is_default && (
                  <button
                    type="button"
                    className="category-deactivate-btn"
                    onClick={() => handleDeactivateCategory(category)}
                  >
                    Deactivate
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="form-section">
          <h2>Category Management</h2>
          <div className="app-message warning">
            Please log in to manage categories.
          </div>
        </section>
      )}

      <section className="list-section">
        <div className="chart-header">
          <div>
            <h2>Expense Records</h2>
            <p className="chart-note">
              Search and filter your expense records without reloading the page.
            </p>
          </div>
        </div>

        <div className="chart-filter-row">
          <div className="chart-filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by title or note"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="chart-filter-group">
            <label>Category</label>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              {filterCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="chart-filter-group">
            <label>&nbsp;</label>
            <button
              type="button"
              className="secondary-filter-btn"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {message === "Loading expenses..." && (
          <div className="app-message warning">{message}</div>
        )}

        {!message && expenses.length === 0 && (
          <p className="empty-message">No expenses found.</p>
        )}

        {!message && expenses.length > 0 && filteredExpenses.length === 0 && (
          <p className="empty-message">No matching expenses found.</p>
        )}

        {filteredExpenses.length > 0 && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Note</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.title}</td>
                    <td>{expense.category}</td>
                    <td>${Number(expense.amount).toFixed(2)}</td>
                    <td>{expense.date}</td>
                    <td>{expense.note || "-"}</td>
                    <td>
                      {currentUser ? (
                        <>
                          <button
                            type="button"
                            className="action-btn edit-btn"
                            onClick={() => handleEdit(expense)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(expense.id)}
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="locked-action">Login required</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default ExpensesPage;