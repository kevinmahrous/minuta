<template>
  <div class="flex min-h-screen select-none">
    <div class="flex-1 flex flex-col items-center justify-center space-y-4">
      <Select
        v-model="mode"
        :options="modes"
        optionLabel="label"
        optionValue="value"
        placeholder="Mode"
        :disabled="running"
      />
      <div class="text-6xl font-bold">{{ formattedTime }}</div>
      <div class="flex space-x-4">
        <Button @click="startTimer" :disabled="running">
          <PlayCircleIcon class="w-8 h-8" />
        </Button>
        <Button @click="pauseTimer" :disabled="!running">
          <PauseCircleIcon class="w-8 h-8" />
        </Button>
        <Button @click="resetTimer">
          <XCircleIcon class="w-8 h-8" />
        </Button>
      </div>
      <div
        class="flex md:flex-row flex-col justify-center space-y-4 space-x-0 md:space-y-0 md:space-x-16 w-full"
      >
        <div class="flex flex-col space-y-4 md:w-[28%]">
          <div v-if="mode === 'pomodoro'" class="flex flex-col gap-2">
            <span>Session duration:</span>
            <InputNumber
              v-model="pomodoroTime"
              :min="1"
              :max="120"
              aria-label="pomodoroTime"
              name="pomodoroTime"
              autocomplete
              fluid
            />
            <Message size="small" severity="secondary" variant="simple"
              >The duration of your session. (Maximum: 120 minutes.)</Message
            >
          </div>
          <div class="flex flex-col gap-2">
            <span>Session Title</span>
            <InputText
              v-model="sessionTitle"
              aria-label="sessionTitle"
              name="sessionTitle"
              autocomplete
              fluid
            />
            <Message size="small" severity="secondary" variant="simple"
              >Summarize what's on your mind.
            </Message>
          </div>
          <div class="flex flex-col gap-2">
            <span>Session Description</span>
            <Textarea
              v-model="sessionDescription"
              rows="2"
              aria-label="sessionDescription"
              name="sessionDescription"
              autocomplete
              fluid
            />
            <Message size="small" severity="secondary" variant="simple"
              >Explain what's on your mind.
            </Message>
          </div>
          <div class="flex flex-col gap-2">
            <span>Session Tags</span>
            <MultiSelect
              v-model="selectedTags"
              :options="globalTags"
              optionLabel="name"
              optionValue="id"
              display="chip"
              filter
              aria-label="selectedTags"
              name="selectedTags"
            />
            <Message size="small" severity="secondary" variant="simple"
              >Choose the tag(s) related to your session.
            </Message>
          </div>
          <Button @click="showTagModal = true"
            ><PlusCircleIcon class="w-5 h-5" />Add Tag</Button
          >
          <Button @click="saveSession" :disabled="intervals.length === 0"
            ><FlagIcon class="w-5 h-5" />Finish Session</Button
          >
        </div>
      </div>
      <Dialog
        v-model:visible="showTagModal"
        header="New Tag"
        :modal="true"
        :closable="true"
        class="select-none"
      >
        <div class="flex flex-col space-y-2">
          <div class="flex flex-col gap-2">
            <span>Tag Name</span>
            <InputText
              v-model="newTagName"
              aria-label="newTagName"
              name="newTagName"
              autocomplete
            />
            <Message size="small" severity="secondary" variant="simple"
              >Label your sessions.
            </Message>
          </div>
          <div class="flex flex-col gap-2">
            <span>Color</span>
            <ColorPicker v-model="newTagColor" name="newTagColor" inline />
            <Message size="small" severity="secondary" variant="simple"
              >Choose a color.
            </Message>
          </div>
          <Button @click="createTag"
            ><PlusCircleIcon class="w-5 h-5" />Create</Button
          >
        </div>
      </Dialog>
    </div>
  </div>
  <Dialog
    v-model:visible="showLeaveDialog"
    header="Active Timer"
    :modal="true"
    :closable="true"
    class="select-none"
  >
    <div class="flex flex-col space-y-4">
      <p>You have an active session running. Leaving won't save it.</p>
      <div class="flex justify-end space-x-4">
        <Button
          label="Leave"
          severity="danger"
          @click="
            () => {
              pauseTimer();
              showLeaveDialog = false;
              leaveNext();
            }
          "
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import {
  PlayCircleIcon,
  PauseCircleIcon,
  XCircleIcon,
  FlagIcon,
  PlusCircleIcon,
} from "@heroicons/vue/24/solid";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db, user } from "../firebase";

const mode = ref("pomodoro");
const modes = [
  { label: "Pomodoro", value: "pomodoro" },
  { label: "Stopwatch", value: "stopwatch" },
];

onBeforeRouteLeave((to, from, next) => {
  if (intervals.value.length) {
    showLeaveDialog.value = true;
    leaveNext = next;
  } else {
    next();
  }
});

function playSound(name) {
  const audio = new Audio(
    new URL(`../assets/sounds/${name}.mp3`, import.meta.url)
  );
  audio.volume = 1;
  audio.play().catch(console.error);
}

const pomodoroTime = ref(25);
const running = ref(false);
const remainingTime = ref(pomodoroTime.value * 60);
const elapsedTime = ref(0);
const timer = ref(null);
const intervals = ref([]);

const sessionTitle = ref("");
const sessionDescription = ref("");
const selectedTags = ref([]);
const globalTags = ref([]);
const showTagModal = ref(false);
const newTagName = ref("");
const newTagColor = ref("#000000");
const showLeaveDialog = ref(false);
let leaveNext = null;

const formattedTime = computed(() => {
  const time =
    mode.value === "pomodoro" ? remainingTime.value : elapsedTime.value;
  const h = Math.floor(time / 3600);
  const m = Math.floor((time % 3600) / 60);
  const s = time % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
});

function totalElapsed() {
  return intervals.value.reduce((acc, i) => {
    if (i.end) acc += Math.floor((i.end - i.start) / 1000);
    return acc;
  }, 0);
}

function startTimer() {
  if (running.value) return;
  running.value = true;
  playSound("start");
  const start = Date.now();
  intervals.value.push({ start });
  timer.value = setInterval(() => {
    const delta = Math.floor((Date.now() - start) / 1000);
    if (mode.value === "pomodoro") {
      remainingTime.value = Math.max(
        pomodoroTime.value * 60 - delta - totalElapsed(),
        0
      );
      if (remainingTime.value <= 0) {
        pauseTimer();
        playSound("save");
      }
    } else {
      elapsedTime.value = totalElapsed() + delta;
    }
  }, 1000);
}

function pauseTimer() {
  if (!running.value) return;
  running.value = false;
  clearInterval(timer.value);
  playSound("pause");
  const last = intervals.value[intervals.value.length - 1];
  if (last && !last.end) last.end = Date.now();
}

function resetTimer() {
  pauseTimer();
  playSound("reset");
  remainingTime.value = pomodoroTime.value * 60;
  elapsedTime.value = 0;
  intervals.value = [];
  selectedTags.value = [];
  sessionTitle.value = "";
  sessionDescription.value = "";
}

const tagsCollection = collection(db, "tags");
const sessionsCollection = collection(db, "sessions");

async function fetchTags() {
  const cached = localStorage.getItem("cachedTags");

  if (cached) {
    try {
      globalTags.value = JSON.parse(cached);
      return;
    } catch (e) {
      console.error("Failed to parse cached tags:", e);
    }
  }

  const snapshot = await getDocs(tagsCollection);
  globalTags.value = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  localStorage.setItem("cachedTags", JSON.stringify(globalTags.value));
}

async function createTag() {
  if (!newTagName.value.trim()) return;
  const newTag = {
    name: newTagName.value,
    color: newTagColor.value,
    user: user.value.uid,
  };

  const docRef = await addDoc(tagsCollection, newTag);
  const createdTag = { id: docRef.id, ...newTag };
  globalTags.value.push(createdTag);

  localStorage.setItem("cachedTags", JSON.stringify(globalTags.value));

  newTagName.value = "";
  newTagColor.value = "#000000";
  showTagModal.value = false;
}

const breakCount = computed(() => {
  return Math.max(intervals.value.filter((i) => i.end).length - 1, 0);
});

async function saveSession() {
  pauseTimer();
  playSound("save");
  const session = {
    startTime: intervals.value[0].start,
    mode: mode.value,
    intervals: intervals.value.map((i) => ({
      start: i.start,
      end: i.end ?? Date.now(),
    })),
    breaks: breakCount.value,
    user: user.value.uid,
  };
  if (mode.value === "pomodoro") {
    session.intendedTime = pomodoroTime.value * 60;
  }
  if (sessionTitle.value.trim()) session.title = sessionTitle.value.trim();
  if (sessionDescription.value.trim())
    session.description = sessionDescription.value.trim();
  if (selectedTags.value.length > 0) {
    session.tags = selectedTags.value;
  }
  await addDoc(sessionsCollection, session);
  resetTimer();
}

watch(mode, () => resetTimer());
watch(pomodoroTime, () => (remainingTime.value = pomodoroTime.value * 60));

onMounted(async () => {
  await fetchTags();
  const saved = localStorage.getItem("pendingSession");
  if (saved) {
    await addDoc(sessionsCollection, JSON.parse(saved));
    localStorage.removeItem("pendingSession");
  }
});

onMounted(() => {
  const saveBeforeUnload = () => {
    if (!intervals.value.length) return;
    pauseTimer();
    const session = {
      mode: mode.value,
      intervals: intervals.value,
      user: user.value.uid,
    };
    if (sessionTitle.value.trim()) session.title = sessionTitle.value.trim();
    if (sessionDescription.value.trim())
      session.description = sessionDescription.value.trim();
    if (selectedTags.value.length > 0) {
      session.tags = selectedTags.value;
    }
    localStorage.setItem("pendingSession", JSON.stringify(session));
  };
  window.addEventListener("beforeunload", saveBeforeUnload);
  onUnmounted(() => {
    window.removeEventListener("beforeunload", saveBeforeUnload);
  });
});
</script>
