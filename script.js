  const balance = document.getElementById("balance");
    const income = document.getElementById("income-amount");
    const expenses = document.getElementById("expenses-amount");
    const transactionHistory = document.getElementById("transaction_history");

    const trnType = document.getElementById("trn-type");
    const trnCategory = document.getElementById("trn-category");
    const trnAmount = document.getElementById("trn-amount");
    const trnDescription = document.getElementById("trn-description");
    const trnDate = document.getElementById("trn-date");
    const addButton = document.getElementById("add-button");

    let transactions = [];
    let filteredTransactions = [];
    let editingId = null;

    // Load saved transactions
    try {
        const saved = JSON.parse(localStorage.getItem("_transactions") || "[]");
        if (Array.isArray(saved)) {
            transactions = saved.filter(t =>
                t && typeof t.id === "string" &&
                (t.type === "Income" || t.type === "Expense") &&
                typeof t.amount === "number" && Number.isFinite(t.amount) &&
                t.amount > 0 && typeof t.category === "string" &&
                typeof t.description === "string" && typeof t.date === "string"
            );
        }
    } catch (error) {
        console.error("Unable to load transactions:", error);
    }

    filteredTransactions = [...transactions];

    function formatAmount(amount) {
        return amount.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function saveTransactions() {
        try {
            localStorage.setItem("_transactions", JSON.stringify(transactions));
            localStorage.setItem("_income", calculateTotal("Income").toFixed(2));
            localStorage.setItem("_expenses", calculateTotal("Expense").toFixed(2));
            localStorage.setItem("_balance",
                (calculateTotal("Income") - calculateTotal("Expense")).toFixed(2));
        } catch (error) {
            showAlert("Unable to save data in this browser.", "danger");
            console.error(error);
        }
    }

    function calculateTotal(type, list = transactions) {
        return list.filter(t => t.type === type)
            .reduce((sum, t) => sum + t.amount, 0);
    }

    function balanceAmount() {
        const totalIncome = calculateTotal("Income");
        const totalExpenses = calculateTotal("Expense");

        income.textContent = formatAmount(totalIncome);
        expenses.textContent = formatAmount(totalExpenses);
        balance.textContent = formatAmount(totalIncome - totalExpenses);
    }

    // Render transaction history
    function renderTransactions() {
        transactionHistory.replaceChildren();

        [...filteredTransactions].reverse().forEach(trn => {
            const row = document.createElement("tr");

            const dateCell = document.createElement("td");
            dateCell.textContent = trn.date;

            const descriptionCell = document.createElement("td");
            descriptionCell.textContent = trn.description;

            const categoryCell = document.createElement("td");
            categoryCell.textContent = trn.category;

            const amountCell = document.createElement("td");
            amountCell.textContent =
                (trn.type === "Income" ? "+ ₹ " : "- ₹ ") + formatAmount(trn.amount);
            amountCell.classList.add(trn.type === "Income" ? "text-success" : "text-danger");

            const actionCell = document.createElement("td");

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "btn btn-primary btn-sm me-2 mb-1";
            editButton.textContent = "Edit";
            editButton.addEventListener("click", () => editTransaction(trn.id));

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "btn btn-danger btn-sm mb-1";
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", () => deleteTransaction(trn.id));

            actionCell.append(editButton, deleteButton);
            row.append(dateCell, descriptionCell, categoryCell, amountCell, actionCell);
            transactionHistory.appendChild(row);
        });

        if (filteredTransactions.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 5;
            cell.className = "text-center text-muted";
            cell.textContent = "No transactions found.";
            row.appendChild(cell);
            transactionHistory.appendChild(row);
        }

        balanceAmount();
    }

    function showAlert(message, type = "danger") {
        const container = document.getElementById("alert-container");
        container.replaceChildren();

        const alert = document.createElement("div");
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.setAttribute("role", "alert");
        alert.appendChild(document.createTextNode(message));

        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "btn-close";
        closeButton.setAttribute("data-bs-dismiss", "alert");
        closeButton.setAttribute("aria-label", "Close");

        alert.appendChild(closeButton);
        container.appendChild(alert);
    }

    function clearForm() {
        document.getElementById("transaction-form").reset();
        editingId = null;
        addButton.textContent = "Add Transaction";
    }

    // Add or update a transaction
    function addTransaction() {
        const type = trnType.value;
        const category = trnCategory.value;
        const amountText = trnAmount.value.trim();
        const description = trnDescription.value.trim();
        const date = trnDate.value;

        if (!type || !category || !amountText || !description || !date) {
            showAlert("Please fill in all the fields.");
            return;
        }

        const amount = Number(amountText);
        if (!Number.isFinite(amount) || amount <= 0 ||
            Math.round(amount * 100) <= 0 ||
            Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001) {
            showAlert("Enter a valid amount greater than zero with up to two decimal places.");
            return;
        }

        const isEditing = editingId !== null;
        const transaction = {
            id: editingId || (
                typeof crypto !== "undefined" && crypto.randomUUID
                    ? crypto.randomUUID()
                    : Date.now().toString() + Math.random().toString(36).slice(2)
            ),
            type,
            category,
            amount: Math.round(amount * 100) / 100,
            description,
            date
        };

        if (isEditing) {
            const index = transactions.findIndex(t => t.id === editingId);
            if (index !== -1) transactions[index] = transaction;
        } else {
            transactions.push(transaction);
        }

        saveTransactions();
        filteredTransactions = [...transactions];
        clearForm();
        renderTransactions();
        showAlert(isEditing ? "Transaction updated successfully!" :
            "Transaction added successfully!", "success");
    }

    function editTransaction(id) {
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) {
            showAlert("Transaction not found.");
            return;
        }

        trnType.value = transaction.type;
        trnCategory.value = transaction.category;
        trnAmount.value = transaction.amount.toFixed(2);
        trnDescription.value = transaction.description;
        trnDate.value = transaction.date;

        editingId = id;
        addButton.textContent = "Update Transaction";
        document.getElementById("transaction-form").scrollIntoView({
            behavior: "smooth", block: "center"
        });
    }

    function deleteTransaction(id) {
        if (!confirm("Are you sure you want to delete this transaction?")) return;

        transactions = transactions.filter(t => t.id !== id);
        filteredTransactions = filteredTransactions.filter(t => t.id !== id);

        if (editingId === id) clearForm();

        saveTransactions();
        renderTransactions();
        showAlert("Transaction deleted successfully.", "success");
    }

    // Filter transactions by type, category and date range
    function applyFilters() {
        const type = document.getElementById("filter-type").value;
        const category = document.getElementById("filter-category").value;
        const fromDate = document.getElementById("filter-from").value;
        const toDate = document.getElementById("filter-to").value;

        if (fromDate && toDate && fromDate > toDate) {
            showAlert("From date cannot be later than To date.");
            return;
        }

        filteredTransactions = transactions.filter(t =>
            (!type || t.type === type) &&
            (!category || t.category === category) &&
            (!fromDate || t.date >= fromDate) &&
            (!toDate || t.date <= toDate)
        );

        renderTransactions();
        showAlert(`${filteredTransactions.length} transaction(s) match your filters.`, "info");
    }

    function resetFilters() {
        document.getElementById("filter-type").value = "";
        document.getElementById("filter-category").value = "";
        document.getElementById("filter-from").value = "";
        document.getElementById("filter-to").value = "";

        filteredTransactions = [...transactions];
        renderTransactions();
        showAlert("Filters cleared. Showing all transactions.", "success");
    }

    // Generate a report from the currently displayed transactions
    function generateReport() {
        const list = filteredTransactions;
        const totalIncome = calculateTotal("Income", list);
        const totalExpenses = calculateTotal("Expense", list);

        document.getElementById("report-count").textContent = list.length;
        document.getElementById("report-income").textContent = formatAmount(totalIncome);
        document.getElementById("report-expenses").textContent = formatAmount(totalExpenses);
        document.getElementById("report-balance").textContent =
            formatAmount(totalIncome - totalExpenses);

        const tbody = document.getElementById("report-category-rows");
        tbody.replaceChildren();

        const categories = [...new Set(list.map(t => t.category))].sort();

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
                    .filter(t => t.category === category && t.type === "Income")
                    .reduce((sum, t) => sum + t.amount, 0);
                const categoryExpenses = list
                    .filter(t => t.category === category && t.type === "Expense")
                    .reduce((sum, t) => sum + t.amount, 0);

                const row = document.createElement("tr");
                [category, "₹" + formatAmount(categoryIncome),
                    "₹" + formatAmount(categoryExpenses)].forEach(value => {
                    const cell = document.createElement("td");
                    cell.textContent = value;
                    row.appendChild(cell);
                });
                tbody.appendChild(row);
            });
        }

        document.getElementById("report-panel").classList.remove("d-none");
        document.getElementById("report-panel").scrollIntoView({
            behavior: "smooth", block: "start"
        });
    }

    function closeReport() {
        document.getElementById("report-panel").classList.add("d-none");
    }

    // Export currently displayed transactions to CSV
    function downloadReportCsv() {
        const rows = [
            ["Date", "Type", "Category", "Description", "Amount"],
            ...filteredTransactions.map(t => [
                t.date, t.type, t.category, t.description, t.amount.toFixed(2)
            ])
        ];

        const csv = rows.map(row => row.map(value =>
            '"' + String(value).replace(/"/g, '""') + '"'
        ).join(",")).join("\r\n");

        const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "personal-finance-report.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    document.getElementById("transaction-form").addEventListener("submit", event => {
        event.preventDefault();
        addTransaction();
    });

    // Initial page render
    renderTransactions();
