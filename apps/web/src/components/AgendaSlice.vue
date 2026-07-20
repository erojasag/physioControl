<script setup lang="ts">
import { computed, ref } from "vue";
import { useAuth } from "@clerk/vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import type { AppointmentDto, UpdateAppointmentStatusInput } from "@physio/shared";
import { api, ApiError } from "@/lib/api";

const { getToken } = useAuth();
const qc = useQueryClient();

const today = new Date().toISOString().slice(0, 10);
const day = ref(today);

const patients = useQuery({
  queryKey: ["patients"],
  queryFn: async () => api.listPatients(await getToken.value()),
});

const practitioners = useQuery({
  queryKey: ["practitioners"],
  queryFn: async () => api.listPractitioners(await getToken.value()),
});

const appointments = useQuery({
  queryKey: ["appointments", day],
  queryFn: async () => api.listAppointments(await getToken.value(), day.value),
});

const invalidateDay = () =>
  qc.invalidateQueries({ queryKey: ["appointments", day.value] });

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
const form = ref({ patientId: "", practitionerId: "", time: "09:00", durationMin: 45 });
const createAppointment = useMutation({
  mutationFn: async () => {
    const startsAt = new Date(`${day.value}T${form.value.time}:00`);
    const endsAt = new Date(startsAt.getTime() + form.value.durationMin * 60_000);
    return api.createAppointment(await getToken.value(), {
      patientId: form.value.patientId,
      practitionerId: form.value.practitionerId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    });
  },
  onSuccess: invalidateDay,
});

const setStatus = useMutation({
  mutationFn: async (vars: {
    id: string;
    status: UpdateAppointmentStatusInput["status"];
  }) => api.updateAppointmentStatus(await getToken.value(), vars.id, { status: vars.status }),
  onSuccess: invalidateDay,
});

const apptError = computed(() => {
  const e = createAppointment.error.value;
  if (!e) return null;
  return e instanceof ApiError && e.status === 409
    ? e.message
    : "No se pudo crear la cita";
});

const STATUS_LABEL: Record<AppointmentDto["status"], string> = {
  BOOKED: "Reservada",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
};

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <div class="flex items-center justify-between">
    <h1 class="text-green-900 font-bold text-2xl tracking-tight">Agenda</h1>
    <input
      v-model="day"
      type="date"
      class="bg-paper-50 border border-line-300 rounded-md px-3 py-2 text-sm"
    >
  </div>

  <div class="grid grid-cols-3 gap-5 mt-6">
    <section
      class="col-span-2 bg-white border border-line-100 rounded-lg shadow-sm p-6"
    >
      <h2 class="font-bold text-slate-700 mb-4">Citas del día</h2>
      <p v-if="appointments.isPending.value" class="text-gray-400 text-sm">
        Cargando…
      </p>
      <p
        v-else-if="!appointments.data.value?.length"
        class="text-gray-400 text-sm"
      >
        Sin citas.
      </p>
      <ul v-else class="flex flex-col gap-2">
        <li
          v-for="a in appointments.data.value"
          :key="a.id"
          class="flex items-center gap-4 bg-paper-100 rounded-md px-4 py-3"
        >
          <span class="font-mono text-sm text-green-700">
            {{ fmtTime(a.startsAt) }}–{{ fmtTime(a.endsAt) }}
          </span>
          <span class="font-medium text-ink flex-1">{{ a.patientName }}</span>
          <span class="text-xs text-gray-500">{{ STATUS_LABEL[a.status] }}</span>
          <span class="flex gap-1">
            <button
              v-if="a.status === 'BOOKED'"
              class="text-xs px-2 py-1 rounded bg-green-100 text-green-600 font-semibold"
              @click="setStatus.mutate({ id: a.id, status: 'CONFIRMED' })"
            >
              Confirmar
            </button>
            <button
              v-if="a.status === 'BOOKED' || a.status === 'CONFIRMED'"
              class="text-xs px-2 py-1 rounded bg-danger/10 text-danger font-semibold"
              @click="setStatus.mutate({ id: a.id, status: 'CANCELLED' })"
            >
              Cancelar
            </button>
          </span>
        </li>
      </ul>
    </section>

    <aside class="flex flex-col gap-5">
      <section class="bg-white border border-line-100 rounded-lg shadow-sm p-6">
        <h2 class="font-bold text-slate-700 mb-3">Nuevo paciente</h2>
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
        <h2 class="font-bold text-slate-700 mb-3">Nueva cita</h2>
        <form
          class="flex flex-col gap-3"
          @submit.prevent="createAppointment.mutate()"
        >
          <select
            v-model="form.patientId"
            required
            class="border border-line-300 rounded-md px-3 py-2 text-sm bg-paper-50"
          >
            <option value="" disabled>Paciente…</option>
            <option
              v-for="p in patients.data.value ?? []"
              :key="p.id"
              :value="p.id"
            >
              {{ p.name }}
            </option>
          </select>
          <select
            v-model="form.practitionerId"
            required
            class="border border-line-300 rounded-md px-3 py-2 text-sm bg-paper-50"
          >
            <option value="" disabled>Profesional…</option>
            <option
              v-for="pr in practitioners.data.value ?? []"
              :key="pr.id"
              :value="pr.id"
            >
              {{ pr.name }}
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
          <p v-if="apptError" class="text-danger text-sm">{{ apptError }}</p>
        </form>
      </section>
    </aside>
  </div>
</template>
