<template>
  <div class="flex min-h-screen select-none" v-if="!selectedSession">
    <div class="flex flex-col items-start justify-start space-y-4 w-full">
      <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-3/4">
        <Select
          v-model="searchQuery"
          :options="modeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Mode"
          class="sm:w-1/3 w-full"
        />
        <MultiSelect
          v-model="selectedTags"
          :options="tags"
          optionLabel="name"
          optionValue="id"
          placeholder="Tags"
          filter
          class="sm:w-1/3 w-full"
        />
        <DatePicker
          v-model="selectedDate"
          showIcon
          iconDisplay="input"
          placeholder="Date"
          fluid
        />
      </div>
      <DataView
        :value="filteredSessions"
        layout="list"
        :paginator="true"
        :rows="4"
        class="w-full space-y-4"
      >
        <template #list="slotProps">
          <div
            class="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4"
          >
            <div
              v-for="session in slotProps.items"
              :key="session.id"
              class="p-4 border border-teal-400 rounded-lg flex flex-col items-center gap-4 transition transform hover:scale-[1.02]"
            >
              <div class="flex justify-center items-center space-x-2">
                <h2>
                  <strong>{{ session.title || "Untitled Session" }}</strong>
                </h2>
                <Tag severity="info">
                  {{ capitalize(session.mode) }}
                </Tag>
              </div>
              <div
                class="flex flex-col items-center gap-2 p-3 rounded-lg border border-teal-300 dark:border-teal-700"
              >
                <div class="flex flex-col gap-2 w-full max-w-xs">
                  <div class="flex items-center justify-between">
                    <span class="font-medium w-24 text-left">Session</span>
                    <Tag class="w-20 text-center">{{
                      getTotalSessionDuration(session)
                    }}</Tag>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="font-medium w-24 text-left">Focus</span>
                    <Tag class="w-20 text-center">{{
                      getTotalFocusTime(session)
                    }}</Tag>
                  </div>
                  <div
                    v-if="session.mode === 'pomodoro'"
                    class="flex items-center justify-between"
                  >
                    <span class="font-medium w-24 text-left">Intended</span>
                    <Tag class="w-20 text-center">{{
                      formatDuration(session.intendedTime * 1000)
                    }}</Tag>
                  </div>
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                <Tag v-for="tag in getSessionTags(session)" :key="tag.id">
                  <span
                    class="w-3 h-3 rounded-full"
                    :style="{ backgroundColor: `#${tag.color}` }"
                  ></span>
                  {{ tag.name }}
                </Tag>
                <Tag v-if="getSessionTags(session).length === 0">None</Tag>
              </div>
              <Button variant="outlined" @click="selectedSession = session"
                ><EllipsisVerticalIcon class="w-5 h-5" />More</Button
              >
            </div>
          </div>
        </template>
      </DataView>
      <div class="w-full flex justify-center">
        <Button v-if="lastDoc" @click="loadMore" variant="outlined">
          Load More
        </Button>
      </div>
    </div>
  </div>
  <div v-else class="flex min-h-screen select-none">
    <div class="flex flex-col items-start justify-start space-y-4 w-full">
      <Button @click="selectedSession = null"
        ><ArrowUturnLeftIcon class="w-5 h-5" />Back</Button
      >
      <div
        class="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 justify-center"
      >
        <h1>
          <strong>{{ selectedSession.title || "Untitled Session" }}</strong>
        </h1>
        <Tag severity="info">
          {{ capitalize(selectedSession.mode) }}
        </Tag>
        <Tag v-tooltip="metrics.sessionQuality" severity="info">
          {{ getSessionQualityIndex(selectedSession).label }}
          {{ getSessionQualityIndex(selectedSession).score }}/100
        </Tag>
      </div>
      <p>{{ selectedSession.description || "No description was written." }}</p>
      <div class="flex h-6 rounded-lg overflow-hidden w-full">
        <template
          v-for="(segment, idx) in getTimelineSegments(selectedSession)"
          :key="idx"
        >
          <div
            :class="[
              'cursor-pointer',
              segment.type === 'interval' ? 'bg-blue-500' : 'bg-orange-500',
            ]"
            :style="{ flex: segment.duration }"
            @click="showPopover($event, segment)"
          ></div>
        </template>
      </div>
      <div
        class="flex flex-col space-y-2 sm:flex-row sm:space-x-5 sm:space-y-0"
      >
        <div class="flex flex-col gap-2 w-full max-w-xs">
          <div class="flex items-center justify-between">
            <span
              v-tooltip="metrics.totalSession"
              class="font-medium w-42 text-left"
              >Total Session</span
            >
            <Tag class="w-20 text-center">{{
              getTotalSessionDuration(selectedSession)
            }}</Tag>
          </div>
          <div class="flex items-center justify-between">
            <span
              v-tooltip="metrics.totalFocus"
              class="font-medium w-42 text-left"
              >Total Focus</span
            >
            <Tag class="w-20 text-center">{{
              getTotalFocusTime(selectedSession)
            }}</Tag>
          </div>
          <div
            v-if="selectedSession.mode === 'pomodoro'"
            class="flex items-center justify-between"
          >
            <span class="font-medium w-42 text-left">Intended Duration</span>
            <Tag class="w-20 text-center">{{
              formatDuration(selectedSession.intendedTime * 1000)
            }}</Tag>
          </div>
          <div class="flex items-center justify-between">
            <span
              v-tooltip="metrics.longestInterval"
              class="font-medium w-42 text-left"
              >Longest Interval</span
            >
            <Tag class="w-20 text-center">{{
              getLongestInterval(selectedSession)
            }}</Tag>
          </div>
          <div class="flex items-center justify-between">
            <span
              v-tooltip="metrics.shortestInterval"
              class="font-medium w-42 text-left"
              >Shortest Interval</span
            >
            <Tag class="w-20 text-center">{{
              getShortestInterval(selectedSession)
            }}</Tag>
          </div>
          <div class="flex items-center justify-between">
            <span
              v-tooltip="metrics.longestBreak"
              class="font-medium w-42 text-left"
              >Longest Break</span
            >
            <Tag class="w-20 text-center">{{
              getLongestBreak(selectedSession)
            }}</Tag>
          </div>
          <div class="flex items-center justify-between">
            <span
              v-tooltip="metrics.shortestBreak"
              class="font-medium w-42 text-left"
              >Shortest Break</span
            >
            <Tag class="w-20 text-center">{{
              getShortestBreak(selectedSession)
            }}</Tag>
          </div>
          <div
            v-if="selectedSession.mode === 'pomodoro'"
            class="flex items-center justify-between"
          >
            <span
              v-tooltip="metrics.pomodoroGoalCompletion"
              class="font-medium w-42 text-left"
              >Goal Completion</span
            >
            <Tag class="w-20 text-center"
              >{{ getPomodoroGoalCompletion(selectedSession) }}%</Tag
            >
          </div>
        </div>
        <div class="flex flex-col gap-2 w-full max-w-xs">
          <div
            v-if="selectedSession.mode === 'pomodoro'"
            class="flex items-center justify-between"
          >
            <span
              v-tooltip="metrics.actualVsIntended"
              class="font-medium w-42 text-left"
              >Actual vs Intended</span
            >
            <Tag class="w-20 text-center">{{
              getPomodoroActualVsIntended(selectedSession)
            }}</Tag>
          </div>
          <div class="flex items-center justify-between">
            <span
              v-tooltip="metrics.breakCount"
              class="font-medium w-42 text-left"
              >Number of Breaks</span
            >
            <Tag class="w-20 text-center">{{
              getBreakCount(selectedSession)
            }}</Tag>
          </div>
          <div class="flex items-center justify-between">
            <span
              v-tooltip="metrics.breakFocusRatio"
              class="font-medium w-42 text-left"
              >Break/Focus Ratio</span
            >
            <Tag class="w-20 text-center">{{
              getBreakFocusRatio(selectedSession)
            }}</Tag>
          </div>
          <div class="flex items-center justify-between">
            <span
              v-tooltip="metrics.averageInterval"
              class="font-medium w-42 text-left"
              >Average Interval</span
            >
            <Tag class="w-20 text-center">{{
              getAverageIntervalLength(selectedSession)
            }}</Tag>
          </div>
          <div class="flex items-center justify-between">
            <span
              v-tooltip="metrics.averageBreak"
              class="font-medium w-42 text-left"
              >Average Break</span
            >
            <Tag class="w-20 text-center">{{
              getAverageBreakLength(selectedSession)
            }}</Tag>
          </div>
          <div class="flex items-center justify-between">
            <span
              v-tooltip="metrics.breakRecoveryRatio"
              class="font-medium w-42 text-left"
              >Break Recovery Ratio</span
            >
            <Tag class="w-20 text-center">{{
              getBreakRecoveryRatio(selectedSession)
            }}</Tag>
          </div>
          <div class="flex items-center justify-between">
            <span
              v-tooltip="metrics.focusConsistency"
              class="font-medium w-42 text-left"
              >Focus Consistency</span
            >
            <Tag class="w-20 text-center">{{
              getFocusConsistencyIndex(selectedSession)
            }}</Tag>
          </div>
          <div class="flex items-center justify-between">
            <span
              v-tooltip="metrics.focusEfficiency"
              class="font-medium w-42 text-left"
              >Focus Efficiency</span
            >
            <Tag class="w-20 text-center">{{
              getFocusEfficiency(selectedSession)
            }}</Tag>
          </div>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <Tag v-for="tag in getSessionTags(selectedSession)" :key="tag.id">
          <span
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: `#${tag.color}` }"
          ></span>
          {{ tag.name }}
        </Tag>
        <Tag v-if="getSessionTags(selectedSession).length === 0">None</Tag>
      </div>
    </div>
  </div>
  <Popover ref="popoverRef" class="select-none">
    <Tag severity="info" class="flex items-center justify-center">
      <InformationCircleIcon class="w-5 h-5" />
      {{ popoverType }}</Tag
    >
    <Divider />
    <div class="flex items-center space-x-2">
      <Tag severity="info" class="flex items-center justify-center">
        <ArrowRightStartOnRectangleIcon class="w-5 h-5" />
        {{ popoverStart }}
      </Tag>
      <Tag severity="info" class="flex items-center justify-center">
        <ArrowLeftStartOnRectangleIcon class="w-5 h-5" />
        {{ popoverEnd }}
      </Tag>
      <Tag severity="info" class="flex items-center justify-center">
        <ClockIcon class="w-5 h-5" />
        {{ popoverDuration }}
      </Tag>
    </div>
  </Popover>
</template>

<script setup>
import { ref, computed, onMounted, capitalize } from "vue";
import { db, user } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  orderBy,
  startAfter,
} from "firebase/firestore";
import {
  InformationCircleIcon,
  ArrowRightStartOnRectangleIcon,
  ArrowLeftStartOnRectangleIcon,
  ClockIcon,
  ArrowUturnLeftIcon,
  EllipsisVerticalIcon,
} from "@heroicons/vue/24/outline";

const sessions = ref([]);
const tags = ref([]);
const searchQuery = ref("");
const selectedDate = ref(null);
const selectedSession = ref(null);
const selectedTags = ref([]);
const popoverRef = ref(null);
const popoverType = ref("");
const popoverStart = ref("");
const popoverEnd = ref("");
const popoverDuration = ref("");

const formatDuration = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

const showPopover = (event, segment) => {
  popoverType.value = segment.label;
  popoverStart.value = formatTime(segment.start);
  popoverEnd.value = formatTime(segment.end);
  popoverDuration.value = formatDuration(segment.rawDuration);
  if (popoverRef.value) {
    popoverRef.value.toggle(event);
  }
};

const getTimelineSegments = (session) => {
  const intervals =
    session?.intervals?.map((i) => ({
      start: new Date(i.start).getTime(),
      end: new Date(i.end).getTime(),
    })) || [];

  if (intervals.length === 0) return [];

  const segments = intervals.flatMap((interval, i) => {
    const current = {
      type: "interval",
      start: interval.start,
      end: interval.end,
      rawDuration: interval.end - interval.start,
      label: `Interval ${i + 1}`,
    };

    const next = intervals[i + 1];
    return next
      ? [
          current,
          {
            type: "break",
            start: interval.end,
            end: next.start,
            rawDuration: next.start - interval.end,
            label: `Break ${i + 1}`,
          },
        ]
      : [current];
  });

  const total = segments.reduce((sum, s) => sum + s.rawDuration, 0);
  return segments.map((s) => ({
    ...s,
    duration: s.rawDuration / total,
  }));
};

const formatTime = (ts) => (ts ? new Date(ts).toLocaleTimeString() : "-");

let lastDoc = null;
const fetchedIds = new Set();

const fetchSessions = async (uid) => {
  let q = query(
    collection(db, "sessions"),
    where("user", "==", uid),
    orderBy("__name__"),
    limit(4)
  );

  if (lastDoc) q = query(q, startAfter(lastDoc));

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    lastDoc = null;
    return;
  }

  const newSessions = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((s) => !fetchedIds.has(s.id));

  newSessions.forEach((s) => fetchedIds.add(s.id));

  sessions.value.push(...newSessions);

  lastDoc = snapshot.docs[snapshot.docs.length - 1];

  if (snapshot.docs.length < 4) lastDoc = null;
};

const modeOptions = [
  { label: "All", value: "" },
  { label: "Pomodoro", value: "pomodoro" },
  { label: "Stopwatch", value: "stopwatch" },
];

const filteredSessions = computed(() => {
  return sessions.value.filter((s) => {
    const matchesMode = s.mode
      ?.toLowerCase()
      .includes(searchQuery.value.toLowerCase());

    const matchesTag =
      selectedTags.value.length === 0 ||
      (Array.isArray(s.tags) &&
        selectedTags.value.every((tagId) => s.tags.includes(tagId)));

    const matchesDate =
      !selectedDate.value ||
      s.intervals?.some((i) => {
        const date = new Date(i.start);
        return (
          date.toDateString() === new Date(selectedDate.value).toDateString()
        );
      });

    return matchesMode && matchesTag && matchesDate;
  });
});

const getSessionTags = (session) => {
  if (!session?.tags || !Array.isArray(session.tags)) return [];
  return tags.value.filter((t) => session.tags.includes(t.id));
};

const getTotalFocusTime = (session) => {
  if (!session?.intervals?.length) return "00:00:00";

  const totalFocus = session.intervals.reduce((sum, i) => {
    const start = new Date(i.start).getTime();
    const end = new Date(i.end).getTime();
    return sum + (end - start);
  }, 0);

  return formatDuration(totalFocus);
};

const getTotalSessionDuration = (session) => {
  if (!session?.intervals?.length) return "00:00:00";

  const intervals = session.intervals.map((i) => ({
    start: new Date(i.start).getTime(),
    end: new Date(i.end).getTime(),
  }));

  const firstStart = Math.min(...intervals.map((i) => i.start));
  const lastEnd = Math.max(...intervals.map((i) => i.end));

  const totalSession = lastEnd - firstStart;
  return formatDuration(totalSession);
};

const metrics = {
  totalSession:
    "Time from the start of the first interval to the end of the last interval.",
  totalFocus: "Sum of all focused intervals' durations.",
  longestInterval: "Duration of your single longest focus interval.",
  shortestInterval: "Duration of your single shortest focus interval.",
  longestBreak: "Duration of the longest gap between focus intervals.",
  shortestBreak: "Duration of the shortest gap between focus intervals.",
  breakCount: "Total number of breaks taken during the session.",
  breakFocusRatio: "Total break time divided by total focus time (percentage).",
  averageInterval: "Mean duration of all focus intervals.",
  averageBreak: "Mean duration of all breaks.",
  breakRecoveryRatio:
    "Average of each next focus interval divided by preceding break duration (percentage).",
  focusConsistency:
    "Shortest interval divided by longest interval (percentage) to show uniformity of focus.",
  focusEfficiency:
    "Total focus time divided by total session time (percentage).",
  pomodoroGoalCompletion:
    "For Pomodoro sessions, total focus time divided by intended time (percentage).",
  actualVsIntended:
    "Total focus time compared to intended Pomodoro time, expressed as a percentage.",
  sessionQuality:
    "Weighted combination of consistency, efficiency, and goal completion.",
};

const getIntervals = (session) => {
  if (!session?.intervals?.length) return [];
  return session.intervals.map((i) => ({
    start: new Date(i.start).getTime(),
    end: new Date(i.end).getTime(),
    duration: new Date(i.end).getTime() - new Date(i.start).getTime(),
  }));
};

const getBreaks = (session) => {
  const intervals = getIntervals(session);
  if (intervals.length < 2) return [];
  const breaks = [];
  for (let i = 0; i < intervals.length - 1; i++) {
    breaks.push({
      start: intervals[i].end,
      end: intervals[i + 1].start,
      duration: intervals[i + 1].start - intervals[i].end,
    });
  }
  return breaks.filter((b) => b.duration > 0);
};

const getLongestInterval = (session) => {
  const intervals = getIntervals(session);
  if (!intervals.length) return "00:00:00";
  const max = Math.max(...intervals.map((i) => i.duration));
  return formatDuration(max);
};

const getShortestInterval = (session) => {
  const intervals = getIntervals(session);
  if (!intervals.length) return "00:00:00";
  const min = Math.min(...intervals.map((i) => i.duration));
  return formatDuration(min);
};

const getLongestBreak = (session) => {
  const breaks = getBreaks(session);
  if (!breaks.length) return "00:00:00";
  const max = Math.max(...breaks.map((b) => b.duration));
  return formatDuration(max);
};

const getShortestBreak = (session) => {
  const breaks = getBreaks(session);
  if (!breaks.length) return "00:00:00";
  const min = Math.min(...breaks.map((b) => b.duration));
  return formatDuration(min);
};

const getBreakCount = (session) => {
  return getBreaks(session).length;
};

const getBreakFocusRatio = (session) => {
  const breaks = getBreaks(session);
  const intervals = getIntervals(session);
  const totalBreak = breaks.reduce((sum, b) => sum + b.duration, 0);
  const totalFocus = intervals.reduce((sum, i) => sum + i.duration, 0);
  if (totalFocus === 0) return "0%";
  const ratio = (totalBreak / totalFocus) * 100;
  return ratio.toFixed(1) + "%";
};

const getPomodoroGoalCompletion = (session) => {
  if (!session.intendedTime || !session.intervals?.length) return 0;
  const focusMs = session.intervals.reduce(
    (sum, i) => sum + (new Date(i.end) - new Date(i.start)),
    0
  );
  const goalMs = session.intendedTime * 1000;
  return Math.min(((focusMs / goalMs) * 100).toFixed(1), 100);
};

const getPomodoroActualVsIntended = (session) => {
  if (!session.intendedTime || !session.intervals?.length) return 0;

  const focusMs = session.intervals.reduce(
    (sum, i) => sum + (new Date(i.end) - new Date(i.start)),
    0
  );

  return Math.round((focusMs / (session.intendedTime * 1000)) * 100);
};

const getAverageIntervalLength = (session) => {
  const intervals = getIntervals(session);
  if (!intervals.length) return "00:00:00";

  const avg =
    intervals.reduce((sum, i) => sum + i.duration, 0) / intervals.length;
  return formatDuration(avg);
};

const getAverageBreakLength = (session) => {
  const breaks = getBreaks(session);
  if (!breaks.length) return "00:00:00";

  const avg = breaks.reduce((sum, b) => sum + b.duration, 0) / breaks.length;
  return formatDuration(avg);
};

const getBreakRecoveryRatio = (session) => {
  const intervals = getIntervals(session);
  const breaks = getBreaks(session);

  if (!breaks.length || intervals.length < 2) return "0%";

  let ratios = breaks.map((b, idx) => {
    const nextFocus = intervals[idx + 1].duration;
    return nextFocus / b.duration;
  });

  const avgRatio = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
  return (avgRatio * 100).toFixed(1) + "%";
};

const getFocusConsistencyIndex = (session) => {
  const intervals = getIntervals(session);
  if (!intervals.length) return "0%";

  const durations = intervals.map((i) => i.duration);
  const min = Math.min(...durations);
  const max = Math.max(...durations);

  if (max === 0) return "0%";
  const index = (min / max) * 100;
  return index.toFixed(1) + "%";
};

const getFocusEfficiency = (session) => {
  const totalFocus = getIntervals(session).reduce(
    (sum, i) => sum + i.duration,
    0
  );
  const totalSession = getTotalSessionDurationMs(session);
  if (totalSession === 0) return "0%";
  const efficiency = (totalFocus / totalSession) * 100;
  return efficiency.toFixed(1) + "%";
};

const getTotalSessionDurationMs = (session) => {
  if (!session?.intervals?.length) return 0;
  const firstStart = Math.min(
    ...session.intervals.map((i) => new Date(i.start).getTime())
  );
  const lastEnd = Math.max(
    ...session.intervals.map((i) => new Date(i.end).getTime())
  );
  return lastEnd - firstStart;
};
const getSessionQualityIndex = (session) => {
  if (!session) return { score: 0, label: "N/A" };

  const consistency = parseFloat(getFocusConsistencyIndex(session)) || 0;
  const efficiency = parseFloat(getFocusEfficiency(session)) || 0;
  const goalCompletion =
    session.mode === "pomodoro"
      ? parseFloat(getPomodoroGoalCompletion(session))
      : 100;
  const wConsistency = 0.3;
  const wEfficiency = 0.4;
  const wGoal = 0.3;

  let score =
    consistency * wConsistency +
    efficiency * wEfficiency +
    goalCompletion * wGoal;

  const sessionMs = getTotalSessionDurationMs(session);
  const minSessionMs = 5 * 60 * 1000;
  const lengthFactor = Math.min(sessionMs / minSessionMs, 1);
  score = score * lengthFactor;

  let label;
  if (score >= 85) label = "Excellent";
  else if (score >= 70) label = "Good";
  else if (score >= 50) label = "Average";
  else label = "Poor";

  return { score: parseFloat(score.toFixed(1)), label };
};

const loadMore = async () => {
  const uid = user.value.uid;
  await fetchSessions(uid);
};

onMounted(async () => {
  const uid = user.value.uid;
  await fetchSessions(uid);
});
onMounted(() => {
  const cached = localStorage.getItem("cachedTags");
  if (cached) {
    try {
      tags.value = JSON.parse(cached);
    } catch (e) {
      console.error("Failed to parse cached tags:", e);
      tags.value = [];
    }
  } else {
    fetchTagsFromFirestore();
  }
});

async function fetchTagsFromFirestore() {
  const snapshot = await getDocs(collection(db, "tags"));
  tags.value = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  localStorage.setItem("cachedTags", JSON.stringify(tags.value));
}
</script>
