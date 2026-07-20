<script setup lang="ts">
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/vue";
import AppShell from "@/components/AppShell.vue";
</script>

<template>
  <SignedIn>
    <AppShell>
      <h1 class="text-green-900 font-bold text-2xl tracking-tight">
        Panel
      </h1>
      <p class="text-gray-500 mt-2">
        Fundaciones listas. Autenticación y contexto de tenant activos.
      </p>
    </AppShell>
  </SignedIn>
  <SignedOut>
    <RedirectToSignIn />
  </SignedOut>
</template>
