
"use strict";

// ==========================================
// 1. GET HTML ELEMENTS
// ==========================================

const balance = document.getElementById("balance");
const income = document.getElementById("income-amount");
const expenses = document.getElementById("expenses-amount");
const transactionHistory = document.getElementById("transaction_history");

const transactionForm = document.getElementById("transaction-form");
const trnType = document.getElementById("trn-type");
const trnCategory = document.getElementById("trn-category");
const trnAmount = document.getElementById("trn-amount");
const trnDescription = document.getElementById("trn-description");
const trnDate = document.getElementById("trn-date");
const addButton = document.getElementById("add-button");
const formHeading = document.getElementById("form-heading");

const filterType = document.getElementById("filter-type");
const filterCategory = document.getElementById("filter-category");
const filterFrom = document.getElementById("filter-from");
const filterTo = document.getElementById("filter-to");

const reportPanel = document.getElementById("report-panel");
const alertContainer = document.getElementById("alert-container");

// ==========================================
// 2. APPLICATION STATE
// ==========================================

const STORAGE_KEY = "_transactions";

let transactions = [];
let filteredTransactions = [];
let editingId = null;
let alertTimer = null;

// ==========================================
// 3. LOAD SAVED TRANSACTIONS
// ==========================================

try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const parsedData = savedData ? JSON.parse(savedData) : [];

    if (Array.isArray(parsedData)) {
        transactions = parsedData.filter(transaction =>
            transaction &&
            typeof transaction.id === "string" &&
            (transaction.type === "Income" ||
                transaction.type === "Expense") &&
            typeof transaction.amount === "number" &&
            Number.isFinite(transaction.amount) &&
            transaction.amount > 0 &&
            typeof transaction.category === "string" &&
            typeof transaction.description === "string" &&
            typeof transaction.date === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(transaction.date)
        );
    }
} catch (error) {
    console.error("Unable to load saved transactions:", error);
    showAlert("Unable to read saved transactions from this browser.", "danger");
}

filteredTransactions = [...transactions];

// Set today's date for a new transaction.
function getLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

trnDate.value = getLocalDate();

// ==========================================
// 4. FORMAT CURRENCY
// ==========================================

function formatAmount(amount) {
    return Number(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// ==========================================
// 5. ALERT MESSAGES
// ==========================================

function showAlert(message, type = "danger") {
    if (alertTimer !== null) {
        clearTimeout(alertTimer);
        alertTimer = null;
    }

    alertContainer.replaceChildren();

    const alert = document.createElement("div");
    alert.className =
        `alert alert-${type} alert-dismissible fade show`;
    alert.setAttribute("role", "alert");

    alert.appendChild(document.createTextNode(message));

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "btn-close";
    closeButton.setAttribute("data-bs-dismiss", "alert");
    closeButton.setAttribute("aria-label", "Close");

    closeButton.addEventListener("click", () => {
        if (alertTimer !== null) {
            clearTimeout(alertTimer);
            alertTimer = null;
        }
    });

    alert.appendChild(closeButton);
    alertContainer.appendChild(alert);

    // Automatically close the alert after 5 seconds.
    alertTimer = setTimeout(() => {
        if (alert.isConnected) {
            alert.remove();
        }
        alertTimer = null;
    }, 5000);
}

// ==========================================
// 6. SAVE TRANSACTIONS
// ==========================================

function saveTransactions() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(transactions)
        );

        return true;
    } catch (error) {
        console.error("Unable to save transactions:", error);
        showAlert(
            "Unable to save data. Check your browser storage settings.",
            "danger"
        );

        return false;
    }
}

// ==========================================
// 7. CALCULATE TOTALS
// ==========================================

function calculateTotal(type, list = transactions) {
    return list
        .filter(transaction => transaction.type === type)
        .reduce((total, transaction) => total + transaction.amount, 0);
}

function updateSummary() {
    const totalIncome = calculateTotal("Income");
    const totalExpenses = calculateTotal("Expense");
    const totalBalance = totalIncome - totalExpenses;

    income.textContent = formatAmount(totalIncome);
    expenses.textContent = formatAmount(totalExpenses);
    balance.textContent = formatAmount(totalBalance);
}

// ==========================================
// 8. RENDER TRANSACTION HISTORY
// ==========================================

function renderTransactions() {
    transactionHistory.replaceChildren();

    // Show newest transactions first.
    const sortedTransactions = [...filteredTransactions].sort(
        (a, b) => b.date.localeCompare(a.date) ||
            transactions.indexOf(b) - transactions.indexOf(a)
    );

    sortedTransactions.forEach(transaction => {
        const row = document.createElement("tr");

        // Date
        const dateCell = document.createElement("td");
        dateCell.textContent = transaction.date;

        // Description
        const descriptionCell = document.createElement("td");
        descriptionCell.textContent = transaction.description;

        // Category
        const categoryCell = document.createElement("td");
        categoryCell.textContent = transaction.category;

        // Type
        const typeCell = document.createElement("td");
        const typeBadge = document.createElement("span");

        typeBadge.className = transaction.type === "Income"
            ? "badge bg-success"
            : "badge bg-danger";

        typeBadge.textContent = transaction.type;
        typeCell.appendChild(typeBadge);

        // Amount
        const amountCell = document.createElement("td");
        amountCell.className = transaction.type === "Income"
            ? "text-success fw-bold"
            : "text-danger fw-bold";

        amountCell.textContent =
            (transaction.type === "Income" ? "+ ₹" : "- ₹") +
            formatAmount(transaction.amount);

        // Action buttons
        const actionCell = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "btn btn-primary btn-sm me-1 mb-1";
        editButton.innerHTML = '<i class="bi bi-pencil-square"></i> Edit';
        editButton.setAttribute("aria-label", "Edit transaction");
        editButton.addEventListener("click", () => {
            editTransaction(transaction.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "btn btn-danger btn-sm mb-1";
        deleteButton.innerHTML = '<i class="bi bi-trash"></i> Delete';
        deleteButton.setAttribute("aria-label", "Delete transaction");
        deleteButton.addEventListener("click", () => {
            deleteTransaction(transaction.id);
        });

        actionCell.append(editButton, deleteButton);

        row.append(
            dateCell,
            descriptionCell,
            categoryCell,
            typeCell,
            amountCell,
            actionCell
        );

        transactionHistory.appendChild(row);
    });

    // Empty state
    if (filteredTransactions.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 6;
        cell.className = "text-center text-muted py-4";
        cell.innerHTML =
            '<i class="bi bi-inbox fs-3 d-block mb-2"></i>' +
            "No transactions found.";

        row.appendChild(cell);
        transactionHistory.appendChild(row);
    }

    document.getElementById("transaction-count").textContent =
        `${filteredTransactions.length} transaction(s)`;

    // The summary always shows totals for ALL transactions.
    updateSummary();
}

// ==========================================
// 9. CLEAR FORM
// ==========================================

function clearForm() {
    transactionForm.reset();

    editingId = null;

    addButton.innerHTML =
        '<i class="bi bi-plus-lg"></i> Add Transaction';

    formHeading.innerHTML =
        '<i class="bi bi-plus-circle text-primary"></i> Add Transaction';

    trnDate.value = getLocalDate();
}

// ==========================================
// 10. ADD OR UPDATE TRANSACTION
// ==========================================

function addTransaction() {
    const type = trnType.value;
    const category = trnCategory.value;
    const amountText = trnAmount.value.trim();
    const description = trnDescription.value.trim();
    const date = trnDate.value;

    // Validate required fields.
    if (!type || !category || !amountText || !description || !date) {
        showAlert("Please fill in all the fields.", "danger");
        return;
    }

    const amount = Number(amountText);

    if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > 999999999999 ||
        !/^\d+(\.\d{1,2})?$/.test(amountText) ||
        Math.round(amount * 100) <= 0
    ) {
        showAlert(
            "Enter a valid positive amount with up to two decimal places.",
            "danger"
        );
        return;
    }

    if (description.length > 200) {
        showAlert("Description cannot exceed 200 characters.", "danger");
        return;
    }

    const isEditing = editingId !== null;

    const transaction = {
        id: editingId || (
            typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : Date.now().toString() +
                    Math.random().toString(36).slice(2)
        ),
        type,
        category,
        amount: Math.round(amount * 100) / 100,
        description,
        date
    };

    // Create a new array first, so a failed save does not
    // leave the in-memory transactions changed.
    let updatedTransactions;

    if (isEditing) {
        const index = transactions.findIndex(
            item => item.id === editingId
        );

        if (index === -1) {
            showAlert("Transaction not found.", "danger");
            clearForm();
            return;
        }

        updatedTransactions = [...transactions];
        updatedTransactions[index] = transaction;
    } else {
        updatedTransactions = [...transactions, transaction];
    }

    const previousTransactions = transactions;
    transactions = updatedTransactions;

    if (!saveTransactions()) {
        transactions = previousTransactions;
        return;
    }

    // A successful add or update clears the current filters.
    filteredTransactions = [...transactions];

    clearForm();
    renderTransactions();

    showAlert(
        isEditing
            ? "Transaction updated successfully!"
            : "Transaction added successfully!",
        "success"
    );
}

// ==========================================
// 11. EDIT TRANSACTION
// ==========================================

function editTransaction(id) {
    const transaction = transactions.find(item => item.id === id);

    if (!transaction) {
        showAlert("Transaction not found.", "danger");
        return;
    }

    trnType.value = transaction.type;
    trnCategory.value = transaction.category;
    trnAmount.value = transaction.amount.toFixed(2);
    trnDescription.value = transaction.description;
    trnDate.value = transaction.date;

    editingId = id;

    addButton.innerHTML =
        '<i class="bi bi-check-circle"></i> Update Transaction';

    formHeading.innerHTML =
        '<i class="bi bi-pencil-square text-primary"></i> Edit Transaction';

    transactionForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

// ==========================================
// 12. DELETE TRANSACTION
// ==========================================

function deleteTransaction(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) {
        return;
    }

    const previousTransactions = transactions;

    transactions = transactions.filter(
        transaction => transaction.id !== id
    );

    if (!saveTransactions()) {
        transactions = previousTransactions;
        return;
    }

    filteredTransactions = filteredTransactions.filter(
        transaction => transaction.id !== id
    );

    if (editingId === id) {
        clearForm();
    }

    renderTransactions();
    showAlert("Transaction deleted successfully.", "success");
}

// ==========================================
// 13. APPLY FILTERS
// ==========================================

function applyFilters() {
    const type = filterType.value;
    const category = filterCategory.value;
    const fromDate = filterFrom.value;
    const toDate = filterTo.value;

    if (fromDate && toDate && fromDate > toDate) {
        showAlert(
            "From Date cannot be later than To Date.",
            "danger"
        );
        return;
    }

    filteredTransactions = transactions.filter(transaction => {
        const matchesType =
            !type || transaction.type === type;

        const matchesCategory =
            !category || transaction.category === category;

        const matchesFromDate =
            !fromDate || transaction.date >= fromDate;

        const matchesToDate =
            !toDate || transaction.date <= toDate;

        return matchesType &&
            matchesCategory &&
            matchesFromDate &&
            matchesToDate;
    });

    renderTransactions();

    showAlert(
        `${filteredTransactions.length} transaction(s) match your filters.`,
        "info"
    );
}

// ==========================================
// 14. RESET FILTERS
// ==========================================

function resetFilters() {
    filterType.value = "";
    filterCategory.value = "";
    filterFrom.value = "";
    filterTo.value = "";

    filteredTransactions = [...transactions];

    renderTransactions();

    showAlert(
        "Filters cleared. Showing all transactions.",
        "success"
    );
}

// ==========================================
// 15. GENERATE REPORT
// ==========================================

function generateReport() {
    const list = filteredTransactions;

    const totalIncome = calculateTotal("Income", list);
    const totalExpenses = calculateTotal("Expense", list);
    const totalBalance = totalIncome - totalExpenses;

    document.getElementById("report-count").textContent = list.length;
    document.getElementById("report-income").textContent =
        formatAmount(totalIncome);

    document.getElementById("report-expenses").textContent =
        formatAmount(totalExpenses);

    document.getElementById("report-balance").textContent =
        formatAmount(totalBalance);

    const reportPeriod = document.getElementById("report-period");

    reportPeriod.textContent =
        "Report includes " + list.length +
        " transaction(s) currently displayed in Transaction History.";

    const tbody = document.getElementById("report-category-rows");
    tbody.replaceChildren();

    const categories = [...new Set(
        list.map(transaction => transaction.category)
    )].sort();

    if (categories.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 3;
        cell.className = "text-center text-muted";
        cell.textContent = "No transactions to report.";

        row.appendChild(cell);
        tbody.appendChild(row);
    } else {
        categories.forEach(category => {
            const categoryIncome = list
                .filter(transaction =>
                    transaction.category === category &&
                    transaction.type === "Income"
                )
                .reduce((sum, transaction) =>
                    sum + transaction.amount, 0);

            const categoryExpenses = list
                .filter(transaction =>
                    transaction.category === category &&
                    transaction.type === "Expense"
                )
                .reduce((sum, transaction) =>
                    sum + transaction.amount, 0);

            const row = document.createElement("tr");

            const categoryCell = document.createElement("td");
            categoryCell.textContent = category;

            const incomeCell = document.createElement("td");
            incomeCell.className = "text-success";
            incomeCell.textContent = "₹" + formatAmount(categoryIncome);

            const expenseCell = document.createElement("td");
            expenseCell.className = "text-danger";
            expenseCell.textContent = "₹" + formatAmount(categoryExpenses);

            row.append(categoryCell, incomeCell, expenseCell);
            tbody.appendChild(row);
        });
    }

    reportPanel.classList.remove("d-none");

    reportPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// ==========================================
// 16. CLOSE REPORT
// ==========================================

function closeReport() {
    reportPanel.classList.add("d-none");
}

// ==========================================
// 17. DOWNLOAD REPORT AS CSV
// ==========================================

function downloadReportCsv() {
    const rows = [
        ["Date", "Type", "Category", "Description", "Amount"],
        ...filteredTransactions.map(transaction => [
            transaction.date,
            transaction.type,
            transaction.category,
            transaction.description,
            transaction.amount.toFixed(2)
        ])
    ];

    // Escape CSV values correctly.
    const csv = rows.map(row =>
        row.map(value => {
            let text = String(value);

            // Prevent spreadsheet formulas from running when
            // user-entered text begins with formula characters.
            if (/^[\s]*[=+\-@]/.test(text)) {
                text = "'" + text;
            }

            return '"' + text.replace(/"/g, '""') + '"';
        }).join(",")
    ).join("\r\n");

    const blob = new Blob(
        ["\uFEFF", csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "personal-finance-report.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    // Delay revocation to allow the browser to begin downloading.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ==========================================
// 18. CONNECT BUTTON EVENTS
// ==========================================

transactionForm.addEventListener("submit", event => {
    event.preventDefault();
    addTransaction();
});

document.getElementById("cancel-button").addEventListener("click", () => {
    clearForm();
});

document.getElementById("apply-filter-button").addEventListener(
    "click",
    applyFilters
);

document.getElementById("reset-filter-button").addEventListener(
    "click",
    resetFilters
);

document.getElementById("report-button").addEventListener(
    "click",
    generateReport
);

document.getElementById("close-report-button").addEventListener(
    "click",
    closeReport
);

document.getElementById("download-report-button").addEventListener(
    "click",
    downloadReportCsv
);

// ==========================================
// 19. INITIALIZE APPLICATION
// ==========================================

renderTransactions();
