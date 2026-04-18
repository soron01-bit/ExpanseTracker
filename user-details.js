import { auth, db } from "./firebase-config.js";
import {
  signOut,
  deleteUser,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const editProfileButton = document.getElementById("edit-profile-button");
const logoutButton = document.getElementById("logout-button");
const deleteAccountButton = document.getElementById("delete-account-button");
const editProfileForm = document.getElementById("edit-profile-form");
const saveProfileButton = document.getElementById("save-profile-button");
const cancelProfileButton = document.getElementById("cancel-profile-button");
const profileNameInput = document.getElementById("profile-name");
const profilePhotoFile = document.getElementById("profile-photo-file");
const detailsUserAvatar = document.getElementById("details-user-avatar");
const detailsUserName = document.getElementById("details-user-name");
const detailsUserEmail = document.getElementById("details-user-email");

let currentUser = null;

const defaultProfilePhoto =
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f464.png";

function getProfileDocRef(uid) {
  return doc(db, "users", uid, "meta", "profile");
}

function getBudgetDocRef(uid) {
  return doc(db, "users", uid, "meta", "budget");
}

function getExpensesCollectionRef(uid) {
  return collection(db, "users", uid, "expenses");
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

function setProfileEditVisibility(showEdit) {
  if (showEdit) {
    editProfileForm.classList.remove("hide");
  } else {
    editProfileForm.classList.add("hide");
  }
}

function applyProfileToUi(profile) {
  detailsUserName.innerText = profile.displayName;
  detailsUserEmail.innerText = profile.email || "";
  detailsUserAvatar.src = profile.photoURL;
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

async function deleteUserData(uid) {
  const expensesSnapshot = await getDocs(getExpensesCollectionRef(uid));

  if (!expensesSnapshot.empty) {
    await Promise.all(expensesSnapshot.docs.map((expenseDoc) => deleteDoc(expenseDoc.ref)));
  }

  await Promise.all([
    deleteDoc(getBudgetDocRef(uid)).catch(() => {}),
    deleteDoc(getProfileDocRef(uid)).catch(() => {}),
  ]);
}

editProfileButton.addEventListener("click", async () => {
  if (!currentUser) {
    window.alert("Please login first.");
    return;
  }

  try {
    const profile = await getUserProfile(currentUser);
    profileNameInput.value = profile.displayName;
    profilePhotoFile.value = "";
    setProfileEditVisibility(true);
  } catch {
    window.alert("Could not load profile. Please try again.");
  }
});

cancelProfileButton.addEventListener("click", () => {
  setProfileEditVisibility(false);
});

saveProfileButton.addEventListener("click", async () => {
  if (!currentUser) {
    window.alert("Please login first.");
    return;
  }

  const displayName = profileNameInput.value.trim();
  if (!displayName) {
    window.alert("Name cannot be empty.");
    return;
  }

  try {
    const existingProfile = await getUserProfile(currentUser);
    let photoDataUrl = existingProfile.photoDataUrl || "";

    if (profilePhotoFile.files && profilePhotoFile.files[0]) {
      photoDataUrl = await getCompressedProfilePhoto(profilePhotoFile.files[0]);
    }

    await updateProfile(currentUser, {
      displayName,
      photoURL: existingProfile.rawPhotoURL || currentUser.photoURL || "",
    });

    await saveUserProfile(currentUser.uid, {
      displayName,
      photoURL: existingProfile.rawPhotoURL || currentUser.photoURL || "",
      photoDataUrl,
    });

    applyProfileToUi({
      displayName,
      email: currentUser.email || "",
      photoURL:
        photoDataUrl ||
        existingProfile.rawPhotoURL ||
        currentUser.photoURL ||
        defaultProfilePhoto,
    });

    profilePhotoFile.value = "";
    setProfileEditVisibility(false);
  } catch (error) {
    window.alert(error.message || "Could not update profile. Please try again.");
  }
});

logoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (error) {
    window.alert(error.message || "Logout failed.");
  }
});

deleteAccountButton.addEventListener("click", async () => {
  if (!currentUser) {
    window.alert("Please login first.");
    return;
  }

  const confirmed = window.confirm(
    "This will permanently delete your account and all saved expenses. Continue?"
  );
  if (!confirmed) {
    return;
  }

  const confirmText = window.prompt("Type DELETE to confirm account deletion:", "");
  if ((confirmText || "").trim().toUpperCase() !== "DELETE") {
    window.alert("Deletion cancelled. Account was not deleted.");
    return;
  }

  try {
    const deletingUser = currentUser;
    await deleteUserData(deletingUser.uid);
    await deleteUser(deletingUser);
    window.location.href = "index.html";
  } catch (error) {
    if (error?.code === "auth/requires-recent-login") {
      window.alert("For security, please log in again and then delete your account.");
      return;
    }

    window.alert(error.message || "Could not delete account. Please try again.");
  }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;

  try {
    const profile = await getUserProfile(user);
    applyProfileToUi(profile);
    setProfileEditVisibility(false);
  } catch {
    window.alert("Could not load your account data from Firestore.");
  }
});
