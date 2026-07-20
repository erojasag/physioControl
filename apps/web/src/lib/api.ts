import type {
  AppointmentDto,
  BookingResultDto,
  CreateAppointmentInput,
  CreateBookingInput,
  CreatePatientInput,
  PatientDto,
  PractitionerDto,
  PublicClinicDto,
  UpdateAppointmentStatusInput,
} from "@physio/shared";
import { config } from "@/config";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  token: string | null,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${config.VITE_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(res.status, body?.message ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

// Typed client. Pass the current Clerk token (from useAuth().getToken()).
export const api = {
  listPatients: (token: string | null) =>
    request<PatientDto[]>("/patients", token),
  createPatient: (token: string | null, body: CreatePatientInput) =>
    request<PatientDto>("/patients", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  listPractitioners: (token: string | null) =>
    request<PractitionerDto[]>("/practitioners", token),
  listAppointments: (token: string | null, date: string) =>
    request<AppointmentDto[]>(`/appointments?date=${date}`, token),
  createAppointment: (token: string | null, body: CreateAppointmentInput) =>
    request<AppointmentDto>("/appointments", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateAppointmentStatus: (
    token: string | null,
    id: string,
    body: UpdateAppointmentStatusInput,
  ) =>
    request<AppointmentDto>(`/appointments/${id}/status`, token, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  // Public (no token) self-booking.
  getClinic: (slug: string) =>
    request<PublicClinicDto>(`/book/${slug}`, null),
  book: (slug: string, body: CreateBookingInput) =>
    request<BookingResultDto>(`/book/${slug}`, null, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
