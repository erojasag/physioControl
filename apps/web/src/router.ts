import { createRouter, createWebHistory } from "vue-router";
import DashboardView from "@/pages/DashboardView.vue";
import SignInView from "@/pages/SignInView.vue";
import BookingView from "@/pages/BookingView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "dashboard", component: DashboardView },
    // Clerk's <SignIn> uses path-based sub-routes, so match the subtree.
    { path: "/sign-in/:pathMatch(.*)*", name: "sign-in", component: SignInView },
    // Public, unauthenticated self-booking.
    { path: "/book/:slug", name: "book", component: BookingView },
  ],
});
