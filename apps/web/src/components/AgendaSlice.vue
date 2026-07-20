<script setup lang="ts">
import { computed, ref } from "vue";
import { useAuth } from "@clerk/vue";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/vue-query";
import { api, ApiError } from "@/lib/api";

const { getToken } = useAuth();
const qc = useQueryClient();

const today = new Date().toISOString().slice(0, 10);
const day = ref(today);

const patients = useQuery({
  queryKey: ["patients"],
  queryFn: async () => api.listPatients(await getToken.value()),
});

const appointments = useQuery({
  queryKey: ["appointments", day],
  queryFn: async () => api.listAppointments(await getToken.value(), day.value),
});

// New patient
const patientName = ref("");
const createPatient = useMutation({
  mutationFn: async () =>
    api.createPatient(await getToken.value(), { name: patientName.value.trim() }),
  onSuccess: () => {
    patientName.value = "";
    qc.invalidateQueries({ queryKey: ["patients"] });
  },
});

// New appointment
const form = ref({ patientId: "", time: "09:00", durationMin: 45 });
const createAppointment = useMutation({
  mutationFn: async () => {
    const startsAt = new Date(`${day.value}T${form.value.time}:00`);
    const endsAt = new Date(
      startsAt.getTime() + form.value.durationMin * 60_000,
    );
    return api.createAppointment(await getToken.value(), {
      patientId: form.value.patientId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    });
  },
  onSuccess: () =>
    qc.invalidateQueries({ queryKey: ["appointments", day.value] }),
});

const apptError = computed(() => {
  const e = createAppointment.error.value;
  if (!e) return null;
  return e instanceof ApiError && e.status === 409
    ? e.message
    : "No se pudo crear la cita";
});

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <div class="flex items-center justify-between">
    <h1 class="text-green-900 font-bold text-2xl tracking-tight">
      Agenda
    </h1>
    <input
      v-model="day"
      type="date"
      class="bg-paper-50 border border-line-300 rounded-md px-3 py-2 text-sm"
    >
  </div>

  <div class="grid grid-cols-3 gap-5 mt-6">
    <!-- Day calendar -->
    <section
      class="col-span-2 bg-white border border-line-100 rounded-lg shadow-sm p-6"
    >
      <h2 class="font-bold text-slate-700 mb-4">
        Citas del día
      </h2>
      <p
        v-if="appointments.isPending.value"
        class="text-gray-400 text-sm"
      >
        Cargando…
      </p>
      <p
        v-else-if="!appointments.data.value?.length"
        class="text-gray-400 text-sm"
      >
        Sin citas.
      </p>
      <ul
        v-else
        class="flex flex-col gap-2"
      >
        <li
          v-for="a in appointments.data.value"
          :key="a.id"
          class="flex items-center gap-4 bg-paper-100 rounded-md px-4 py-3"
        >
          <span class="font-mono text-sm text-green-700">
            {{ fmtTime(a.startsAt) }}–{{ fmtTime(a.endsAt) }}
          </span>
          <span class="font-medium text-ink">{{ a.patientName }}</span>
        </li>
      </ul>
    </section>

    <!-- Create forms -->
    <aside class="flex flex-col gap-5">
      <section class="bg-white border border-line-100 rounded-lg shadow-sm p-6">
        <h2 class="font-bold text-slate-700 mb-3">
          Nuevo paciente
        </h2>
        <form
          class="flex flex-col gap-3"
          @submit.prevent="createPatient.mutate()"
        >
          <input
            v-model="patientName"
            placeholder="Nombre"
            required
            class="border border-line-300 rounded-md px-3 py-2 text-sm bg-paper-50"
          >
          <button
            type="submit"
            :disabled="createPatient.isPending.value"
            class="bg-green-600 text-white font-semibold rounded-md py-2 text-sm hover:bg-green-700 disabled:opacity-50"
          >
            Agregar
          </button>
        </form>
      </section>

      <section class="bg-white border border-line-100 rounded-lg shadow-sm p-6">
        <h2 class="font-bold text-slate-700 mb-3">
          Nueva cita
        </h2>
        <form
          class="flex flex-col gap-3"
          @submit.prevent="createAppointment.mutate()"
        >
          <select
            v-model="form.patientId"
            required
            class="border border-line-300 rounded-md px-3 py-2 text-sm bg-paper-50"
          >
            <option
              value=""
              disabled
            >
              Paciente…
            </option>
            <option
              v-for="p in patients.data.value ?? []"
              :key="p.id"
              :value="p.id"
            >
              {{ p.name }}
            </option>
          </select>
          <div class="flex gap-3">
            <input
              v-model="form.time"
              type="time"
              required
              class="border border-line-300 rounded-md px-3 py-2 text-sm bg-paper-50 flex-1"
            >
            <input
              v-model.number="form.durationMin"
              type="number"
              min="5"
              step="5"
              class="border border-line-300 rounded-md px-3 py-2 text-sm bg-paper-50 w-20"
            >
          </div>
          <button
            type="submit"
            :disabled="createAppointment.isPending.value"
            class="bg-green-600 text-white font-semibold rounded-md py-2 text-sm hover:bg-green-700 disabled:opacity-50"
          >
            Reservar
          </button>
          <p
            v-if="apptError"
            class="text-danger text-sm"
          >
            {{ apptError }}
          </p>
        </form>
      </section>
    </aside>
  </div>
</template>
