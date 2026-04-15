// let totalAmount = document.getElementById("total-amount");
// let userAmount = document.getElementById("user-amount");
// const checkAmountButton = document.getElementById("check-amount");
// const totalAmountButton = document.getElementById("total-amount-button");
// const productTitle = document.getElementById("product-title");

// const errorMessage = document.getElementById("budget-error");
// const productTitleError = document.getElementById("product-title-error");

// const amount = document.getElementById("amount");
// const expenditureValue = document.getElementById("expenditure-value");
// const balanceValue = document.getElementById("balance-amount");
// const list = document.getElementById("list");

// let tempAmount = 0;

// let currentMonth = new Date().getMonth();
// let savedMonth = localStorage.getItem("month");

// if (savedMonth != currentMonth) {
//   localStorage.clear();
//   localStorage.setItem("month", currentMonth);
// }


// let savedBudget = localStorage.getItem("budget");
// let savedExpenses = JSON.parse(localStorage.getItem("expenses")) || [];

// if (savedBudget) {
//   tempAmount = savedBudget;
//   amount.innerHTML = tempAmount;
// }

// function loadExpenses() {
//   list.innerHTML = "";
//   expenditureValue.innerText = 0;

//   savedExpenses.forEach((item) => {
//     listCreator(item.title, item.cost);

//     expenditureValue.innerText =
//       parseInt(expenditureValue.innerText) + parseInt(item.cost);
//   });

//   balanceValue.innerText = tempAmount - expenditureValue.innerText;
// }


// function saveExpenses() {
//   localStorage.setItem("expenses", JSON.stringify(savedExpenses));
// }


// totalAmountButton.addEventListener("click", () => {
//   tempAmount = totalAmount.value;

//   if (tempAmount === "" || tempAmount < 0) {
//     errorMessage.classList.remove("hide");
//   } else {
//     errorMessage.classList.add("hide");

//     amount.innerHTML = tempAmount;

//     balanceValue.innerText = tempAmount - expenditureValue.innerText;

    
//     localStorage.setItem("budget", tempAmount);

//     totalAmount.value = "";
//   }
// });


// const disableButtons = (bool) => {
//   let editButtons = document.getElementsByClassName("edit");
//   Array.from(editButtons).forEach((element) => {
//     element.disabled = bool;
//   });
// };


// const modifyElement = (element, edit = false) => {
//   let parentDiv = element.parentElement;

//   let parentAmount = parentDiv.querySelector(".amount").innerText;
//   let parentText = parentDiv.querySelector(".product").innerText;

//   if (edit) {
//     productTitle.value = parentText;
//     userAmount.value = parentAmount;
//     disableButtons(true);
//   }

//   balanceValue.innerText =
//     parseInt(balanceValue.innerText) + parseInt(parentAmount);

//   expenditureValue.innerText =
//     parseInt(expenditureValue.innerText) - parseInt(parentAmount);

  
//   savedExpenses = savedExpenses.filter(
//     (item) => item.title !== parentText || item.cost !== parentAmount
//   );

//   saveExpenses();

//   parentDiv.remove();
// };

// const listCreator = (expenseName, expenseValue) => {
//   let sublistContent = document.createElement("div");
//   sublistContent.classList.add("sublist-content", "flex-space");

//   // sublistContent.innerHTML = `
//   //   <p class="product">${expenseName}</p>
//   //   <p class="amount">${expenseValue}</p>
//   // `;

// // Get Today's Date
// let date = new Date();

// let formattedDate = date.toLocaleDateString("en-GB", {
//   day: "2-digit",
//   month: "short",
//   // year: "numeric"
// });

// sublistContent.innerHTML = `
//   <p class="product">${expenseName}</p>

//   <p class="date">${formattedDate}</p>

//   <p class="amount">${expenseValue}</p>
// `;






//   let editButton = document.createElement("button");
//   editButton.classList.add("fa-solid", "fa-pen-to-square", "edit");
//   editButton.style.fontSize = "1.2em";

//   editButton.addEventListener("click", () => {
//     modifyElement(editButton, true);
//   });

//   let deleteButton = document.createElement("button");
//   deleteButton.classList.add("fa-solid", "fa-trash-can", "delete");
//   deleteButton.style.fontSize = "1.2em";

//   deleteButton.addEventListener("click", () => {
//     modifyElement(deleteButton);
//   });

//   sublistContent.appendChild(editButton);
//   sublistContent.appendChild(deleteButton);

//   list.appendChild(sublistContent);
// };


// checkAmountButton.addEventListener("click", () => {
//   if (!userAmount.value || !productTitle.value) {
//     productTitleError.classList.remove("hide");
//     return false;
//   }

//   productTitleError.classList.add("hide");

//   disableButtons(false);

//   let expenditure = parseInt(userAmount.value);

//   let sum = parseInt(expenditureValue.innerText) + expenditure;
//   expenditureValue.innerText = sum;

//   balanceValue.innerText = tempAmount - sum;


//   listCreator(productTitle.value, userAmount.value);

//   savedExpenses.push({
//     title: productTitle.value,
//     cost: userAmount.value,
//   });

//   saveExpenses();

//   productTitle.value = "";
//   userAmount.value = "";
// });


// window.onload = function () {
//   loadExpenses();
// };



// let today = new Date();

// let monthNames = [
//   "January", "February", "March", "April",
//   "May", "June", "July", "August",
//   "September", "October", "November", "December"
// ];

// let month = monthNames[today.getMonth()];
// let year = today.getFullYear();

// document.getElementById("current-month").innerText = `${month}-${year}`;



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

const advisorCard = document.getElementById("advisor-card");
const advisorTitle = document.getElementById("advisor-title");
const advisorMessage = document.getElementById("advisor-message");
const advisorTips = document.getElementById("advisor-tips");

let tempAmount = 0;

const foodKeywords = [
  "fast food",
  "fried",
  "oily",
  "pizza",
  "burger",
  "fries",
  "chips",
  "samosa",
  "pakora",
  "pokora",
  "noodles",
  "shawarma",
  "biryani",
  "roll",
  "cola",
  "soft drink",
  "junk food"
];

function getExpenseAmount(expense) {
  return Number(expense.total_amount ?? expense.cost ?? 0);
}

function getNormalizedExpense(expense) {
  return {
    ...expense,
    type: expense.type || "normal",
    participants: Array.isArray(expense.participants) ? expense.participants : [],
    splitType: expense.splitType || "equal",
    total_amount: expense.total_amount ?? expense.cost ?? 0,
  };
}

function isFoodExpense(title) {
  const normalizedTitle = title.toLowerCase();
  return foodKeywords.some((keyword) => normalizedTitle.includes(keyword));
}

function renderAdvisor(state) {
  advisorCard.classList.remove("warning", "safe");
  advisorTips.innerHTML = "";

  advisorCard.classList.add(state.level);
  advisorTitle.innerText = state.title;
  advisorMessage.innerText = state.message;

  state.tips.forEach((tip) => {
    const tipItem = document.createElement("li");
    tipItem.innerText = tip;
    advisorTips.appendChild(tipItem);
  });
}

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
    const normalizedItem = getNormalizedExpense(item);
    listCreator(normalizedItem);

    expenditureValue.innerText =
      Number(expenditureValue.innerText) + getExpenseAmount(normalizedItem);
  });

  balanceValue.innerText = tempAmount - expenditureValue.innerText;
  updateAllAnalytics();
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

  expenseItem = getNormalizedExpense(expenseItem);

  if (edit) {
    productTitle.value = expenseItem.title;
    userAmount.value = getExpenseAmount(expenseItem);

    disableButtons(true);
  }

  expenditureValue.innerText =
    Number(expenditureValue.innerText) - getExpenseAmount(expenseItem);

  balanceValue.innerText =
    Number(balanceValue.innerText) + getExpenseAmount(expenseItem);

  // Remove from Array
  savedExpenses = savedExpenses.filter((item) => item.id !== id);

  saveExpenses();

  // Remove from UI
  const expenseElement = document.querySelector(`[data-id="${id}"]`);
  if (expenseElement) {
    expenseElement.remove();
  }

  updateAllAnalytics();
};

/* ===============================
   CREATE EXPENSE LIST ITEM
================================= */

const listCreator = (expenseObj) => {
  let sublistContent = document.createElement("div");
  sublistContent.classList.add("sublist-content");

  sublistContent.setAttribute("data-id", expenseObj.id);

  const amountValue = getExpenseAmount(expenseObj);

  // Date Format
  let formattedDate = new Date(expenseObj.date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });

  const splitInfo = expenseObj.type === "split"
    ? `
      <div class="split-details">
        <p class="split-meta">Paid by ${expenseObj.paidBy}</p>
        <p class="split-meta">Split type: ${expenseObj.splitType}</p>
        <p class="split-meta">${(expenseObj.participants || []).length} people</p>
        ${(expenseObj.shares || []).map((share) => `<p class="split-meta">${share.name}: ${Number(share.amount).toFixed(2)}</p>`).join("")}
      </div>
    `
    : "";

  sublistContent.innerHTML = `
    <div class="expense-title-block">
      <p class="product">${expenseObj.title}</p>
      ${expenseObj.type === "split" ? '<span class="split-badge">Split</span>' : ''}
    </div>
    <p class="date">${formattedDate}</p>
    <p class="amount">${amountValue}</p>
    ${splitInfo}
  `;

  // Edit Button
  let editButton = document.createElement("button");
  editButton.classList.add("fa-solid", "fa-pen-to-square", "edit");

  if (expenseObj.type !== "split") {
    editButton.addEventListener("click", () => {
      modifyElement(expenseObj.id, true);
    });
  } else {
    editButton.disabled = true;
    editButton.title = "Split expenses can be deleted, not edited inline";
  }

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

  let expenditure = Number(userAmount.value);

  expenditureValue.innerText =
    Number(expenditureValue.innerText) + expenditure;

  balanceValue.innerText = tempAmount - expenditureValue.innerText;

  // Create Expense Object with Unique ID
  let newExpense = {
    id: Date.now(),
    type: "normal",
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

  // Update analytics
  updateAllAnalytics();

  updateAdvisorForExpense(newExpense);

  // Clear Input Fields
  productTitle.value = "";
  userAmount.value = "";
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
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December"
];

let month = monthNames[today.getMonth()];
let year = today.getFullYear();

document.getElementById("current-month").innerText = `${month}-${year}`;

/* ===============================
   ANALYTICS FUNCTIONS
================================= */

// Get spending for a specific date
function getSpendingByDate(date) {
  const dateString = new Date(date).toDateString();
  return savedExpenses
    .filter((item) => new Date(item.date).toDateString() === dateString)
    .reduce((sum, item) => sum + getExpenseAmount(item), 0);
}

// Get all unique dates with spending data
function getUniqueDates() {
  const dates = {};
  savedExpenses.forEach(item => {
    const dateString = new Date(item.date).toDateString();
    if (!dates[dateString]) {
      dates[dateString] = true;
    }
  });
  return Object.keys(dates)
    .map(dateString => new Date(dateString))
    .sort((a, b) => a - b);
}

// Calculate analytics and update display
function updateAnalytics() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todaySpending = getSpendingByDate(today);
  const yesterdaySpending = getSpendingByDate(yesterday);

  // Update spending values
  document.getElementById("today-spending").innerText = todaySpending;
  document.getElementById("yesterday-spending").innerText = yesterdaySpending;

  // Calculate daily average
  const uniqueDates = getUniqueDates();
  const dailyAverage = uniqueDates.length > 0 
    ? Math.round(Number(expenditureValue.innerText) / uniqueDates.length) 
    : 0;
  document.getElementById("daily-average").innerText = dailyAverage;

  // Calculate spending trend
  const trendElement = document.getElementById("spending-trend");
  if (yesterdaySpending === 0 && todaySpending > 0) {
    trendElement.innerText = "📈 New Day";
  } else if (todaySpending > yesterdaySpending) {
    const increase = Math.round(((todaySpending - yesterdaySpending) / yesterdaySpending) * 100);
    trendElement.innerText = `📈 +${increase}%`;
    trendElement.style.color = "#ff6348";
  } else if (todaySpending < yesterdaySpending && yesterdaySpending > 0) {
    const decrease = Math.round(((yesterdaySpending - todaySpending) / yesterdaySpending) * 100);
    trendElement.innerText = `📉 -${decrease}%`;
    trendElement.style.color = "#2ecc71";
  } else {
    trendElement.innerText = "➡️ Stable";
    trendElement.style.color = "#ffcc00";
  }

  // Check spending alert
  checkSpendingAlert(todaySpending, yesterdaySpending);

  // Update chart
  updateExpenseChart();
}

// Check if user spent more today than yesterday
function checkSpendingAlert(todaySpending, yesterdaySpending) {
  const alertContainer = document.getElementById("spending-alert");
  const alertMessage = document.getElementById("alert-message");

  if (yesterdaySpending > 0 && todaySpending > yesterdaySpending) {
    const difference = todaySpending - yesterdaySpending;
    const percentage = Math.round((difference / yesterdaySpending) * 100);
    alertMessage.innerText = `You spent ₹${difference} (${percentage}%) more than yesterday!`;
    alertContainer.classList.remove("hide");
  } else {
    alertContainer.classList.add("hide");
  }
}

// Create and update the expense chart
let expenseChart = null;

function updateExpenseChart() {
  const uniqueDates = getUniqueDates();
  const last14Days = [];
  const today = new Date();

  // Get last 14 days
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    last14Days.push(date);
  }

  const labels = last14Days.map(date => 
    date.toLocaleDateString("en-GB", { month: "short", day: "numeric" })
  );

  const data = last14Days.map(date => getSpendingByDate(date));

  const ctx = document.getElementById("expenseChart").getContext("2d");

  if (expenseChart) {
    expenseChart.destroy();
  }

  expenseChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Daily Expenses",
          data: data,
          borderColor: "#ffcc00",
          backgroundColor: "rgba(255, 204, 0, 0.1)",
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: "#ffcc00",
          pointBorderColor: "#ffcc00",
          pointBorderWidth: 2,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: "#ff8800",
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#ffcc00",
            font: {
              size: 12,
              weight: "600"
            }
          }
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "#ffcc00",
          bodyColor: "#fff",
          borderColor: "#ffcc00",
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return `Spending: ₹${context.parsed.y}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(255, 255, 255, 0.1)"
          },
          ticks: {
            color: "#ffcc00",
            callback: function(value) {
              return "₹" + value;
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: "rgba(255, 255, 255, 0.8)"
          }
        }
      }
    }
  });
}

// Update analytics when expenses change
function updateAllAnalytics() {
  updateAnalytics();
  updateAdvisorForExpense();
}

function updateAdvisorForExpense() {
  const reverseExpenses = [...savedExpenses].reverse().map(getNormalizedExpense);
  const foodExpense = reverseExpenses.find((expense) => isFoodExpense(expense.title));

  if (foodExpense) {
    renderAdvisor({
      level: "warning",
      title: "Food spending warning",
      message: `${foodExpense.title} looks like oily or fast-food spending. Keep an eye on repeat food orders so they do not eat into your budget.`,
      tips: [
        "Set a weekly food budget and track it separately.",
        "Cook at home for at least 3 meals a week.",
        "If you order out, compare prices before checkout.",
        "Use split expenses only for planned group meals."
      ]
    });
    return;
  }

  renderAdvisor({
    level: "safe",
    title: "Spending looks balanced",
    message: "No oily food or fast-food pattern detected in your saved expenses right now.",
    tips: [
      "Keep a 10% buffer for monthly savings.",
      "Review weekly expenses before adding new purchases.",
      "Use split expenses to divide shared costs fairly.",
      "Move small impulse buys into a separate food or misc budget."
    ]
  });
}

