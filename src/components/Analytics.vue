<template>
  <div class="flex min-h-screen select-none">
    <div class="flex flex-col items-start justify-start space-y-4 w-full">
      <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-3/4">
        <Select
          v-model="rangeType"
          :options="rangeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Range"
          class="sm:w-1/3 w-full"
        />
        <DatePicker
          v-model="selectedDate"
          showIcon
          iconDisplay="input"
          placeholder="Date"
          fluid
          class="sm:w-1/3 w-full"
          @change="onDateChange"
        />
      </div>
      <div
        class="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0"
      >
        <div
          class="p-4 border border-teal-500 rounded-lg flex flex-col items-center justify-center"
        >
          <h3
            class="font-bold flex flex-row justify-center items-center space-x-1"
          >
            <ClockIcon class="w-5 h-5" /><span>Total Focus</span>
          </h3>
          <p class="text-xl font-bold">{{ formatDuration(totalFocus) }}</p>
        </div>
        <div
          class="p-4 border border-teal-500 rounded-lg flex flex-col items-center justify-center"
        >
          <h3
            class="font-bold flex flex-row justify-center items-center space-x-1"
          >
            <CalendarDateRangeIcon class="w-5 h-5" /><span>Total Sessions</span>
          </h3>
          <p class="text-xl font-bold">{{ totalSessions }}</p>
        </div>
        <div
          class="p-4 border border-teal-500 rounded-lg flex flex-col items-center justify-center"
        >
          <h3
            class="font-bold flex flex-row justify-center items-center space-x-1"
          >
            <StarIcon class="w-5 h-5" /><span>Average Quality</span>
          </h3>
          <p class="text-xl font-bold">{{ averageQuality.toFixed(1) }}/100</p>
        </div>
        <div
          class="p-4 border border-teal-500 rounded-lg flex flex-col items-center justify-center"
        >
          <h3
            class="font-bold flex flex-row justify-center items-center space-x-1"
          >
            <FireIcon class="w-5 h-5" /><span>Streak</span>
          </h3>
          <p class="text-xl font-bold">{{ streak }} days</p>
        </div>
      </div>
      <div
        v-if="rangeType === 'day'"
        class="w-full relative h-6 rounded-lg bg-teal-200"
      >
        <template v-for="(segment, idx) in timelineSegments" :key="idx">
          <div
            class="cursor-pointer absolute top-0 h-full bg-blue-500 rounded"
            :style="{
              left: segment.startOffset * 100 + '%',
              width: segment.durationFraction * 100 + '%',
            }"
            v-tooltip="
              `${segment.label}: ${formatDuration(segment.rawDuration)}`
            "
          ></div>
        </template>
      </div>
      <div v-else class="w-full sm:w-1/2 flex flex-col space-y-3">
        <h1 class="text-3xl font-bold">{{ rangeLabel }}</h1>
        <div
          class="flex flex-wrap space-x-1 space-y-1"
          :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }"
        >
          <div
            v-for="day in heatmapDays"
            :key="day.date"
            class="w-5 h-5 rounded-sm cursor-pointer border"
            :style="{
              backgroundColor:
                day.date &&
                selectedDate.value &&
                day.date.toDateString() === selectedDate.value.toDateString()
                  ? '#ff6b6b'
                  : getColorForFocus(day.totalFocus),
              border:
                day.date &&
                selectedDate.value &&
                day.date.toDateString() === selectedDate.value.toDateString()
                  ? '2px solid #ff6b6b'
                  : '1px solid #ccc',
            }"
            v-tooltip="
              `${day.date.getDate()}/${
                day.date.getMonth() + 1
              }/${day.date.getFullYear()}: ${
                day.sessions
              } sessions, ${formatDuration(day.totalFocus)}`
            "
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { db, user } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  ClockIcon,
  CalendarDateRangeIcon,
  StarIcon,
  FireIcon,
} from "@heroicons/vue/24/outline";
const sessions = ref([]);
const selectedDate = ref(new Date());
const rangeType = ref("day");
const rangeOptions = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
];

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

const getSessionQualityIndex = (session) => {
  if (!session) return { score: 0, label: "N/A" };

  const intervals = session.intervals || [];
  if (!intervals.length) return { score: 0, label: "N/A" };

  const durations = intervals.map((i) => i.end - i.start);
  const min = Math.min(...durations);
  const max = Math.max(...durations);
  const consistency = max === 0 ? 0 : (min / max) * 100;

  const totalFocus = durations.reduce((sum, d) => sum + d, 0);
  const totalSession =
    Math.max(...intervals.map((i) => i.end)) -
    Math.min(...intervals.map((i) => i.start));
  const efficiency = totalSession === 0 ? 0 : (totalFocus / totalSession) * 100;

  const goalCompletion =
    session.mode === "pomodoro"
      ? Math.min((totalFocus / (session.intendedTime * 1000)) * 100, 100)
      : 100;

  const sessionMs =
    Math.max(...intervals.map((i) => i.end)) -
    Math.min(...intervals.map((i) => i.start));
  const minSessionMs = 5 * 60 * 1000;
  const lengthFactor = Math.min(sessionMs / minSessionMs, 1);
  const score =
    (consistency * 0.3 + efficiency * 0.4 + goalCompletion * 0.3) *
    lengthFactor;
  let label;
  if (score >= 85) label = "Excellent";
  else if (score >= 70) label = "Good";
  else if (score >= 50) label = "Average";
  else label = "Poor";

  return { score: parseFloat(score.toFixed(1)), label };
};

const getRange = (rangeType, date) => {
  const start = new Date(date);
  const end = new Date(date);

  switch (rangeType) {
    case "day":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "week":
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
};

const fetchSessions = async (uid, rangeType, date) => {
  const { start, end } = getRange(rangeType, date);
  const sessionsRef = collection(db, "sessions");

  const q = query(
    sessionsRef,
    where("user", "==", uid),
    where("startTime", ">=", start.getTime()),
    where("startTime", "<=", end.getTime())
  );

  const snapshot = await getDocs(q);
  sessions.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const filteredSessions = computed(() => {
  return sessions.value.filter((s) => {
    if (!s.intervals?.length) return false;
    const firstStart = Math.min(...s.intervals.map((i) => i.start));
    const sessionDate = new Date(firstStart);
    const sel = new Date(selectedDate.value);

    switch (rangeType.value) {
      case "day":
        return sessionDate.toDateString() === sel.toDateString();
      case "week":
        const startOfWeek = new Date(sel);
        startOfWeek.setDate(sel.getDate() - sel.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
      case "month":
        return (
          sessionDate.getMonth() === sel.getMonth() &&
          sessionDate.getFullYear() === sel.getFullYear()
        );
      case "year":
        return sessionDate.getFullYear() === sel.getFullYear();
    }
  });
});

const totalFocus = computed(() => {
  return filteredSessions.value.reduce((sum, s) => {
    return sum + s.intervals.reduce((acc, i) => acc + (i.end - i.start), 0);
  }, 0);
});
const totalSessions = computed(() => filteredSessions.value.length);
const averageQuality = computed(() => {
  if (!filteredSessions.value.length) return 0;
  return (
    filteredSessions.value.reduce(
      (sum, s) => sum + getSessionQualityIndex(s).score,
      0
    ) / filteredSessions.value.length
  );
});

const streak = computed(() => {
  const daysWithSessions = sessions.value
    .map((s) =>
      new Date(Math.min(...s.intervals.map((i) => i.start))).toDateString()
    )
    .sort();
  let maxStreak = 0,
    currentStreak = 1;
  for (let i = 1; i < daysWithSessions.length; i++) {
    const prev = new Date(daysWithSessions[i - 1]);
    const curr = new Date(daysWithSessions[i]);
    if (curr - prev === 86400000) currentStreak++;
    else currentStreak = 1;
    if (currentStreak > maxStreak) maxStreak = currentStreak;
  }
  return maxStreak;
});

const heatmapDays = computed(() => {
  const days = [];
  const sel = new Date(selectedDate.value);
  let numDays = 0,
    year = sel.getFullYear(),
    month = sel.getMonth();
  switch (rangeType.value) {
    case "week":
      for (let i = 0; i < 7; i++) {
        const d = new Date(sel);
        d.setDate(sel.getDate() - sel.getDay() + i);
        const sessionsOnDay = sessions.value.filter((s) =>
          s.intervals?.some(
            (i) => new Date(i.start).toDateString() === d.toDateString()
          )
        );
        const totalFocus = sessionsOnDay.reduce(
          (sum, s) =>
            sum + s.intervals.reduce((a, i) => a + (i.end - i.start), 0),
          0
        );
        days.push({ date: d, sessions: sessionsOnDay.length, totalFocus });
      }
      break;
    case "month":
      numDays = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= numDays; i++) {
        const d = new Date(year, month, i);
        const sessionsOnDay = sessions.value.filter((s) =>
          s.intervals?.some(
            (i) => new Date(i.start).toDateString() === d.toDateString()
          )
        );
        const totalFocus = sessionsOnDay.reduce(
          (sum, s) =>
            sum + s.intervals.reduce((a, i) => a + (i.end - i.start), 0),
          0
        );
        days.push({ date: d, sessions: sessionsOnDay.length, totalFocus });
      }
      break;
    case "year":
      numDays = isLeapYear(year) ? 366 : 365;
      for (let i = 1; i <= numDays; i++) {
        const d = new Date(year, 0, i);
        const sessionsOnDay = sessions.value.filter((s) =>
          s.intervals?.some(
            (i) => new Date(i.start).toDateString() === d.toDateString()
          )
        );
        const totalFocus = sessionsOnDay.reduce(
          (sum, s) =>
            sum + s.intervals.reduce((a, i) => a + (i.end - i.start), 0),
          0
        );
        days.push({ date: d, sessions: sessionsOnDay.length, totalFocus });
      }
      break;
  }
  return days;
});

const columns = computed(() => {
  switch (rangeType.value) {
    case "week":
      return 7;
    case "month":
      return 7;
    case "year":
      return 52;
  }
  return 1;
});

const timelineSegments = computed(() => {
  if (rangeType.value !== "day") return [];
  const dayStart = new Date(selectedDate.value);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(selectedDate.value);
  dayEnd.setHours(23, 59, 59, 999);
  const dayDuration = dayEnd - dayStart;

  const allIntervals = filteredSessions.value.flatMap((s, sessionIndex) =>
    s.intervals.map((i) => ({
      start: Math.max(i.start, dayStart.getTime()),
      end: Math.min(i.end, dayEnd.getTime()),
      sessionIndex,
    }))
  );

  return allIntervals.map((i) => ({
    type: "interval",
    start: i.start,
    end: i.end,
    rawDuration: i.end - i.start,
    label: `Session ${i.sessionIndex + 1}`,
    startOffset: (i.start - dayStart) / dayDuration,
    durationFraction: (i.end - i.start) / dayDuration,
  }));
});

const isLeapYear = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

const getColorForFocus = (ms) => {
  if (ms === 0) return "#eee";
  if (ms < 30 * 60 * 1000) return "#a2d5f2";
  if (ms < 60 * 60 * 1000) return "#0077b6";
  return "#023e8a";
};

const onDateChange = (e) => {};

watch([rangeType, selectedDate], async () => {
  const uid = user.value.uid;
  await fetchSessions(uid, rangeType.value, selectedDate.value);
});

onMounted(async () => {
  const uid = user.value.uid;
  await fetchSessions(uid, rangeType.value, selectedDate.value);
});
</script>
