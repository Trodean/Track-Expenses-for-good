import { useEffect, useMemo, useState } from "react";
import { getExpenses } from "../services/api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PIE_COLORS = [
  "#7bbf8e",
  "#f0c96c",
  "#d97b6c",
  "#4a63df",
  "#9cc7df",
  "#e59e23",
  "#b78ad6",
  "#69ab7c",
];

function DashboardPage() {
  const [expenses, setExpenses] = useState([]);
  const [message, setMessage] = useState("Loading dashboard data...");

  const [pieMonth, setPieMonth] = useState("");
  const [barFromMonth, setBarFromMonth] = useState("");
  const [barToMonth, setBarToMonth] = useState("");
  const [barCategoryFilter, setBarCategoryFilter] = useState("All");

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const data = await getExpenses();

        setExpenses(data);
        setMessage("");

        const availableMonths = [
          ...new Set(
            data
              .filter((expense) => expense.date)
              .map((expense) => expense.date.slice(0, 7))
          ),
        ].sort();

        if (availableMonths.length > 0) {
          setPieMonth(availableMonths[availableMonths.length - 1]);

          if (availableMonths.length >= 2) {
            setBarFromMonth(availableMonths[0]);
            setBarToMonth(availableMonths[availableMonths.length - 1]);
          } else {
            setBarFromMonth(availableMonths[0]);
            setBarToMonth(availableMonths[0]);
          }
        }

        setBarCategoryFilter("All");
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        setMessage("Failed to load dashboard data. Please check the backend server.");
      }
    }

    fetchDashboardData();
  }, []);

  const availableMonths = useMemo(() => {
    return [
      ...new Set(
        expenses
          .filter((expense) => expense.date)
          .map((expense) => expense.date.slice(0, 7))
      ),
    ].sort();
  }, [expenses]);

  const availableCategories = useMemo(() => {
    const categories = [
      ...new Set(expenses.map((expense) => expense.category || "Uncategorised")),
    ].sort();

    return ["All", ...categories];
  }, [expenses]);

  const totalAmount = expenses.reduce((sum, expense) => {
    return sum + Number(expense.amount || 0);
  }, 0);

  const highestExpense = expenses.reduce((highest, expense) => {
    if (!highest || Number(expense.amount) > Number(highest.amount)) {
      return expense;
    }

    return highest;
  }, null);

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  const pieExpenses = useMemo(() => {
    if (!pieMonth) {
      return [];
    }

    return expenses.filter((expense) => {
      const expenseMonth = expense.date ? expense.date.slice(0, 7) : "";
      return expenseMonth === pieMonth;
    });
  }, [expenses, pieMonth]);

  const pieChartData = useMemo(() => {
    const categoryTotals = {};

    pieExpenses.forEach((expense) => {
      const category = expense.category || "Uncategorised";
      const amount = Number(expense.amount || 0);

      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    });

    return Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        category,
        amount: Number(amount.toFixed(2)),
      }));
  }, [pieExpenses]);

  const pieTotalAmount = pieChartData.reduce((sum, item) => {
    return sum + Number(item.amount || 0);
  }, 0);

  const barExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseMonth = expense.date ? expense.date.slice(0, 7) : "";

      const matchesFromMonth = !barFromMonth || expenseMonth >= barFromMonth;
      const matchesToMonth = !barToMonth || expenseMonth <= barToMonth;
      const matchesCategory =
        barCategoryFilter === "All" || expense.category === barCategoryFilter;

      return matchesFromMonth && matchesToMonth && matchesCategory;
    });
  }, [expenses, barFromMonth, barToMonth, barCategoryFilter]);

  const barCategories = useMemo(() => {
    return [
      ...new Set(barExpenses.map((expense) => expense.category || "Uncategorised")),
    ].sort();
  }, [barExpenses]);

  const barChartData = useMemo(() => {
    const monthMap = {};

    barExpenses.forEach((expense) => {
      const month = expense.date ? expense.date.slice(0, 7) : "Unknown";
      const category = expense.category || "Uncategorised";
      const amount = Number(expense.amount || 0);

      if (!monthMap[month]) {
        monthMap[month] = { month };
      }

      monthMap[month][category] = (monthMap[month][category] || 0) + amount;
    });

    return Object.values(monthMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((item) => {
        const formattedItem = { ...item };

        barCategories.forEach((category) => {
          formattedItem[category] = Number((formattedItem[category] || 0).toFixed(2));
        });

        return formattedItem;
      });
  }, [barExpenses, barCategories]);

  const barRangeMonthCount = useMemo(() => {
    return new Set(
      barExpenses
        .filter((expense) => expense.date)
        .map((expense) => expense.date.slice(0, 7))
    ).size;
  }, [barExpenses]);

  const barRangeWarning =
    barFromMonth && barToMonth && barFromMonth === barToMonth
      ? "Bar chart is designed for comparing at least two months. Please select a wider month range."
      : "";

  return (
    <div className="page-grid">
      <section className="summary-section">
        <h2>Dashboard Overview</h2>

        {message && (
          <div
            className={
              message.includes("Failed")
                ? "app-message error"
                : "app-message warning"
            }
          >
            {message}
          </div>
        )}

        {!message && (
          <div className="dashboard-stats">
            <div className="stat-card">
              <span className="stat-label">Total Spending</span>
              <strong>${totalAmount.toFixed(2)}</strong>
            </div>

            <div className="stat-card">
              <span className="stat-label">Expense Records</span>
              <strong>{expenses.length}</strong>
            </div>

            <div className="stat-card">
              <span className="stat-label">Highest Expense</span>
              <strong>
                {highestExpense
                  ? `$${Number(highestExpense.amount).toFixed(2)}`
                  : "$0.00"}
              </strong>
              <small>{highestExpense ? highestExpense.title : "No data yet"}</small>
            </div>
          </div>
        )}
      </section>

      <section className="chart-section">
        <div className="chart-header">
          <div>
            <h2>Monthly Category Ratio</h2>
            <p className="chart-note">
              Select one month to view the spending proportion across categories.
            </p>
          </div>
        </div>

        <div className="chart-filter-row dashboard-filter-row">
          <div className="chart-filter-group">
            <label>Pie Chart Month</label>
            <input
              type="month"
              value={pieMonth}
              onChange={(event) => setPieMonth(event.target.value)}
            />
          </div>
        </div>

        {!message && pieChartData.length === 0 && (
          <p className="empty-message">No expenses found for this month.</p>
        )}

        {!message && pieChartData.length > 0 && (
          <div className="chart-layout single-chart">
            <div className="chart-canvas-box">
              <h3>{pieMonth} Category Breakdown</h3>
              <p className="chart-note">
                Total for this month: ${pieTotalAmount.toFixed(2)}
              </p>

              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    dataKey="amount"
                    nameKey="category"
                    outerRadius={110}
                    label={({ category, percent }) =>
                      `${category} ${(percent * 100).toFixed(1)}%`
                    }
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={entry.category}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      <section className="chart-section">
        <div className="chart-header">
          <div>
            <h2>Monthly Category Comparison</h2>
            <p className="chart-note">
              Select a month range and an optional category to compare spending across months.
            </p>
          </div>
        </div>

        <div className="chart-filter-row dashboard-filter-row">
          <div className="chart-filter-group">
            <label>From Month</label>
            <input
              type="month"
              value={barFromMonth}
              onChange={(event) => setBarFromMonth(event.target.value)}
            />
          </div>

          <div className="chart-filter-group">
            <label>To Month</label>
            <input
              type="month"
              value={barToMonth}
              onChange={(event) => setBarToMonth(event.target.value)}
            />
          </div>

          <div className="chart-filter-group">
            <label>Category</label>
            <select
              value={barCategoryFilter}
              onChange={(event) => setBarCategoryFilter(event.target.value)}
            >
              {availableCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {barRangeWarning && (
          <div className="app-message warning">{barRangeWarning}</div>
        )}

        {!message && barChartData.length === 0 && (
          <p className="empty-message">No expenses found for this month range.</p>
        )}

        {!message && barChartData.length > 0 && (
          <div className="chart-layout single-chart">
            <div className="chart-canvas-box line-chart-box">
              <h3>Category Spending by Month</h3>
              <p className="chart-note">
                Showing {barRangeMonthCount} month(s)
                {barCategoryFilter === "All"
                  ? ` and ${barCategories.length} categor(y/ies).`
                  : ` for ${barCategoryFilter}.`}
              </p>

              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Legend />
                  {barCategories.map((category, index) => (
                    <Bar
                      key={category}
                      dataKey={category}
                      stackId="spending"
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      <section className="list-section">
        <h2>Recent Spending List</h2>
        <p className="chart-note">This list shows the latest expense records.</p>

        {!message && recentExpenses.length === 0 && (
          <p className="empty-message">No recent expense records found.</p>
        )}

        {!message && recentExpenses.length > 0 && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Note</th>
                </tr>
              </thead>

              <tbody>
                {recentExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.title}</td>
                    <td>{expense.category}</td>
                    <td>${Number(expense.amount).toFixed(2)}</td>
                    <td>{expense.date}</td>
                    <td>{expense.note || "-"}</td>
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

export default DashboardPage;