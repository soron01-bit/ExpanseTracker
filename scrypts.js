//pdf adding js//
let totalAmount = document.getElementById("total-amount");
let userAmount = document.getElementById("user-amount");

const checkAmountButton = document.getElementById("check-amount");
const totalAmountButton = document.getElementById("total-amount-button");

const productTitle = document.getElementById("product-title");

const errorMessage = document.getElementById("budget-error");
const productTitleError = document.getElementById("product-title-error");

const amount = document.getElementById("amount");
const expenditureValue = document.getElementById("expenditure-value");
const balanceValue = document.getElementById("balance-amount");

const list = document.getElementById("list");

let tempAmount = 0;

/* ===============================
   MONTH AUTO RESET SYSTEM
================================= */

let currentMonth = new Date().getMonth();
let savedMonth = localStorage.getItem("month");

if (savedMonth != currentMonth) {
  localStorage.clear();
  localStorage.setItem("month", currentMonth);
}

/* ===============================
   LOAD SAVED DATA
================================= */

let savedBudget = localStorage.getItem("budget");
let savedExpenses = JSON.parse(localStorage.getItem("expenses")) || [];

if (savedBudget) {
  tempAmount = savedBudget;
  amount.innerHTML = tempAmount;
}

/* ===============================
   SAVE EXPENSES FUNCTION
================================= */

function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(savedExpenses));
}

/* ===============================
   LOAD EXPENSE LIST FUNCTION
================================= */

function loadExpenses() {
  list.innerHTML = "";
  expenditureValue.innerText = 0;

  savedExpenses.forEach((item) => {
    listCreator(item);

    expenditureValue.innerText =
      parseInt(expenditureValue.innerText) + parseInt(item.cost);
  });

  balanceValue.innerText = tempAmount - expenditureValue.innerText;
}

/* ===============================
   SET BUDGET BUTTON
================================= */

totalAmountButton.addEventListener("click", () => {
  tempAmount = totalAmount.value;

  if (tempAmount === "" || tempAmount < 0) {
    errorMessage.classList.remove("hide");
  } else {
    errorMessage.classList.add("hide");

    amount.innerHTML = tempAmount;

    balanceValue.innerText = tempAmount - expenditureValue.innerText;

    localStorage.setItem("budget", tempAmount);

    totalAmount.value = "";
  }
});

/* ===============================
   DISABLE EDIT BUTTONS
================================= */

const disableButtons = (bool) => {
  let editButtons = document.getElementsByClassName("edit");

  Array.from(editButtons).forEach((element) => {
    element.disabled = bool;
  });
};

/* ===============================
   DELETE / EDIT FUNCTION
================================= */

const modifyElement = (id, edit = false) => {
  let expenseItem = savedExpenses.find((item) => item.id === id);

  if (!expenseItem) return;

  if (edit) {
    productTitle.value = expenseItem.title;
    userAmount.value = expenseItem.cost;

    disableButtons(true);
  }

  expenditureValue.innerText =
    parseInt(expenditureValue.innerText) - parseInt(expenseItem.cost);

  balanceValue.innerText =
    parseInt(balanceValue.innerText) + parseInt(expenseItem.cost);

  // Remove from Array
  savedExpenses = savedExpenses.filter((item) => item.id !== id);

  saveExpenses();

  // Remove from UI
  document.querySelector(`[data-id="${id}"]`).remove();
};

/* ===============================
   CREATE EXPENSE LIST ITEM
================================= */

const listCreator = (expenseObj) => {
  let sublistContent = document.createElement("div");
  sublistContent.classList.add("sublist-content");

  sublistContent.setAttribute("data-id", expenseObj.id);

  // Date Format
  let formattedDate = new Date(expenseObj.date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });

  sublistContent.innerHTML = `
    <p class="product">${expenseObj.title}</p>
    <p class="date">${formattedDate}</p>
    <p class="amount">₹${expenseObj.cost}</p>
  `;

  // Edit Button
  let editButton = document.createElement("button");
  editButton.classList.add("fa-solid", "fa-pen-to-square", "edit");

  editButton.addEventListener("click", () => {
    modifyElement(expenseObj.id, true);
  });

  // Delete Button
  let deleteButton = document.createElement("button");
  deleteButton.classList.add("fa-solid", "fa-trash-can", "delete");

  deleteButton.addEventListener("click", () => {
    modifyElement(expenseObj.id);
  });

  sublistContent.appendChild(editButton);
  sublistContent.appendChild(deleteButton);

  list.appendChild(sublistContent);
};

/* ===============================
   ADD EXPENSE BUTTON
================================= */

checkAmountButton.addEventListener("click", () => {
  if (!userAmount.value || !productTitle.value) {
    productTitleError.classList.remove("hide");
    return false;
  }

  productTitleError.classList.add("hide");

  disableButtons(false);

  let expenditure = parseInt(userAmount.value);

  expenditureValue.innerText =
    parseInt(expenditureValue.innerText) + expenditure;

  balanceValue.innerText = tempAmount - expenditureValue.innerText;

  // Create Expense Object with Unique ID
  let newExpense = {
    id: Date.now(),
    title: productTitle.value,
    cost: userAmount.value,
    date: new Date(),
  };

  // Save into Array
  savedExpenses.push(newExpense);

  // Save into LocalStorage
  saveExpenses();

  // Show in UI
  listCreator(newExpense);

  // Clear Input Fields
  productTitle.value = "";
  userAmount.value = "";
});

/* ===============================
   DOWNLOAD PDF FEATURE (FIXED)
================================= */

document.getElementById("downloadPdf").addEventListener("click", function () {

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text("Monthly Expense Report", 20, 20);

  // Month Text
  let monthText = document.getElementById("current-month").innerText;
  doc.setFontSize(12);
  doc.text("Month: " + monthText, 20, 30);

  // Summary (₹ Removed)
  doc.text("Total Budget: " + amount.innerText, 20, 45);
  doc.text("Total Expenses: " + expenditureValue.innerText, 20, 55);
  doc.text("Balance Left: " + balanceValue.innerText, 20, 65);

  // Line Divider
  doc.line(20, 70, 190, 70);

  // Expense List Heading
  doc.setFontSize(14);
  doc.text("Expense List:", 20, 80);

  let y = 90;

  // If No Expenses
  if (savedExpenses.length === 0) {
    doc.setFontSize(12);
    doc.text("No expenses added yet!", 20, y);

  } else {

    savedExpenses.forEach((item, index) => {

      // Safe Expense Text (₹ Removed)
      let expenseText =
        (index + 1) +
        ". " +
        item.title +
        " - " +
        item.cost +
        " (" +
        new Date(item.date).toLocaleDateString("en-GB") +
        ")";

      doc.setFontSize(11);
      doc.text(expenseText, 20, y);

      y += 10;

      // Page Break Fix
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

  }

  // Save PDF
  doc.save("Expense_Report.pdf");

});


/* ===============================
   ON PAGE LOAD
================================= */

window.onload = function () {
  loadExpenses();
};

/* ===============================
   SHOW CURRENT MONTH HEADING
================================= */

let today = new Date();

let monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// document.getElementById("downloadPdf").addEventListener("click", () => {
//   window.print();
// });
// document.getElementById("downloadPdf").addEventListener("click", function () {

//   const { jsPDF } = window.jspdf;
//   const doc = new jsPDF();

//   doc.setFontSize(18);
//   doc.text("Monthly Expense Report", 20, 20);

//   // Data URL generate
//   let pdfData = doc.output("dataurlstring");

//   // Open PDF safely in browser
//   let newWindow = window.open();
//   newWindow.document.write(
//     `<iframe width="100%" height="100%" src="${pdfData}"></iframe>`
//   );

// });

document.getElementById("downloadCSV").addEventListener("click", () => {

  let csvContent = "Title,Amount,Date\n";

  savedExpenses.forEach((item) => {
    csvContent += `${item.title},${item.cost},${new Date(item.date).toLocaleDateString()}\n`;
  });

  let blob = new Blob([csvContent], { type: "text/csv" });
  let url = URL.createObjectURL(blob);

  let a = document.createElement("a");
  a.href = url;
  a.download = "Expense_Report.csv";
  a.click();
});

