<template>
  <div class="flex min-h-screen select-none">
    <div class="flex-1 items-center justify-center hidden md:flex">
      <img
        src="../assets/signup.svg"
        alt="Signup"
        class="w-2/3 h-2/3 object-contain"
      />
    </div>
    <div class="flex-1 flex flex-col items-center justify-center space-y-4">
      <h1 class="text-3xl font-bold">Signup</h1>
      <form
        class="flex flex-col space-y-4 w-full max-w-xs sm:max-w-md"
        @submit.prevent="signup"
      >
        <div class="flex flex-col gap-2">
          <span>Full Name</span>
          <InputText
            aria-label="Full Name"
            name="fullName"
            autocomplete
            v-model="fullName"
            fluid
          />
          <Message size="small" severity="secondary" variant="simple"
            >A first and second name preferably.</Message
          >
        </div>
        <div class="flex flex-col gap-2">
          <span>Email</span>
          <InputText
            aria-label="Email"
            name="email"
            autocomplete
            v-model="email"
            inputmode="email"
            fluid
          />
          <Message size="small" severity="secondary" variant="simple"
            >A valid email address that will be verified.</Message
          >
        </div>
        <div class="flex flex-col gap-2">
          <span>Password</span>
          <Password
            v-model="password"
            toggleMask
            :feedback="false"
            aria-label="Password"
            name="password"
            autocomplete
            fluid
          />
          <Message size="small" severity="secondary" variant="simple"
            >A password of minimum 6 characters.</Message
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
        <Button
          type="submit"
          :disabled="!fullName || !email || !password || !selectedFile"
          fluid
          ><ArrowRightEndOnRectangleIcon class="w-5 h-5" />Signup</Button
        >
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../firebase";
import { useToast } from "primevue/usetoast";
import { useRouter } from "vue-router";
import { ArrowRightEndOnRectangleIcon } from "@heroicons/vue/24/outline";

const toast = useToast();
const fullName = ref("");
const email = ref("");
const password = ref("");
const selectedFile = ref(null);
const src = ref(null);
const router = useRouter();

function onFileSelect(event) {
  selectedFile.value = event.files[0] || null;
  if (selectedFile.value) {
    src.value = URL.createObjectURL(selectedFile.value);
  } else {
    src.value = null;
  }
}

async function uploadPhoto() {
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

async function signup() {
  try {
    const uploadedURL = await uploadPhoto();
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );
    await updateProfile(userCredential.user, {
      displayName: fullName.value,
      photoURL: uploadedURL,
    });
    await sendEmailVerification(userCredential.user);
    toast.add({
      severity: "success",
      summary: "Welcome to Minuta!",
      detail: "Verify your email to get started.",
      life: 3000,
    });
    router.push("/profile");
  } catch (error) {
    const friendlyMessages = {
      "auth/email-already-in-use":
        "This email is already registered. Try logging in instead.",
      "auth/invalid-email": "Enter a valid email address.",
      "auth/weak-password": "Password is too weak. Try a stronger password.",
      "auth/network-request-failed":
        "Network error. Check your internet connection.",
      "auth/internal-error": "Internal error. Wait a bit and try again.",
    };
    const message =
      friendlyMessages[error.code] || "An unexpected error occurred.";
    toast.add({
      severity: "error",
      summary: "Couldn't signup!",
      detail: message || "An unexpected error occurred.",
      life: 3000,
    });
  }
}
</script>
