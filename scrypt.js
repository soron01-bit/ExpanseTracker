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

let currentMonth = new Date().getMonth();
let savedMonth = localStorage.getItem("month");

if (savedMonth != currentMonth) {
  localStorage.clear();
  localStorage.setItem("month", currentMonth);
}


let savedBudget = localStorage.getItem("budget");
let savedExpenses = JSON.parse(localStorage.getItem("expenses")) || [];

if (savedBudget) {
  tempAmount = savedBudget;
  amount.innerHTML = tempAmount;
}

function loadExpenses() {
  list.innerHTML = "";
  expenditureValue.innerText = 0;

  savedExpenses.forEach((item) => {
    listCreator(item.title, item.cost);

    expenditureValue.innerText =
      parseInt(expenditureValue.innerText) + parseInt(item.cost);
  });

  balanceValue.innerText = tempAmount - expenditureValue.innerText;
}

/* ==========================================
   ✅ SAVE EXPENSES FUNCTION
========================================== */
function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(savedExpenses));
}

/* ==========================================
   ✅ SET BUDGET PART
========================================== */
totalAmountButton.addEventListener("click", () => {
  tempAmount = totalAmount.value;

  if (tempAmount === "" || tempAmount < 0) {
    errorMessage.classList.remove("hide");
  } else {
    errorMessage.classList.add("hide");

    amount.innerHTML = tempAmount;

    balanceValue.innerText = tempAmount - expenditureValue.innerText;

    // ✅ Save Budget
    localStorage.setItem("budget", tempAmount);

    totalAmount.value = "";
  }
});

/* ==========================================
   ✅ DISABLE EDIT BUTTONS
========================================== */
const disableButtons = (bool) => {
  let editButtons = document.getElementsByClassName("edit");
  Array.from(editButtons).forEach((element) => {
    element.disabled = bool;
  });
};

/* ==========================================
   ✅ MODIFY LIST ELEMENTS
========================================== */
const modifyElement = (element, edit = false) => {
  let parentDiv = element.parentElement;

  let parentAmount = parentDiv.querySelector(".amount").innerText;
  let parentText = parentDiv.querySelector(".product").innerText;

  if (edit) {
    productTitle.value = parentText;
    userAmount.value = parentAmount;
    disableButtons(true);
  }

  // Update balance and expense
  balanceValue.innerText =
    parseInt(balanceValue.innerText) + parseInt(parentAmount);

  expenditureValue.innerText =
    parseInt(expenditureValue.innerText) - parseInt(parentAmount);

  // ✅ Remove from savedExpenses array
  savedExpenses = savedExpenses.filter(
    (item) => item.title !== parentText || item.cost !== parentAmount
  );

  saveExpenses();

  parentDiv.remove();
};

/* ==========================================
   ✅ LIST CREATOR
========================================== */
const listCreator = (expenseName, expenseValue) => {
  let sublistContent = document.createElement("div");
  sublistContent.classList.add("sublist-content", "flex-space");

  // sublistContent.innerHTML = `
  //   <p class="product">${expenseName}</p>
  //   <p class="amount">${expenseValue}</p>
  // `;

// Get Today's Date
let date = new Date();

let formattedDate = date.toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  // year: "numeric"
});

sublistContent.innerHTML = `
  <p class="product">${expenseName}</p>

  <p class="date">${formattedDate}</p>

  <p class="amount">${expenseValue}</p>
`;






  let editButton = document.createElement("button");
  editButton.classList.add("fa-solid", "fa-pen-to-square", "edit");
  editButton.style.fontSize = "1.2em";

  editButton.addEventListener("click", () => {
    modifyElement(editButton, true);
  });

  let deleteButton = document.createElement("button");
  deleteButton.classList.add("fa-solid", "fa-trash-can", "delete");
  deleteButton.style.fontSize = "1.2em";

  deleteButton.addEventListener("click", () => {
    modifyElement(deleteButton);
  });

  sublistContent.appendChild(editButton);
  sublistContent.appendChild(deleteButton);

  list.appendChild(sublistContent);
};

/* ==========================================
   ✅ ADD EXPENSE PART
========================================== */
checkAmountButton.addEventListener("click", () => {
  if (!userAmount.value || !productTitle.value) {
    productTitleError.classList.remove("hide");
    return false;
  }

  productTitleError.classList.add("hide");

  disableButtons(false);

  let expenditure = parseInt(userAmount.value);

  let sum = parseInt(expenditureValue.innerText) + expenditure;
  expenditureValue.innerText = sum;

  balanceValue.innerText = tempAmount - sum;

  // Create list
  listCreator(productTitle.value, userAmount.value);

  // ✅ Save Expense in Array
  savedExpenses.push({
    title: productTitle.value,
    cost: userAmount.value,
  });

  saveExpenses();

  productTitle.value = "";
  userAmount.value = "";
});

/* ==========================================
   ✅ AUTO LOAD WHEN APP OPENS
========================================== */
window.onload = function () {
  loadExpenses();
};


// Show Month-Year in Heading (February-2026)
let today = new Date();

let monthNames = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December"
];

let month = monthNames[today.getMonth()];
let year = today.getFullYear();

document.getElementById("current-month").innerText = `${month}-${year}`;
