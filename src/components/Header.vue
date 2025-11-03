<template>
  <Menubar
    :model="menuItemsModel"
    class="flex flex-row items-center flex-wrap select-none"
  >
    <template #start>
      <router-link to="/" class="flex items-center justify-center space-x-2">
        <img
          src="../assets/minuta.svg"
          alt="Minuta"
          class="h-12 w-12 object-contain"
        />
        <span class="text-xl font-bold">Minuta</span>
      </router-link>
    </template>
    <template #item="{ item }" class="flex flex-row items-center space-x-4">
      <router-link
        v-if="item.route"
        :to="item.route"
        class="text-teal-500"
        :class="{ 'text-teal-700 font-bold': $route.path === item.route }"
      >
        <Button
          variant="text"
          class="flex flex-row items-center justify-center"
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span>{{ item.label }}</span>
        </Button>
      </router-link>
    </template>
    <template #end>
      <div class="flex items-center justify-center space-x-2">
        <router-link to="/login" v-if="!user">
          <Button
            ><ArrowRightStartOnRectangleIcon class="w-6 h-6" />Login</Button
          >
        </router-link>
        <router-link to="/signup" v-if="!user">
          <Button><UserPlusIcon class="w-6 h-6" />Signup</Button>
        </router-link>
        <Button v-else @click="out"
          ><ArrowLeftStartOnRectangleIcon class="w-6 h-6" />Logout</Button
        >
        <Button @click="toggleDarkMode">
          <component :is="modeIcon" class="h-6 w-6" />
        </Button>
      </div>
    </template>
  </Menubar>
</template>

<script setup>
import { computed } from "vue";
import { user, auth } from "../firebase";
import {
  SunIcon,
  MoonIcon,
  TvIcon,
  ChartBarIcon,
  ClockIcon,
  ChartPieIcon,
  UserIcon,
  ArrowRightStartOnRectangleIcon,
  UserPlusIcon,
  ArrowLeftStartOnRectangleIcon,
} from "@heroicons/vue/24/outline";
import { useDarkMode } from "../helpers";
import { signOut } from "firebase/auth";
import { useToast } from "primevue/usetoast";
import { useRouter } from "vue-router";

const toast = useToast();
const router = useRouter();
const { mode, setMode } = useDarkMode();

const toggleDarkMode = () => {
  if (mode.value === "light") setMode("dark");
  else if (mode.value === "dark") setMode("system");
  else setMode("light");
};

const modeIcon = computed(() => {
  if (mode.value === "light") return SunIcon;
  if (mode.value === "dark") return MoonIcon;
  return TvIcon;
});

const out = async () => {
  try {
    await signOut(auth);
    toast.add({
      severity: "success",
      summary: "You're off the radar!",
      detail: "You vanished like you were never here.",
      life: 3000,
    });
    router.push("/login");
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Still on the radar!",
      detail: error.message,
      life: 3000,
    });
  }
};

const menuItemsModel = computed(() => {
  if (user.value) {
    return [
      {
        label: "Tracking",
        route: "/tracking",
        icon: ChartBarIcon,
      },
      {
        label: "Sessions",
        route: "/sessions",
        icon: ClockIcon,
      },
      {
        label: "Analytics",
        route: "/analytics",
        icon: ChartPieIcon,
      },
      {
        label: "Profile",
        route: "/profile",
        icon: UserIcon,
      },
    ];
  }
});
</script>
