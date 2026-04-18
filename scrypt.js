import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
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
  setDoc,
  getDoc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const totalAmount = document.getElementById("total-amount");
const userAmount = document.getElementById("user-amount");
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

const authError = document.getElementById("auth-error");
const authName = document.getElementById("auth-name");
const authPhotoFile = document.getElementById("auth-photo-file");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const registerButton = document.getElementById("register-button");
const loginButton = document.getElementById("login-button");
const googleLoginButton = document.getElementById("google-login-button");
const forgotPasswordButton = document.getElementById("forgot-password-button");
const authContainer = document.getElementById("auth-container");
const authFields = document.getElementById("auth-fields");
const homeUserAvatar = document.getElementById("home-user-avatar");
const homeUserName = document.getElementById("home-user-name");
const appShell = document.getElementById("app-shell");

let tempAmount = 0;
let savedExpenses = [];
let currentUser = null;
let editingExpenseId = null;
let expenseChart = null;
const googleProvider = new GoogleAuthProvider();
const defaultProfilePhoto =
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f464.png";

function unlockNameInput() {
  authName.removeAttribute("readonly");
}

authName.addEventListener("pointerdown", unlockNameInput);
authName.addEventListener("focus", unlockNameInput);

window.addEventListener("pageshow", () => {
  // Some browsers rehydrate autofill after refresh; force-clear auth fields in signed-out view.
  if (!currentUser) {
    authName.value = "";
    authEmail.value = "";
    authPassword.value = "";
    authPhotoFile.value = "";
  }
});

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
  "junk food",
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
  const normalizedTitle = (title || "").toLowerCase();
  return foodKeywords.some((keyword) => normalizedTitle.includes(keyword));
}

function showAuthError(message) {
  authError.innerText = message;
  authError.classList.remove("hide");
}

function clearAuthError() {
  authError.classList.add("hide");
}

function getProfileDocRef(uid) {
  return doc(db, "users", uid, "meta", "profile");
}

function getDisplayName(user, profileData) {
  const docName = (profileData?.displayName || "").trim();
  if (docName) {
    return docName;
  }

  const authNameValue = (user?.displayName || "").trim();
  if (authNameValue) {
    return authNameValue;
  }

  const emailPrefix = (user?.email || "").split("@")[0];
  return emailPrefix || "User";
}

function getPhotoUrl(user, profileData) {
  const uploadedPhoto = (profileData?.photoDataUrl || "").trim();
  if (uploadedPhoto) {
    return uploadedPhoto;
  }

  const docPhoto = (profileData?.photoURL || "").trim();
  if (docPhoto) {
    return docPhoto;
  }

  const authPhoto = (user?.photoURL || "").trim();
  if (authPhoto) {
    return authPhoto;
  }

  return defaultProfilePhoto;
}

function applyProfileToUi(profile) {
  homeUserName.innerText = profile.displayName;
  homeUserAvatar.src = profile.photoURL;
}

async function saveUserProfile(uid, profileData) {
  await setDoc(
    getProfileDocRef(uid),
    {
      displayName: profileData.displayName || "",
      photoURL: profileData.photoURL || "",
      photoDataUrl: profileData.photoDataUrl || "",
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

async function getUserProfile(user) {
  const profileDoc = await getDoc(getProfileDocRef(user.uid));
  const profileData = profileDoc.exists() ? profileDoc.data() : {};

  return {
    displayName: getDisplayName(user, profileData),
    email: user.email || "",
    photoDataUrl: (profileData?.photoDataUrl || "").trim(),
    rawPhotoURL: (profileData?.photoURL || "").trim(),
    photoURL: getPhotoUrl(user, profileData),
  };
}

async function ensureProfileSynced(user) {
  const profile = await getUserProfile(user);

  const authPhotoValue = profile.photoDataUrl
    ? user.photoURL || ""
    : profile.rawPhotoURL || (profile.photoURL === defaultProfilePhoto ? "" : profile.photoURL);

  const needsAuthProfileSync =
    (user.displayName || "") !== profile.displayName ||
    (user.photoURL || "") !== authPhotoValue;

  if (needsAuthProfileSync) {
    await updateProfile(user, {
      displayName: profile.displayName,
      photoURL: authPhotoValue,
    });
  }

  await saveUserProfile(user.uid, {
    displayName: profile.displayName,
    photoURL: profile.rawPhotoURL || (profile.photoDataUrl ? "" : authPhotoValue),
    photoDataUrl: profile.photoDataUrl,
  });

  return {
    ...profile,
    photoURL: profile.photoURL || defaultProfilePhoto,
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read selected image."));
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Selected file is not a valid image."));
    image.src = dataUrl;
  });
}

async function getCompressedProfilePhoto(file) {
  if (!file) {
    return "";
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose a valid image file.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Image is too large. Please choose an image under 10MB.");
  }

  const rawDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageFromDataUrl(rawDataUrl);

  const maxSide = 360;
  const largestSide = Math.max(image.width, image.height);
  const ratio = largestSide > maxSide ? maxSide / largestSide : 1;
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not process image. Please try again.");
  }

  context.drawImage(image, 0, 0, width, height);

  let compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
  if (compressedDataUrl.length > 850000) {
    compressedDataUrl = canvas.toDataURL("image/jpeg", 0.65);
  }

  if (compressedDataUrl.length > 980000) {
    throw new Error("Image is too large after compression. Please use a smaller image.");
  }

  return compressedDataUrl;
}

function getAuthEmailOrShowError() {
  const email = authEmail.value.trim();
  if (!email) {
    showAuthError("Enter your email first, then click forgot password.");
    return "";
  }
  return email;
}

function setSignedInUi(profile) {
  authContainer.classList.add("hide");
  authFields.classList.add("hide");
  appShell.classList.remove("hide");
  applyProfileToUi(profile);
}

function setSignedOutUi() {
  authContainer.classList.remove("hide");
  authFields.classList.remove("hide");
  appShell.classList.add("hide");

  authName.value = "";
  authEmail.value = "";
  authPassword.value = "";
  authPhotoFile.value = "";

  homeUserName.innerText = "";
  homeUserAvatar.removeAttribute("src");
}

function getBudgetDocRef(uid) {
  return doc(db, "users", uid, "meta", "budget");
}

function getExpensesCollectionRef(uid) {
  return collection(db, "users", uid, "expenses");
}

async function loadBudgetAndExpenses(uid) {
  const budgetDoc = await getDoc(getBudgetDocRef(uid));
  tempAmount = budgetDoc.exists() ? Number(budgetDoc.data().amount || 0) : 0;
  amount.innerText = tempAmount;

  const expensesQuery = query(getExpensesCollectionRef(uid), orderBy("date", "desc"));
  const snapshot = await getDocs(expensesQuery);

  savedExpenses = snapshot.docs.map((entry) => ({
    id: entry.id,
    ...entry.data(),
  }));

  loadExpenses();
}

async function saveBudget() {
  if (!currentUser) {
    return;
  }

  await setDoc(getBudgetDocRef(currentUser.uid), { amount: Number(tempAmount) });
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

function disableButtons(bool) {
  const editButtons = document.getElementsByClassName("edit");
  Array.from(editButtons).forEach((element) => {
    element.disabled = bool;
  });
}

async function removeExpense(id) {
  if (!currentUser) {
    return;
  }

  const expenseItem = savedExpenses.find((item) => item.id === id);
  if (!expenseItem) {
    return;
  }

  await deleteDoc(doc(db, "users", currentUser.uid, "expenses", id));

  savedExpenses = savedExpenses.filter((item) => item.id !== id);

  expenditureValue.innerText =
    Number(expenditureValue.innerText) - getExpenseAmount(expenseItem);
  balanceValue.innerText = Number(tempAmount) - Number(expenditureValue.innerText);

  const expenseElement = document.querySelector(`[data-id="${id}"]`);
  if (expenseElement) {
    expenseElement.remove();
  }

  updateAllAnalytics();
}

function editExpense(id) {
  const expenseItem = savedExpenses.find((item) => item.id === id);
  if (!expenseItem || expenseItem.type === "split") {
    return;
  }

  productTitle.value = expenseItem.title || "";
  userAmount.value = getExpenseAmount(expenseItem);
  editingExpenseId = id;
  checkAmountButton.innerText = "Update Amount";
  disableButtons(true);
}

function listCreator(expenseObj) {
  const sublistContent = document.createElement("div");
  sublistContent.classList.add("sublist-content");
  sublistContent.setAttribute("data-id", expenseObj.id);

  const amountValue = getExpenseAmount(expenseObj);
  const formattedDate = new Date(expenseObj.date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });

  const splitInfo =
    expenseObj.type === "split"
      ? `
      <div class="split-details">
        <p class="split-meta">Paid by ${expenseObj.paidBy}</p>
        <p class="split-meta">Split type: ${expenseObj.splitType}</p>
        <p class="split-meta">${(expenseObj.participants || []).length} people</p>
        ${(expenseObj.shares || [])
          .map((share) => `<p class="split-meta">${share.name}: ${Number(share.amount).toFixed(2)}</p>`)
          .join("")}
      </div>
    `
      : "";

  sublistContent.innerHTML = `
    <div class="expense-title-block">
      <p class="product">${expenseObj.title}</p>
      ${expenseObj.type === "split" ? '<span class="split-badge">Split</span>' : ""}
    </div>
    <p class="date">${formattedDate}</p>
    <p class="amount">${amountValue}</p>
    ${splitInfo}
  `;

  const editButton = document.createElement("button");
  editButton.classList.add("fa-solid", "fa-pen-to-square", "edit");

  if (expenseObj.type !== "split") {
    editButton.addEventListener("click", () => editExpense(expenseObj.id));
  } else {
    editButton.disabled = true;
    editButton.title = "Split expenses can be deleted, not edited inline";
  }

  const deleteButton = document.createElement("button");
  deleteButton.classList.add("fa-solid", "fa-trash-can", "delete");
  deleteButton.addEventListener("click", () => {
    removeExpense(expenseObj.id).catch(() => {
      showAuthError("Could not delete expense. Please try again.");
    });
  });

  sublistContent.appendChild(editButton);
  sublistContent.appendChild(deleteButton);
  list.appendChild(sublistContent);
}

function loadExpenses() {
  list.innerHTML = "";
  expenditureValue.innerText = 0;

  savedExpenses
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((item) => {
      const normalizedItem = getNormalizedExpense(item);
      listCreator(normalizedItem);
      expenditureValue.innerText =
        Number(expenditureValue.innerText) + getExpenseAmount(normalizedItem);
    });

  balanceValue.innerText = Number(tempAmount) - Number(expenditureValue.innerText);
  updateAllAnalytics();
}

function getSpendingByDate(date) {
  const dateString = new Date(date).toDateString();
  return savedExpenses
    .filter((item) => new Date(item.date).toDateString() === dateString)
    .reduce((sum, item) => sum + getExpenseAmount(item), 0);
}

function getUniqueDates() {
  const dates = {};
  savedExpenses.forEach((item) => {
    const dateString = new Date(item.date).toDateString();
    if (!dates[dateString]) {
      dates[dateString] = true;
    }
  });

  return Object.keys(dates)
    .map((dateString) => new Date(dateString))
    .sort((a, b) => a - b);
}

function checkSpendingAlert(todaySpending, yesterdaySpending) {
  const alertContainer = document.getElementById("spending-alert");
  const alertMessage = document.getElementById("alert-message");

  if (yesterdaySpending > 0 && todaySpending > yesterdaySpending) {
    const difference = todaySpending - yesterdaySpending;
    const percentage = Math.round((difference / yesterdaySpending) * 100);
    alertMessage.innerText = `You spent Rs ${difference} (${percentage}%) more than yesterday!`;
    alertContainer.classList.remove("hide");
  } else {
    alertContainer.classList.add("hide");
  }
}

function updateExpenseChart() {
  const last14Days = [];
  const todayDate = new Date();

  for (let i = 13; i >= 0; i -= 1) {
    const date = new Date(todayDate);
    date.setDate(date.getDate() - i);
    last14Days.push(date);
  }

  const labels = last14Days.map((date) =>
    date.toLocaleDateString("en-GB", { month: "short", day: "numeric" })
  );

  const data = last14Days.map((date) => getSpendingByDate(date));

  const canvas = document.getElementById("expenseChart");
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");
  if (expenseChart) {
    expenseChart.destroy();
  }

  expenseChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Daily Expenses",
          data,
          borderColor: "#2b6df8",
          backgroundColor: "rgba(43, 109, 248, 0.16)",
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: "#0f172a",
          pointBorderColor: "#9fc1ff",
          pointBorderWidth: 2.5,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: "#1d4ed8",
          pointHoverBorderColor: "#ffffff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#24324d",
            font: {
              size: 13,
              weight: "600",
            },
          },
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.94)",
          titleColor: "#93c5fd",
          bodyColor: "#f8fafc",
          borderColor: "#60a5fa",
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label(context) {
              return `Spending: Rs ${context.parsed.y}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(36, 50, 77, 0.14)",
          },
          ticks: {
            color: "#334155",
            font: {
              size: 12,
              weight: "600",
            },
            callback(value) {
              return "Rs " + value;
            },
          },
        },
        x: {
          grid: {
            color: "rgba(36, 50, 77, 0.08)",
          },
          ticks: {
            color: "#475569",
            font: {
              size: 11,
              weight: "600",
            },
          },
        },
      },
    },
  });
}

function updateAnalytics() {
  const todayDate = new Date();
  const yesterday = new Date(todayDate);
  yesterday.setDate(yesterday.getDate() - 1);

  const todaySpending = getSpendingByDate(todayDate);
  const yesterdaySpending = getSpendingByDate(yesterday);

  document.getElementById("today-spending").innerText = todaySpending;
  document.getElementById("yesterday-spending").innerText = yesterdaySpending;

  const uniqueDates = getUniqueDates();
  const dailyAverage =
    uniqueDates.length > 0
      ? Math.round(Number(expenditureValue.innerText) / uniqueDates.length)
      : 0;

  document.getElementById("daily-average").innerText = dailyAverage;

  const trendElement = document.getElementById("spending-trend");
  if (yesterdaySpending === 0 && todaySpending > 0) {
    trendElement.innerText = "New Day";
  } else if (todaySpending > yesterdaySpending && yesterdaySpending > 0) {
    const increase = Math.round(
      ((todaySpending - yesterdaySpending) / yesterdaySpending) * 100
    );
    trendElement.innerText = `+${increase}%`;
    trendElement.style.color = "#ff6348";
  } else if (todaySpending < yesterdaySpending && yesterdaySpending > 0) {
    const decrease = Math.round(
      ((yesterdaySpending - todaySpending) / yesterdaySpending) * 100
    );
    trendElement.innerText = `-${decrease}%`;
    trendElement.style.color = "#2ecc71";
  } else {
    trendElement.innerText = "Stable";
    trendElement.style.color = "#ffcc00";
  }

  checkSpendingAlert(todaySpending, yesterdaySpending);
  updateExpenseChart();
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
        "Use split expenses only for planned group meals.",
      ],
    });
    return;
  }

  renderAdvisor({
    level: "safe",
    title: "Spending looks balanced",
    message:
      "No oily food or fast-food pattern detected in your saved expenses right now.",
    tips: [
      "Keep a 10% buffer for monthly savings.",
      "Review weekly expenses before adding new purchases.",
      "Use split expenses to divide shared costs fairly.",
      "Move small impulse buys into a separate food or misc budget.",
    ],
  });
}

function updateAllAnalytics() {
  updateAnalytics();
  updateAdvisorForExpense();
}

registerButton.addEventListener("click", async () => {
  clearAuthError();

  const name = authName.value.trim();

  let photoDataUrl = "";
  if (authPhotoFile.files && authPhotoFile.files[0]) {
    try {
      photoDataUrl = await getCompressedProfilePhoto(authPhotoFile.files[0]);
    } catch (error) {
      showAuthError(error.message || "Could not process selected image.");
      return;
    }
  }

  if (!name) {
    showAuthError("Please enter your name before registering.");
    return;
  }

  try {
    const credentials = await createUserWithEmailAndPassword(
      auth,
      authEmail.value.trim(),
      authPassword.value
    );

    await updateProfile(credentials.user, {
      displayName: name,
      photoURL: "",
    });

    await saveUserProfile(credentials.user.uid, {
      displayName: name,
      photoURL: "",
      photoDataUrl,
    });

    authName.value = "";
    authPhotoFile.value = "";
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


totalAmountButton.addEventListener("click", async () => {
  tempAmount = Number(totalAmount.value);

  if (!Number.isFinite(tempAmount) || tempAmount < 0) {
    errorMessage.classList.remove("hide");
    return;
  }

  errorMessage.classList.add("hide");
  amount.innerText = tempAmount;
  balanceValue.innerText = Number(tempAmount) - Number(expenditureValue.innerText);
  totalAmount.value = "";

  try {
    await saveBudget();
  } catch {
    showAuthError("Could not save budget. Please try again.");
  }
});

checkAmountButton.addEventListener("click", async () => {
  if (!userAmount.value || !productTitle.value) {
    productTitleError.classList.remove("hide");
    return;
  }

  if (!currentUser) {
    showAuthError("Please login first.");
    return;
  }

  productTitleError.classList.add("hide");

  const expenditure = Number(userAmount.value);
  if (!Number.isFinite(expenditure) || expenditure <= 0) {
    productTitleError.innerText = "Amount must be greater than zero";
    productTitleError.classList.remove("hide");
    return;
  }

  const payload = {
    type: "normal",
    title: productTitle.value.trim(),
    cost: expenditure,
    date: new Date().toISOString(),
  };

  try {
    if (editingExpenseId) {
      await updateDoc(doc(db, "users", currentUser.uid, "expenses", editingExpenseId), payload);
      savedExpenses = savedExpenses.map((item) =>
        item.id === editingExpenseId ? { ...item, ...payload } : item
      );
      editingExpenseId = null;
      checkAmountButton.innerText = "Check Amount";
      disableButtons(false);
    } else {
      const added = await addDoc(getExpensesCollectionRef(currentUser.uid), payload);
      savedExpenses.push({ id: added.id, ...payload });
    }

    userAmount.value = "";
    productTitle.value = "";
    loadExpenses();
  } catch {
    showAuthError("Could not save expense. Please try again.");
  }
});

onAuthStateChanged(auth, async (user) => {
  clearAuthError();

  if (!user) {
    currentUser = null;
    savedExpenses = [];
    tempAmount = 0;
    amount.innerText = 0;
    expenditureValue.innerText = 0;
    balanceValue.innerText = 0;
    list.innerHTML = "";
    setSignedOutUi();
    return;
  }

  currentUser = user;

  try {
    const profile = await ensureProfileSynced(user);
    setSignedInUi(profile);
    await loadBudgetAndExpenses(user.uid);
  } catch {
    showAuthError("Could not load your account data from Firestore.");
  }
});

const today = new Date();
const monthNames = [
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

document.getElementById("current-month").innerText =
  `${monthNames[today.getMonth()]}-${today.getFullYear()}`;
