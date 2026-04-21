import { auth, authReady, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const splitExpenseButton = document.getElementById("add-split-expense");
const splitExpenseError = document.getElementById("split-expense-error");
const splitTitleInput = document.getElementById("split-title");
const splitTotalAmountInput = document.getElementById("split-total-amount");
const splitPaidByInput = document.getElementById("split-paid-by");
const splitParticipantsInput = document.getElementById("split-participants");
const splitTypeInput = document.getElementById("split-type");
const splitValuesInput = document.getElementById("split-values");
const splitList = document.getElementById("split-list");

const authError = document.getElementById("auth-error");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const registerButton = document.getElementById("register-button");
const loginButton = document.getElementById("login-button");
const googleLoginButton = document.getElementById("google-login-button");
const forgotPasswordButton = document.getElementById("forgot-password-button");
const logoutButton = document.getElementById("logout-button");
const authFields = document.getElementById("auth-fields");
const authStatus = document.getElementById("auth-status");
const userEmail = document.getElementById("user-email");
const appShell = document.getElementById("app-shell");

let currentUser = null;
let savedExpenses = [];
const googleProvider = new GoogleAuthProvider();

function showAuthError(message) {
  authError.innerText = message;
  authError.classList.remove("hide");
}

function clearAuthError() {
  authError.classList.add("hide");
}

function getAuthEmailOrShowError() {
  const email = authEmail.value.trim();
  if (!email) {
    showAuthError("Enter your email first, then click forgot password.");
    return "";
  }
  return email;
}

function setSignedInUi(user) {
  authFields.classList.add("hide");
  authStatus.classList.remove("hide");
  appShell.classList.remove("hide");
  userEmail.innerText = user.email || "Logged in";
}

function setSignedOutUi() {
  authFields.classList.remove("hide");
  authStatus.classList.add("hide");
  appShell.classList.add("hide");
  userEmail.innerText = "";
  splitList.innerHTML = '<p class="split-page-note">Login to view split expenses.</p>';
}

function parseCommaList(value) {
  return value
    .split(/[,]+/)
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

function getExpensesCollectionRef(uid) {
  return collection(db, "users", uid, "expenses");
}

function getSplitExpenses() {
  return savedExpenses.filter((expense) => expense.type === "split");
}

async function loadExpenses(uid) {
  const expensesQuery = query(getExpensesCollectionRef(uid), orderBy("date", "desc"));
  const snapshot = await getDocs(expensesQuery);

  savedExpenses = snapshot.docs.map((entry) => ({
    id: entry.id,
    ...entry.data(),
  }));

  renderSplitExpenses();
}

async function updateMemberPayment(expenseId, participantName, isPaid) {
  if (!currentUser) {
    return;
  }

  const existing = savedExpenses.find((expense) => expense.id === expenseId);
  if (!existing) {
    return;
  }

  const nextPayments = {
    ...(existing.memberPayments ||
      getDefaultMemberPayments(existing.participants || [], existing.paidBy || "")),
    [participantName]: isPaid,
  };

  await updateDoc(doc(db, "users", currentUser.uid, "expenses", expenseId), {
    memberPayments: nextPayments,
  });

  savedExpenses = savedExpenses.map((expense) =>
    expense.id === expenseId ? { ...expense, memberPayments: nextPayments } : expense
  );

  renderSplitExpenses();
}

async function removeSplitExpense(id) {
  if (!currentUser) {
    return;
  }

  await deleteDoc(doc(db, "users", currentUser.uid, "expenses", id));
  savedExpenses = savedExpenses.filter((expense) => expense.id !== id);
  renderSplitExpenses();
}

function renderSplitExpenses() {
  splitList.innerHTML = "";

  const splitExpenses = getSplitExpenses();

  if (!splitExpenses.length) {
    splitList.innerHTML =
      '<p class="split-page-note">No split expenses saved yet.</p>';
    return;
  }

  splitExpenses.forEach((expense) => {
    const sublistContent = document.createElement("div");
    sublistContent.classList.add("sublist-content");

    const formattedDate = new Date(expense.date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });

    const memberPayments =
      expense.memberPayments ||
      getDefaultMemberPayments(expense.participants || [], expense.paidBy || "");

    const sharesHtml = (expense.shares || [])
      .map((share) => {
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
      })
      .join("");

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
    deleteButton.addEventListener("click", () => {
      removeSplitExpense(expense.id).catch(() => {
        showAuthError("Could not delete split expense.");
      });
    });

    sublistContent.appendChild(deleteButton);
    splitList.appendChild(sublistContent);
  });

  splitList.querySelectorAll(".member-paid-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const expenseId = event.target.getAttribute("data-expense-id");
      const memberName = event.target.getAttribute("data-member-name");

      updateMemberPayment(expenseId, memberName, event.target.checked).catch(() => {
        showAuthError("Could not update member payment.");
      });
    });
  });
}

splitExpenseButton.addEventListener("click", async () => {
  if (!currentUser) {
    showAuthError("Please login first.");
    return;
  }

  const title = splitTitleInput.value.trim();
  const totalAmount = Number(splitTotalAmountInput.value);
  const paidBy = splitPaidByInput.value.trim();
  const participants = parseCommaList(splitParticipantsInput.value);
  const splitType = splitTypeInput.value;
  const splitValues = parseSplitNumbers(splitValuesInput.value);

  const invalidBaseFields = !title || !totalAmount || !paidBy || !participants.length;
  const invalidSplitValues =
    (splitType === "exact" || splitType === "percentage") &&
    splitValues.length !== participants.length;
  const invalidNumberValues =
    splitType !== "equal" && splitValues.some((value) => Number.isNaN(value) || value < 0);
  const exactTotalMismatch =
    splitType === "exact" &&
    Math.abs(splitValues.reduce((sum, value) => sum + value, 0) - totalAmount) > 0.01;
  const percentageMismatch =
    splitType === "percentage" &&
    Math.abs(splitValues.reduce((sum, value) => sum + value, 0) - 100) > 0.01;

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

  splitExpenseError.classList.add("hide");
  splitExpenseError.innerText = "Fill all split expense fields correctly";

  const splitExpense = {
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
    date: new Date().toISOString(),
  };

  try {
    const created = await addDoc(getExpensesCollectionRef(currentUser.uid), splitExpense);
    savedExpenses.push({ id: created.id, ...splitExpense });
    renderSplitExpenses();

    splitTitleInput.value = "";
    splitTotalAmountInput.value = "";
    splitPaidByInput.value = "";
    splitParticipantsInput.value = "";
    splitValuesInput.value = "";
    splitTypeInput.value = "equal";
  } catch {
    showAuthError("Could not save split expense.");
  }
});

registerButton.addEventListener("click", async () => {
  clearAuthError();
  try {
    await createUserWithEmailAndPassword(
      auth,
      authEmail.value.trim(),
      authPassword.value
    );
    authEmail.value = "";
    authPassword.value = "";
  } catch (error) {
    showAuthError(error.message || "Registration failed.");
  }
});

loginButton.addEventListener("click", async () => {
  clearAuthError();
  try {
    await signInWithEmailAndPassword(auth, authEmail.value.trim(), authPassword.value);
    authEmail.value = "";
    authPassword.value = "";
  } catch (error) {
    showAuthError(error.message || "Login failed.");
  }
});

logoutButton.addEventListener("click", async () => {
  clearAuthError();
  try {
    await signOut(auth);
  } catch (error) {
    showAuthError(error.message || "Logout failed.");
  }
});

googleLoginButton.addEventListener("click", async () => {
  clearAuthError();
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    showAuthError(error.message || "Google sign-in failed.");
  }
});

forgotPasswordButton.addEventListener("click", async () => {
  clearAuthError();
  const email = getAuthEmailOrShowError();
  if (!email) {
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showAuthError("Password reset email sent. Check your inbox.");
  } catch (error) {
    showAuthError(error.message || "Could not send password reset email.");
  }
});

await authReady;

onAuthStateChanged(auth, async (user) => {
  clearAuthError();

  if (!user) {
    currentUser = null;
    savedExpenses = [];
    setSignedOutUi();
    return;
  }

  currentUser = user;
  setSignedInUi(user);

  try {
    await loadExpenses(user.uid);
  } catch {
    showAuthError("Could not load split expenses from Firestore.");
  }
});
