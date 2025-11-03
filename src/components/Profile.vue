<template>
  <div class="flex min-h-screen select-none" v-if="!currentUser.emailVerified">
    <div class="flex flex-1 flex-col items-center justify-center space-y-8">
      <img
        src="../assets/email.svg"
        alt="Email Verification"
        class="w-1/3 h-1/3 object-contain"
      />
      <h1 class="text-5xl font-extrabold">Verify your email, please.</h1>
      <p class="text-lg p-1">
        You need to verify your email before using the app.
      </p>
      <Button label="Resend" @click="resendVerification" />
    </div>
  </div>
  <div class="flex min-h-screen select-none" v-else>
    <div class="flex w-full justify-center items-center">
      <div
        class="flex md:flex-row flex-col justify-center space-y-12 space-x-0 md:space-y-0 md:space-x-64 w-full"
      >
        <div class="flex flex-col space-y-4 md:w-[28%]">
          <img
            :src="currentUser.photoURL"
            alt="Profile Photo"
            class="w-40 h-40 rounded-full object-cover mx-auto md:mx-0"
          />
          <form
            @submit.prevent="updateProfileInfo"
            class="flex flex-col space-y-4 w-full max-w-xs sm:max-w-md"
          >
            <div class="flex flex-col gap-2">
              <span>Account</span>
              <div class="flex flex-row items-start justify-start space-x-2">
                <Tag severity="info" class="flex items-center justify-center">
                  <CakeIcon class="w-5 h-5" />
                  {{ formatDate(currentUser.metadata.creationTime) }} ({{
                    age(currentUser.metadata.creationTime)
                  }})
                </Tag>
                <Tag severity="info" class="flex items-center justify-center">
                  <ArrowLeftEndOnRectangleIcon class="w-5 h-5" />
                  {{ formatDate(currentUser.metadata.lastSignInTime) }}
                </Tag>
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <span>Name</span>
              <InputText
                v-model="newName"
                fluid
                aria-label="newName"
                name="newName"
                autocomplete
              />
              <Message size="small" severity="secondary" variant="simple"
                >A first and second name preferably.</Message
              >
            </div>
            <div class="flex flex-col gap-2">
              <span>Current Email</span>
              <InputText
                v-model="currentUser.email"
                fluid
                aria-label="Email"
                name="email"
                autocomplete
                inputmode="email"
                :disabled="true"
              />
              <Tag severity="success" class="flex items-center justify-center">
                <CheckCircleIcon class="w-5 h-5" /><span>Verified</span>
              </Tag>
              <Message size="small" severity="secondary" variant="simple"
                >Your current email to access your account.</Message
              >
            </div>
            <div class="flex flex-col gap-2">
              <span>Profile Photo</span>
              <FileUpload
                mode="basic"
                accept="image/*"
                customUpload
                :choose-label="'Choose'"
                :auto="false"
                :maxFileSize="1048576"
                @select="onFileSelect"
              />
              <Message size="small" severity="secondary" variant="simple"
                >A profile photo to personalize your account.</Message
              >
            </div>
            <div v-if="src" class="flex flex-col gap-2">
              <span>Preview</span>
              <img :src="src" alt="Preview" class="rounded-lg w-full" />
            </div>
            <Button type="submit" :disabled="!newName && !selectedFile"
              ><ArrowPathIcon class="w-5 h-5" />Update Profile</Button
            >
          </form>
        </div>
        <div class="flex flex-col space-y-4 md:w-[28%]">
          <form
            @submit.prevent="changeEmail"
            class="flex flex-col space-y-4 w-full max-w-xs sm:max-w-md"
          >
            <h1 class="text-2xl font-bold">Change Email</h1>
            <div class="flex flex-col gap-2">
              <span>New Email</span>
              <InputText
                v-model="newEmail"
                inputmode="email"
                aria-label="Email"
                name="email"
                autocomplete
                fluid
              />
              <Message size="small" severity="secondary" variant="simple"
                >A valid email address that will be verified.</Message
              >
            </div>
            <div class="flex flex-col gap-2">
              <span>Current Password</span>
              <Password
                v-model="currentPasswordForEmail"
                toggleMask
                aria-label="Password"
                name="password"
                autocomplete
                :feedback="false"
                fluid
              />
              <Message size="small" severity="secondary" variant="simple"
                >Your current password.</Message
              >
            </div>
            <Button
              type="submit"
              :disabled="!newEmail || !currentPasswordForEmail"
              ><ArrowPathIcon class="w-5 h-5" />Change Email</Button
            >
          </form>
          <form
            @submit.prevent="changePassword"
            class="flex flex-col space-y-4 w-full max-w-xs sm:max-w-md"
          >
            <Divider />
            <h1 class="text-2xl font-bold">Change Password</h1>
            <div class="flex flex-col gap-2">
              <span>Current Password</span>
              <Password
                v-model="currentPasswordForPassword"
                toggleMask
                aria-label="Password"
                name="password"
                autocomplete
                :feedback="false"
                fluid
              />
              <Message size="small" severity="secondary" variant="simple"
                >Your current password.</Message
              >
            </div>
            <div class="flex flex-col gap-2">
              <span>New Password</span>
              <Password
                v-model="newPassword"
                toggleMask
                aria-label="Password"
                name="password"
                autocomplete
                :feedback="false"
                fluid
              />
              <Message size="small" severity="secondary" variant="simple"
                >Your new password.</Message
              >
            </div>
            <Button
              type="submit"
              :disabled="!currentPasswordForPassword || !newPassword"
              ><ArrowPathIcon class="w-5 h-5" />Change Password</Button
            >
          </form>
          <form class="flex flex-col space-y-4 w-full max-w-xs sm:max-w-md">
            <Divider />
            <h1 class="text-2xl font-bold t">Delete Account</h1>
            <div class="flex flex-col gap-2">
              <span>Current Password</span>
              <Password
                v-model="currentPasswordForDelete"
                toggleMask
                aria-label="Password"
                name="password"
                autocomplete
                :feedback="false"
                fluid
              />
            </div>
            <Button
              severity="danger"
              :disabled="!currentPasswordForDelete"
              @click="showDeleteDialog = true"
              ><UserMinusIcon class="w-5 h-5" />Delete Account</Button
            >
          </form>
          <Dialog
            v-model:visible="showDeleteDialog"
            header="Confirm Deletion"
            :modal="true"
            :closable="true"
            class="select-none"
          >
            <div class="flex flex-col gap-2">
              <p class="text-lg">
                Are you sure you want to delete your account?
              </p>
              <Message size="small" severity="info" variant="simple"
                >You won't be able to restore it in forever.</Message
              >
              <Message size="small" severity="warn" variant="simple"
                >Forever means a long time.</Message
              >
              <Message size="small" severity="error" variant="simple"
                >Gonna miss you.</Message
              >
              <div class="flex justify-end gap-2">
                <Button severity="danger" @click="confirmDeleteAccount"
                  ><UserMinusIcon class="w-5 h-5" />Delete</Button
                >
              </div>
            </div>
          </Dialog>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { auth, user as currentUser } from "../firebase";
import { useToast } from "primevue/usetoast";
import {
  updateProfile,
  verifyBeforeUpdateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  sendEmailVerification,
  deleteUser,
} from "firebase/auth";
import {
  CheckCircleIcon,
  CakeIcon,
  ArrowLeftEndOnRectangleIcon,
  ArrowPathIcon,
  UserMinusIcon,
} from "@heroicons/vue/24/solid";
import { age, formatDate } from "../helpers";
import { useRouter } from "vue-router";

const toast = useToast();
const router = useRouter();

const newName = ref(currentUser.value?.displayName || "");
const selectedFile = ref(null);
const src = ref(null);

function onFileSelect(event) {
  selectedFile.value = event.files[0] || null;
  src.value = selectedFile.value
    ? URL.createObjectURL(selectedFile.value)
    : null;
}

async function uploadPhoto() {
  if (!selectedFile.value) return null;
  const formData = new FormData();
  formData.append("image", selectedFile.value);
  formData.append("key", import.meta.env.VITE_IMGBB_API_KEY);
  const res = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (data.success) return data.data.display_url;
}

async function updateProfileInfo() {
  try {
    const photoURL = selectedFile.value
      ? await uploadPhoto()
      : currentUser.value.photoURL;
    await updateProfile(auth.currentUser, {
      displayName: newName.value || currentUser.value.displayName,
      photoURL,
    });
    toast.add({
      severity: "success",
      summary: "Profile updated!",
      detail: "Your new profile is so shiny.",
      life: 3000,
    });
    selectedFile.value = null;
    src.value = null;
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Couldn't update!",
      detail: "An unexpected error occured.",
      life: 3000,
    });
  }
}

async function reauth(password) {
  const cred = EmailAuthProvider.credential(auth.currentUser.email, password);
  await reauthenticateWithCredential(auth.currentUser, cred);
}

const newEmail = ref("");
const currentPasswordForEmail = ref("");
async function changeEmail() {
  try {
    await reauth(currentPasswordForEmail.value);
    await verifyBeforeUpdateEmail(auth.currentUser, newEmail.value);
    toast.add({
      severity: "success",
      summary: "Email updated!",
      detail: "Verify your email, then re-login with the new email.",
      life: 3000,
    });
    newEmail.value = "";
    currentPasswordForEmail.value = "";
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Change failed!",
      detail: "An unexpected error occured.",
      life: 3000,
    });
  }
}

const currentPasswordForPassword = ref("");
const newPassword = ref("");
async function changePassword() {
  try {
    await reauth(currentPasswordForPassword.value);
    await updatePassword(auth.currentUser, newPassword.value);
    toast.add({
      severity: "success",
      summary: "Password updated!",
      detail: "Your new password is shiny.",
      life: 3000,
    });
    currentPasswordForPassword.value = "";
    newPassword.value = "";
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Change failed!",
      detail: "An unexpected error occured.",
      life: 3000,
    });
  }
}

async function resendVerification() {
  try {
    await sendEmailVerification(auth.currentUser);
    toast.add({
      severity: "success",
      summary: "Verification sent!",
      detail: "Go and check your inbox.",
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Sending failed!",
      detail: "An unexpected error occured.",
      life: 3000,
    });
  }
}

const currentPasswordForDelete = ref("");
const showDeleteDialog = ref(false);
async function confirmDeleteAccount() {
  try {
    await reauth(currentPasswordForDelete.value);
    await deleteUser(auth.currentUser);
    toast.add({
      severity: "success",
      summary: "Account gone!",
      detail: "Sorry to see you go.",
      life: 3000,
    });
    showDeleteDialog.value = false;
    currentPasswordForDelete.value = "";
    router.push("/signup");
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Couldn't delete",
      detail: "Your password might be incorrect. Try again.",
      life: 3000,
    });
  }
}
</script>
