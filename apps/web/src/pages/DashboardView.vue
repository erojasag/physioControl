<script setup lang="ts">
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/vue";
import AppShell from "@/components/AppShell.vue";
import AgendaSlice from "@/components/AgendaSlice.vue";
</script>

<template>
  <SignedIn>
    <AppShell>
      <AgendaSlice />
    </AppShell>
  </SignedIn>
  <SignedOut>
    <RedirectToSignIn />
  </SignedOut>
</template>
