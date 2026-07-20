<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useMutation, useQuery } from "@tanstack/vue-query";
import { api, ApiError } from "@/lib/api";

// Public, unauthenticated clinic booking page: /book/:slug
const route = useRoute();
const slug = route.params.slug as string;

const clinic = useQuery({
  queryKey: ["clinic", slug],
  queryFn: () => api.getClinic(slug),
  retry: false,
});

const today = new Date().toISOString().slice(0, 10);
const form = ref({
  practitionerId: "",
  patientName: "",
  patientPhone: "",
  date: today,
  time: "09:00",
  durationMin: 45,
});

const booking = useMutation({
  mutationFn: () => {
    const startsAt = new Date(`${form.value.date}T${form.value.time}:00`);
    const endsAt = new Date(startsAt.getTime() + form.value.durationMin * 60_000);
    return api.book(slug, {
      practitionerId: form.value.practitionerId,
      patientName: form.value.patientName.trim(),
      patientPhone: form.value.patientPhone.trim() || undefined,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    });
  },
});

const bookingError = computed(() => {
  const e = booking.error.value;
  if (!e) return null;
  return e instanceof ApiError && e.status === 409
    ? e.message
    : "No se pudo reservar. Intente otro horario.";
});
</script>

<template>
  <main class="min-h-screen bg-paper-100 grid place-items-center p-8">
    <div
      class="bg-white border border-line-100 rounded-lg shadow-md p-8 w-full max-w-md"
    >
      <p v-if="clinic.isPending.value" class="text-gray-400">Cargando…</p>
      <p v-else-if="clinic.isError.value" class="text-danger">
        Clínica no encontrada.
      </p>
      <template v-else-if="clinic.data.value">
        <h1 class="text-green-600 font-bold text-2xl tracking-tight">
          {{ clinic.data.value.name }}
        </h1>
        <p class="text-gray-500 text-sm mt-1">Reservar una cita</p>

        <div
          v-if="booking.isSuccess.value"
          class="mt-6 bg-green-50 border border-green-100 rounded-md p-4 text-green-700 text-sm"
        >
          ¡Cita reservada! Nos vemos pronto.
        </div>

        <form
          v-else
          class="flex flex-col gap-3 mt-6"
          @submit.prevent="booking.mutate()"
        >
          <select
            v-model="form.practitionerId"
            required
            class="border border-line-300 rounded-md px-3 py-2 text-sm bg-paper-50"
          >
            <option value="" disabled>Profesional…</option>
            <option
              v-for="pr in clinic.data.value.practitioners"
              :key="pr.id"
              :value="pr.id"
            >
              {{ pr.name }}
            </option>
          </select>
          <input
            v-model="form.patientName"
            placeholder="Su nombre"
            required
            class="border border-line-300 rounded-md px-3 py-2 text-sm bg-paper-50"
          >
          <input
            v-model="form.patientPhone"
            placeholder="Teléfono"
            required
            class="border border-line-300 rounded-md px-3 py-2 text-sm bg-paper-50"
          >
          <div class="flex gap-3">
            <input
              v-model="form.date"
              type="date"
              required
              class="border border-line-300 rounded-md px-3 py-2 text-sm bg-paper-50 flex-1"
            >
            <input
              v-model="form.time"
              type="time"
              required
              class="border border-line-300 rounded-md px-3 py-2 text-sm bg-paper-50"
            >
          </div>
          <button
            type="submit"
            :disabled="booking.isPending.value"
            class="bg-green-600 text-white font-semibold rounded-md py-2.5 text-sm hover:bg-green-700 disabled:opacity-50"
          >
            Reservar cita
          </button>
          <p v-if="bookingError" class="text-danger text-sm">
            {{ bookingError }}
          </p>
        </form>
      </template>
    </div>
  </main>
</template>
