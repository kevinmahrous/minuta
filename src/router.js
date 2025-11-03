import { createRouter, createWebHistory } from "vue-router";
import { user, authReady } from "./firebase";
import { watch } from "vue";

const Home = () => import("./components/Home.vue");
const Login = () => import("./components/Login.vue");
const Signup = () => import("./components/Signup.vue");
const Tracking = () => import("./components/Tracking.vue");
const Sessions = () => import("./components/Sessions.vue");
const Analytics = () => import("./components/Analytics.vue");
const Profile = () => import("./components/Profile.vue");

const routes = [
  { path: "/", name: "Home", component: Home },
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { guestOnly: true },
  },
  {
    path: "/signup",
    name: "Signup",
    component: Signup,
    meta: { guestOnly: true },
  },
  {
    path: "/tracking",
    name: "Tracking",
    component: Tracking,
    meta: { requiresAuth: true },
  },
  {
    path: "/sessions",
    name: "Sessions",
    component: Sessions,
    meta: { requiresAuth: true },
  },
  {
    path: "/analytics",
    name: "Analytics",
    component: Analytics,
    meta: { requiresAuth: true },
  },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
    meta: { requiresAuth: true },
  },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const waitForAuth = () =>
  new Promise((resolve) => {
    if (authReady.value) return resolve();
    const stop = watch(authReady, (ready) => {
      if (ready) {
        stop();
        resolve();
      }
    });
  });

router.beforeEach(async (to) => {
  await waitForAuth();
  const currentUser = user.value;

  if (to.meta.requiresAuth && !currentUser) {
    return { name: "Login" };
  }

  if (to.meta.guestOnly && currentUser) {
    return { name: "Profile" };
  }
});
export default router;
