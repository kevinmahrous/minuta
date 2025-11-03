<template>
  <div class="flex min-h-screen select-none">
    <div class="flex-1 items-center justify-center hidden md:flex">
      <img
        src="../assets/login.svg"
        alt="Login"
        class="w-2/3 h-2/3 object-contain"
      />
    </div>
    <div class="flex-1 flex flex-col items-center justify-center space-y-4">
      <h1 class="text-3xl font-bold">Login</h1>
      <form
        class="flex flex-col space-y-4 w-full max-w-xs sm:max-w-md"
        @submit.prevent="login"
      >
        <div class="flex flex-col gap-2">
          <span>Email</span>
          <InputText
            v-model="email"
            aria-label="Email"
            name="email"
            autocomplete
            inputmode="email"
            fluid
          />
          <Message size="small" severity="secondary" variant="simple"
            >Enter your email.</Message
          >
        </div>
        <div class="flex flex-col gap-2">
          <span>Password</span>
          <Password
            aria-label="Password"
            name="password"
            autocomplete
            v-model="password"
            toggleMask
            :feedback="false"
            fluid
          />
          <Message size="small" severity="secondary" variant="simple"
            >Enter your password.</Message
          >
        </div>
        <Button type="submit" :disabled="!email || !password" fluid
          ><ArrowRightEndOnRectangleIcon class="w-5 h-5" />Login</Button
        >
      </form>
      <Button variant="text" @click="forgotPassword"
        ><KeyIcon class="w-5 h-5" />Forgot Password</Button
      >
    </div>
  </div>
  <Dialog
    v-model:visible="showForgotDialog"
    header="Reset Password"
    :modal="true"
    :closable="true"
    class="select-none"
  >
    <div class="flex flex-col gap-2">
      <span>Email</span>
      <InputText
        v-model="forgotEmail"
        aria-label="forgotEmail"
        name="forgotEmail"
        autocomplete
        inputmode="email"
        fluid
      />
      <Message size="small" severity="secondary" variant="simple"
        >Instructions will be sent to your email.</Message
      >
      <div class="flex justify-end gap-2">
        <Button @click="sendForgotEmail"
          ><PaperAirplaneIcon class="w-5 h-5" /> Send</Button
        >
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref } from "vue";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";
import { useToast } from "primevue/usetoast";
import { useRouter } from "vue-router";
import {
  ArrowRightEndOnRectangleIcon,
  KeyIcon,
  PaperAirplaneIcon,
} from "@heroicons/vue/24/outline";

const toast = useToast();
const email = ref("");
const password = ref("");
const router = useRouter();
const showForgotDialog = ref(false);
const forgotEmail = ref("");

async function login() {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    toast.add({
      severity: "success",
      summary: "Welcome to Minuta!",
      detail: "You're on the radar now.",
      life: 3000,
    });
    router.push("/profile");
  } catch (error) {
    const friendlyMessages = {
      "auth/invalid-credential": "Either email or password is incorrect.",
      "auth/invalid-email": "Either email or password is incorrect.",
      "auth/user-disabled": "Your account has been disabled. Contact support.",
      "auth/user-not-found": "Either email or password is incorrect.",
      "auth/wrong-password": "Either email or password is incorrect.",
      "auth/too-many-requests":
        "Too many login attempts. Wait a bit and try again.",
      "auth/network-request-failed":
        "Network error. Check your internet connection.",
      "auth/internal-error": "Internal error. Wait a bit and try again.",
    };
    const message =
      friendlyMessages[error.code] || "An unexpected error occurred.";
    toast.add({
      severity: "error",
      summary: "Couldn't login!",
      detail: message,
      life: 3000,
    });
  }
}

function forgotPassword() {
  forgotEmail.value = email.value || "";
  showForgotDialog.value = true;
}

async function sendForgotEmail() {
  try {
    await sendPasswordResetEmail(auth, forgotEmail.value);
    toast.add({
      severity: "success",
      summary: "Email sent!",
      detail: `Check ${forgotEmail.value} for instructions.`,
      life: 3000,
    });
    showForgotDialog.value = false;
  } catch (error) {
    const friendlyMessages = {
      "auth/invalid-email": "The email address is invalid.",
      "auth/user-not-found": "The email address is invalid.",
      "auth/network-request-failed":
        "Network error. Check your internet connection.",
    };
    const message =
      friendlyMessages[error.code] || "An unexpected error occured.";
    toast.add({
      severity: "error",
      summary: "Couldn't send!",
      detail: message,
      life: 3000,
    });
  }
}
</script>
