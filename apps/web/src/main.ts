import { createApp } from "vue";
import { createPinia } from "pinia";
import { VueQueryPlugin } from "@tanstack/vue-query";
import { clerkPlugin } from "@clerk/vue";
import * as Sentry from "@sentry/vue";
import App from "./App.vue";
import { router } from "./router";
import { config } from "./config";
import "./style.css";

const app = createApp(App);

if (config.VITE_SENTRY_DSN) {
  Sentry.init({ app, dsn: config.VITE_SENTRY_DSN });
}

app.use(createPinia());
app.use(router);
app.use(VueQueryPlugin);
app.use(clerkPlugin, {
  publishableKey: config.VITE_CLERK_PUBLISHABLE_KEY,
  signInUrl: "/sign-in",
});

app.mount("#app");
