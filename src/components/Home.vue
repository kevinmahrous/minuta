<template>
  <section
    class="relative w-full min-h-screen flex flex-col items-center justify-center select-none"
  >
    <canvas ref="canvas" class="absolute inset-0 w-full h-full"></canvas>
    <div class="text-center space-y-2">
      <h1
        class="text-5xl font-extrabold bg-linear-to-r from-teal-300 to-teal-700 bg-clip-text text-transparent p-1"
      >
        Time, beautifully spent.
      </h1>
      <p class="text-lg p-1">
        Time is the rarest currency on Earth. Spend it wisely.
      </p>
      <div class="flex space-x-4 justify-center items-center">
        <router-link to="/login">
          <Button
            ><ArrowRightEndOnRectangleIcon class="w-6 h-6" />Get Started</Button
          >
        </router-link>
        <a href="https://github.com/kevinmahrous/minuta" target="_blank">
          <Button class="flex flex-row items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="w-6 h-6"
            >
              <path
                d="M12 2C6.48 2 2 6.6 2 12.3c0 4.5 2.87 8.3 6.84 9.64.5.1.68-.2.68-.5v-1.9c-2.78.6-3.37-1.4-3.37-1.4-.46-1.2-1.14-1.5-1.14-1.5-.93-.6.07-.6.07-.6 1.03.1 1.57 1.1 1.57 1.1.91 1.6 2.38 1.1 2.96.8.09-.7.36-1.1.64-1.3-2.22-.3-4.55-1.2-4.55-5.2 0-1.1.38-2 1-2.8-.1-.3-.4-1.3.1-2.7 0 0 .83-.3 2.7 1 .8-.2 1.7-.3 2.6-.3s1.8.1 2.6.3c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.8 1 1.7 1 2.8 0 4-2.3 4.9-4.6 5.2.37.3.7.9.7 1.9v2.8c0 .3.18.6.69.5A10.34 10.34 0 0 0 22 12.3C22 6.6 17.52 2 12 2Z"
              />
            </svg>
            <span>Open Source</span>
          </Button>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { ArrowRightEndOnRectangleIcon } from "@heroicons/vue/24/outline";
const canvas = ref(null);
let animationFrameId;

onMounted(() => {
  const ctx = canvas.value.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  function resize() {
    if (!canvas.value) return;
    canvas.value.width = canvas.value.offsetWidth * dpr;
    canvas.value.height = canvas.value.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
  }

  resize();
  window.addEventListener("resize", resize);

  const comets = Array.from({ length: 80 }).map(() => ({
    x: Math.random() * canvas.value.offsetWidth,
    y: Math.random() * canvas.value.offsetHeight,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    length: Math.random() * 20 + 10,
  }));

  function animate() {
    if (!canvas.value) return;

    const w = canvas.value.offsetWidth;
    const h = canvas.value.offsetHeight;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(20, 184, 166, 0.6)";
    ctx.lineWidth = 2;

    comets.forEach((c) => {
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x - c.vx * c.length, c.y - c.vy * c.length);
      ctx.stroke();

      c.x += c.vx;
      c.y += c.vy;

      if (c.x < 0) c.x = w;
      if (c.x > w) c.x = 0;
      if (c.y < 0) c.y = h;
      if (c.y > h) c.y = 0;
    });

    animationFrameId = requestAnimationFrame(animate);
  }

  animate();

  onUnmounted(() => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener("resize", resize);
  });
});
</script>
