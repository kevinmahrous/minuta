# Minuta

![Minuta](https://minutatime.vercel.app/banner.png)

A minimalist **session tracking app** built with **Vue 3 + Firebase Firestore**.  
Track focus sessions, tag your work, view simple analytics, and even more.

---

## Features

- **Pomodoro & Stopwatch.**
- **Tag and organize your sessions.**
- **Analytics to know your behavior.**

Built to be lightweight, fast, and easy to extend.

---

## Stack

- **Vue Composition API**
- **Firebase Firestore**
- **TailwindCSS**
- **PrimeVue UI**
- **Heroicons**
- **Vue Router**
- **Inter Font**

---

## Getting Started

1. You'll need a Firebase project with Firestore and Authentication (email/password enabled).
2. Generate an index query by clicking a link from the developer console on the Analytics page.
3. An API key from ImgBB, a free image hosting service.

```bash
# clone
git clone https://github.com/kevinmahrous/minuta.git
# enter folder
cd minuta
# install dependencies
npm install
# create a .env file with the following variables:
# VITE_FIREBASE_API_KEY=
# VITE_FIREBASE_AUTH_DOMAIN=
# VITE_FIREBASE_PROJECT_ID=
# VITE_FIREBASE_STORAGE_BUCKET=
# VITE_FIREBASE_MESSAGING_SENDER_ID=
# VITE_FIREBASE_APP_ID=
# VITE_IMGBB_API_KEY=
# run the app
npm run dev
```

## Contributing

Contributing is very welcome. If you can simplify a function, re-structure the database, add a feature, fix a bug, etc. All are welcome.

My goal is to make Minuta a community project after all, beacure there's not much good open-source time-tracking app or how I hope MInuta will end up be.
