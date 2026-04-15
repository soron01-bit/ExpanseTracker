const splitExpenseButton = document.getElementById("add-split-expense");
const splitExpenseError = document.getElementById("split-expense-error");
const splitTitleInput = document.getElementById("split-title");
const splitTotalAmountInput = document.getElementById("split-total-amount");
const splitPaidByInput = document.getElementById("split-paid-by");
const splitParticipantsInput = document.getElementById("split-participants");
const splitTypeInput = document.getElementById("split-type");
const splitValuesInput = document.getElementById("split-values");
const splitList = document.getElementById("split-list");

let savedExpenses = JSON.parse(localStorage.getItem("expenses")) || [];

function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(savedExpenses));
}

function parseCommaList(value) {
  return value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSplitNumbers(rawInput) {
  return parseCommaList(rawInput).map((value) => Number(value.replace("%", "")));
}

function getDefaultMemberPayments(participants, paidBy) {
  const payments = {};
  const normalizedPaidBy = paidBy.trim().toLowerCase();

  participants.forEach((participant) => {
    const normalizedParticipant = participant.trim().toLowerCase();
    payments[participant] = normalizedParticipant === normalizedPaidBy;
  });

  return payments;
}

function buildSplitShares(totalAmount, participants, splitType, splitValues) {
  if (!participants.length) {
    return [];
  }

  if (splitType === "exact") {
    return participants.map((participant, index) => ({
      name: participant,
      amount: Number(splitValues[index] ?? 0),
    }));
  }

  if (splitType === "percentage") {
    return participants.map((participant, index) => ({
      name: participant,
      amount: (totalAmount * Number(splitValues[index] ?? 0)) / 100,
    }));
  }

  const share = totalAmount / participants.length;
  return participants.map((participant) => ({
    name: participant,
    amount: share,
  }));
}

function getSplitExpenses() {
  return savedExpenses.filter((expense) => expense.type === "split");
}

function updateMemberPayment(expenseId, participantName, isPaid) {
  savedExpenses = savedExpenses.map((expense) => {
    if (expense.id !== expenseId) {
      return expense;
    }

    const nextPayments = {
      ...(expense.memberPayments || getDefaultMemberPayments(expense.participants || [], expense.paidBy || "")),
      [participantName]: isPaid,
    };

    return {
      ...expense,
      memberPayments: nextPayments,
    };
  });

  saveExpenses();
  renderSplitExpenses();
}

function removeSplitExpense(id) {
  savedExpenses = savedExpenses.filter((expense) => expense.id !== id);
  saveExpenses();
  renderSplitExpenses();
}

function renderSplitExpenses() {
  splitList.innerHTML = "";

  const splitExpenses = getSplitExpenses();

  if (!splitExpenses.length) {
    splitList.innerHTML = '<p class="split-page-note">No split expenses saved yet.</p>';
    return;
  }

  splitExpenses.forEach((expense) => {
    const sublistContent = document.createElement("div");
    sublistContent.classList.add("sublist-content");

    const formattedDate = new Date(expense.date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });

    const memberPayments = expense.memberPayments || getDefaultMemberPayments(expense.participants || [], expense.paidBy || "");

    const sharesHtml = (expense.shares || []).map((share) => {
      const checkedAttr = memberPayments[share.name] ? "checked" : "";
      return `
        <div class="member-payment-item">
          <p class="split-meta">${share.name}: ${Number(share.amount).toFixed(2)}</p>
          <label class="member-paid-label">
            <input
              type="checkbox"
              class="member-paid-checkbox"
              data-expense-id="${expense.id}"
              data-member-name="${share.name}"
              ${checkedAttr}
            />
            Paid
          </label>
        </div>
      `;
    }).join("");

    const paidCount = Object.values(memberPayments).filter(Boolean).length;
    const totalMembers = (expense.participants || []).length;

    sublistContent.innerHTML = `
      <div class="expense-title-block">
        <p class="product">${expense.title}</p>
        <span class="split-badge">Split</span>
      </div>
      <p class="date">${formattedDate}</p>
      <p class="amount">${Number(expense.total_amount ?? expense.cost ?? 0)}</p>
      <div class="split-details">
        <p class="split-meta">Paid by ${expense.paidBy}</p>
        <p class="split-meta">Split type: ${expense.splitType}</p>
        <p class="split-meta">${(expense.participants || []).length} people</p>
        <p class="split-meta">Settled: ${paidCount}/${totalMembers}</p>
        ${sharesHtml}
      </div>
    `;

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("fa-solid", "fa-trash-can", "delete");
    deleteButton.addEventListener("click", () => removeSplitExpense(expense.id));

    sublistContent.appendChild(deleteButton);
    splitList.appendChild(sublistContent);
  });

  splitList.querySelectorAll(".member-paid-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const expenseId = Number(event.target.getAttribute("data-expense-id"));
      const memberName = event.target.getAttribute("data-member-name");
      updateMemberPayment(expenseId, memberName, event.target.checked);
    });
  });
}

splitExpenseButton.addEventListener("click", () => {
  const title = splitTitleInput.value.trim();
  const totalAmount = Number(splitTotalAmountInput.value);
  const paidBy = splitPaidByInput.value.trim();
  const participants = parseCommaList(splitParticipantsInput.value);
  const splitType = splitTypeInput.value;
  const splitValues = parseSplitNumbers(splitValuesInput.value);

  const invalidBaseFields = !title || !totalAmount || !paidBy || !participants.length;
  const invalidSplitValues =
    (splitType === "exact" || splitType === "percentage") && splitValues.length !== participants.length;
  const invalidNumberValues = splitType !== "equal" && splitValues.some((value) => Number.isNaN(value) || value < 0);
  const exactTotalMismatch =
    splitType === "exact" && Math.abs(splitValues.reduce((sum, value) => sum + value, 0) - totalAmount) > 0.01;
  const percentageMismatch =
    splitType === "percentage" && Math.abs(splitValues.reduce((sum, value) => sum + value, 0) - 100) > 0.01;

  if (invalidBaseFields) {
    splitExpenseError.innerText = "Please fill title, amount, paid by, and participants.";
    splitExpenseError.classList.remove("hide");
    return;
  }

  if (invalidSplitValues) {
    splitExpenseError.innerText = "For exact/percentage, provide one value per participant.";
    splitExpenseError.classList.remove("hide");
    return;
  }

  if (invalidNumberValues) {
    splitExpenseError.innerText = "Split values must be valid positive numbers.";
    splitExpenseError.classList.remove("hide");
    return;
  }

  if (exactTotalMismatch) {
    splitExpenseError.innerText = "Exact values must add up to total amount.";
    splitExpenseError.classList.remove("hide");
    return;
  }

  if (percentageMismatch) {
    splitExpenseError.innerText = "Percentage values must add up to 100.";
    splitExpenseError.classList.remove("hide");
    return;
  }

  if (splitType !== "equal" && splitValues.some((value) => Number.isNaN(value))) {
    splitExpenseError.innerText = "Please enter valid numbers in split values.";
    splitExpenseError.classList.remove("hide");
    return;
  }

  splitExpenseError.classList.add("hide");
  splitExpenseError.innerText = "Fill all split expense fields correctly";

  const splitExpense = {
    id: Date.now(),
    type: "split",
    title,
    total_amount: totalAmount,
    cost: totalAmount,
    paidBy,
    participants,
    splitType,
    splitValues,
    shares: buildSplitShares(totalAmount, participants, splitType, splitValues),
    memberPayments: getDefaultMemberPayments(participants, paidBy),
    date: new Date(),
  };

  savedExpenses.push(splitExpense);
  saveExpenses();
  renderSplitExpenses();

  splitTitleInput.value = "";
  splitTotalAmountInput.value = "";
  splitPaidByInput.value = "";
  splitParticipantsInput.value = "";
  splitValuesInput.value = "";
  splitTypeInput.value = "equal";
});

renderSplitExpenses();