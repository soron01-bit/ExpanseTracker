import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const authError = document.getElementById("auth-error");
const authName = document.getElementById("auth-name");
const authPhotoFile = document.getElementById("auth-photo-file");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const registerButton = document.getElementById("register-button");

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

registerButton.addEventListener("click", async () => {
  clearAuthError();

  const name = authName.value.trim();
  const email = authEmail.value.trim();
  const password = authPassword.value;

  if (!name) {
    showAuthError("Please enter your full name.");
    return;
  }

  if (!email) {
    showAuthError("Please enter your email.");
    return;
  }

  if (!password || password.length < 6) {
    showAuthError("Password must be at least 6 characters.");
    return;
  }

  let photoDataUrl = "";
  if (authPhotoFile.files && authPhotoFile.files[0]) {
    try {
      photoDataUrl = await getCompressedProfilePhoto(authPhotoFile.files[0]);
    } catch (error) {
      showAuthError(error.message || "Could not process selected image.");
      return;
    }
  }

  try {
    const credentials = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(credentials.user, {
      displayName: name,
      photoURL: "",
    });

    await saveUserProfile(credentials.user.uid, {
      displayName: name,
      photoURL: "",
      photoDataUrl,
    });

    window.location.href = "index.html";
  } catch (error) {
    showAuthError(error.message || "Registration failed.");
  }
});
