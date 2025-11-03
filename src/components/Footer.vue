<script setup>
import pkg from "../../package.json" with { type: "json" };
import { usePageLoadTime } from '../helpers';

const startYear = 2025;
const currentYear = new Date().getFullYear();
const version = pkg.version;
const copyrightYear = startYear === currentYear ? `${currentYear}` : `${startYear} - ${currentYear}`;
const { loadTime } = usePageLoadTime();
</script>

<template>
  <footer class="flex justify-center items-center flex-wrap gap-2 select-none">
    <span class="text-sm">
      Created, designed, and fiddled by Kevin Mahrous. &copy;
      {{ copyrightYear }}. All rights reserved.
    </span>
    <Badge>{{ version }}</Badge>
    <Badge>{{ loadTime || 0 }} ms</Badge>
  </footer>
</template>
