<script setup lang="ts">
import { UserButton } from "@clerk/vue";

// App shell — DESIGN_SYSTEM.md §4. Nav targets are placeholders until their
// feature routes exist (build order steps 3+).
const nav = [
  { label: "Panel", to: "/", active: true },
  { label: "Agenda", to: "/", active: false },
  { label: "Pacientes", to: "/", active: false },
  { label: "Facturación", to: "/", active: false },
];
</script>

<template>
  <div class="min-h-screen flex bg-paper-100">
    <aside class="w-[236px] shrink-0 bg-white border-r border-line-100 flex flex-col">
      <div class="h-[68px] flex items-center px-6 border-b border-line-100">
        <span class="font-bold text-green-600 text-lg tracking-tight">
          PhysioControl
        </span>
      </div>
      <nav class="p-3 flex flex-col gap-1">
        <RouterLink
          v-for="item in nav"
          :key="item.label"
          :to="item.to"
          class="px-3 py-2 rounded-md text-sm transition-colors"
          :class="
            item.active
              ? 'bg-green-100 text-green-600 font-bold'
              : 'text-gray-500 font-medium hover:bg-[#f4f2ec]'
          "
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header
        class="h-[68px] shrink-0 bg-white border-b border-line-100 flex items-center justify-between px-8"
      >
        <input
          type="search"
          placeholder="Buscar…"
          class="bg-paper-100 rounded-md px-4 py-2 text-sm w-72 outline-none focus:ring-2 focus:ring-green-100"
        >
        <UserButton />
      </header>
      <main class="flex-1 p-8 min-w-0">
        <slot />
      </main>
    </div>
  </div>
</template>
