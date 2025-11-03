import { ref, onMounted, computed, watch } from "vue";

export function usePageLoadTime() {
  const loadTime = ref(null);

  function markLoaded() {
    const [navigation] = performance.getEntriesByType("navigation");
    if (navigation) {
      if (navigation.loadEventEnd > 0) {
        loadTime.value = (
          navigation.loadEventEnd - navigation.startTime
        ).toFixed(2);
      } else {
        loadTime.value = performance.now().toFixed(2);
      }
    } else {
      loadTime.value = performance.now().toFixed(2);
    }
  }

  onMounted(() => {
    if (document.readyState === "complete") {
      markLoaded();
    } else {
      window.addEventListener("load", markLoaded);
    }
  });

  return { loadTime, markLoaded };
}

export function useDarkMode() {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  const mode = ref(localStorage.getItem("darkMode") || "system");

  const isDark = computed(
    () =>
      mode.value === "dark" || (mode.value === "system" && prefersDark.matches)
  );

  const setMode = (newMode) => {
    mode.value = newMode;
    localStorage.setItem("darkMode", newMode);
  };

  watch(
    isDark,
    (val) => document.documentElement.classList.toggle("dark", val),
    { immediate: true }
  );

  onMounted(() =>
    prefersDark.addEventListener(
      "change",
      () => mode.value === "system" && setMode(mode.value)
    )
  );

  return { mode, setMode };
}

export function age(date) {
  const created = new Date(date);
  const now = new Date();

  const diffMs = now - created;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "today";
  if (diffDays === 1) return "1 day";
  if (diffDays < 30) return `${diffDays} days`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "1 month";
  if (diffMonths < 12) return `${diffMonths} months`;

  const diffYears = Math.floor(diffMonths / 12);
  if (diffYears === 1) return "1 year";
  return `${diffYears} years`;
}

export function formatDate(timestamp) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
      ? "nd"
      : day % 10 === 3 && day !== 13
      ? "rd"
      : "th";
  return `${day}${suffix} ${d.toLocaleString("en-UK", {
    month: "long",
  })} ${d.getFullYear()}`;
}
