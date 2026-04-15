"use client";

import { useState } from "react";
import { Expense, MonthData } from "./types/finance";

export default function Home() {
  const [months, setMonths] = useState<MonthData[]>([]);

  const [year, setYear] = useState("2026");
  const [month, setMonth] = useState("04");

  const [salaryInput, setSalaryInput] = useState(0);

  // 🔥 Default object (single source of truth)
  const defaultExpenseInput = {
    amount: 0,
    category: "Enjoyment" as Expense["category"],
    note: ""
  };

  // 🔥 Form state
  const [expenseInput, setExpenseInput] = useState(defaultExpenseInput);

  const selectedMonth = `${year}-${month}`;

  // 🔥 Set Salary
  const setSalary = () => {
    setMonths(prev => {
      const exists = prev.find(m => m.month === selectedMonth);

      if (!exists) {
        return [
          ...prev,
          {
            month: selectedMonth,
            salary: salaryInput,
            expenses: []
          }
        ];
      }

      return prev.map(m =>
        m.month === selectedMonth
          ? { ...m, salary: salaryInput }
          : m
      );
    });
  };

  // 🔥 Add Expense
  const addExpense = () => {
    const newExpense: Expense = {
      id: Date.now(),
      amount: expenseInput.amount,
      category: expenseInput.category,
      date: new Date().toISOString(),
      note: expenseInput.note
    };

    setMonths(prev => {
      const exists = prev.find(m => m.month === selectedMonth);

      if (!exists) {
        return [
          ...prev,
          {
            month: selectedMonth,
            salary: 0,
            expenses: [newExpense]
          }
        ];
      }

      return prev.map(m =>
        m.month === selectedMonth
          ? { ...m, expenses: [...m.expenses, newExpense] }
          : m
      );
    });

    // 🔥 Reset form safely
    setExpenseInput({ ...defaultExpenseInput });
  };

  // 🔥 Get Current Month Data
  const currentData = months.find(m => m.month === selectedMonth);

  const totalSpent =
    currentData?.expenses.reduce((sum, e) => sum + e.amount, 0) || 0;

  const remaining = (currentData?.salary || 0) - totalSpent;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Expense Tracker</h1>

      {/* Month Selection */}
      <h2>Select Month</h2>
      <input
        type="number"
        value={year}
        onChange={e => setYear(e.target.value)}
        placeholder="Year"
      />

      <select value={month} onChange={e => setMonth(e.target.value)}>
        <option value="01">Jan</option>
        <option value="02">Feb</option>
        <option value="03">Mar</option>
        <option value="04">Apr</option>
        <option value="05">May</option>
        <option value="06">Jun</option>
        <option value="07">Jul</option>
        <option value="08">Aug</option>
        <option value="09">Sep</option>
        <option value="10">Oct</option>
        <option value="11">Nov</option>
        <option value="12">Dec</option>
      </select>

      <h3>Selected: {selectedMonth}</h3>

      {/* Salary */}
      <h2>Set Salary</h2>
      <input
        type="number"
        value={salaryInput}
        onChange={e => setSalaryInput(Number(e.target.value))}
        placeholder="Enter salary"
      />
      <button onClick={setSalary}>Set Salary</button>

      {/* Expense Form */}
      <h2>Add Expense</h2>

      <input
        type="number"
        value={expenseInput.amount}
        onChange={e =>
          setExpenseInput(prev => ({
            ...prev,
            amount: Number(e.target.value)
          }))
        }
        placeholder="Amount"
      />

      <select
        value={expenseInput.category}
        onChange={e =>
          setExpenseInput(prev => ({
            ...prev,
            category: e.target.value as Expense["category"]
          }))
        }
      >
        <option value="Enjoyment">Enjoyment</option>
        <option value="Investment">Investment</option>
        <option value="Responsibilities">Responsibilities</option>
        <option value="Healthy-Life">Healthy Life</option>
      </select>

      <input
        type="text"
        value={expenseInput.note}
        onChange={e =>
          setExpenseInput(prev => ({
            ...prev,
            note: e.target.value
          }))
        }
        placeholder="Note"
      />

      <button onClick={addExpense}>Add Expense</button>

      {/* Summary */}
      <h2>Summary</h2>
      <p>Salary: ₹{currentData?.salary || 0}</p>
      <p>Spent: ₹{totalSpent}</p>
      <p>Remaining: ₹{remaining}</p>

      {/* Expense List */}
      <h2>Expenses</h2>
      <ul>
        {currentData?.expenses.map(e => (
          <li key={e.id}>
            ₹{e.amount} - {e.category} ({e.note})
          </li>
        ))}
      </ul>
    </div>
  );
}