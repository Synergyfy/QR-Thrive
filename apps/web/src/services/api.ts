import axios from "axios";
import type {
  AuthResponse,
  BackendFolder,
  CreateFolderDto,
  CreateQRCodeDto,
  BackendQRCode,
  DashboardStats,
  Scan,
  AdminStats,
  AdminUsersResponse,
  SystemConfig,
  Plan,
  Country,
  PricingConfig,
  PriceBook,
  SupportTicket,
  TicketWithMessages,
  TicketStatus,
} from "../types/api";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "/api/v1" : "http://localhost:3005/api/v1");
const SESSION_HINT_KEY = "qr-thrive-session";

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom: any) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem(SESSION_HINT_KEY)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        axios
          .post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
          .then(() => {
            isRefreshing = false;
            processQueue(null);
            resolve(apiClient(originalRequest));
          })
          .catch((err) => {
            isRefreshing = false;
            processQueue(err);
            localStorage.removeItem(SESSION_HINT_KEY);
            reject(err);
          });
      });
    }

    if (error.response?.status === 401) {
      localStorage.removeItem(SESSION_HINT_KEY);
    }

    return Promise.reject(error);
  },
);

export const authApi = {
  signup: async (data: any) => {
    const res = await apiClient.post<AuthResponse>("/auth/signup", data);
    localStorage.setItem(SESSION_HINT_KEY, "true");
    return res.data;
  },
  login: async (data: any) => {
    const res = await apiClient.post<AuthResponse>("/auth/login", data);
    localStorage.setItem(SESSION_HINT_KEY, "true");
    return res.data;
  },
  googleLogin: async (token: string) => {
    const res = await apiClient.post<AuthResponse>("/auth/google", { token });
    localStorage.setItem(SESSION_HINT_KEY, "true");
    return res.data;
  },
  logout: async () => {
    localStorage.removeItem(SESSION_HINT_KEY);
    return (await apiClient.post("/auth/logout")).data;
  },
  getMe: async () => {
    const hint = localStorage.getItem(SESSION_HINT_KEY);
    console.log("authApi.getMe: session hint check:", !!hint);
    if (!hint) return null;
    try {
      const res = await apiClient.get<AuthResponse>("/auth/me");
      console.log("authApi.getMe: Successfully fetched profile");
      return res.data;
    } catch (err) {
      console.error("authApi.getMe: Failed to fetch profile", err);
      throw err;
    }
  },
  updateProfile: async (data: any) => {
    const res = await apiClient.patch<AuthResponse>("/auth/profile", data);
    return res.data;
  },
};

export const notificationsApi = {
  subscribePush: async (subscription: PushSubscription) => {
    return (await apiClient.post("/notifications/push/subscribe", subscription))
      .data;
  },
};

export const foldersApi = {
  getFolders: async () =>
    (await apiClient.get<BackendFolder[]>("/folders")).data,
  createFolder: async (data: CreateFolderDto) =>
    (await apiClient.post<BackendFolder>("/folders", data)).data,
  deleteFolder: async (id: string) =>
    (await apiClient.delete(`/folders/${id}`)).data,
};

export const qrCodesApi = {
  getQRCodes: async (params?: any) => {
    const res = await apiClient.get<
      (BackendQRCode & { _count?: { scans: number } })[]
    >("/qr-codes", { params });
    // Transform backend qr code to match the expected format in UI
    return (res.data || []).map((qr) => ({
      ...qr,
      scans: qr.scans ?? qr._count?.scans ?? 0,
      shortUrl: qr.shortUrl || `/s/${qr.shortId}`,
      config: {
        data: qr.data || {},
        design: qr.design || {},
        frame: qr.frame || {},
        logo: qr.logo,
        width: qr.width || 400,
        height: qr.height || 400,
        margin: qr.margin || 20,
        isDynamic: qr.isDynamic ?? true,
        shortId: qr.shortId,
      },
    }));
  },
  getQRCode: async (id: string) => {
    const qr = (
      await apiClient.get<BackendQRCode & { _count?: { scans: number } }>(
        `/qr-codes/${id}`,
      )
    ).data;
    return {
      ...qr,
      scans: qr.scans ?? qr._count?.scans ?? 0,
      shortUrl: qr.shortUrl || `/s/${qr.shortId}`,
      config: {
        data: qr.data || {},
        design: qr.design || {},
        frame: qr.frame || {},
        logo: qr.logo,
        width: qr.width || 400,
        height: qr.height || 400,
        margin: qr.margin || 20,
        isDynamic: qr.isDynamic ?? true,
        shortId: qr.shortId,
      },
    };
  },
  getScans: async (id: string) =>
    (await apiClient.get<Scan[]>(`/qr-codes/${id}/scans`)).data,
  getPublicQRCode: async (shortId: string) => {
    const res = await apiClient.get<BackendQRCode>(
      `/qr-codes/public/${shortId}`,
    );
    const qr = res.data;
    return {
      ...qr,
      shortUrl: qr.shortUrl || `/s/${qr.shortId}`,
      config: {
        data: qr.data || {},
        design: qr.design || {},
        frame: qr.frame || {},
        logo: qr.logo,
        width: qr.width || 400,
        height: qr.height || 400,
        margin: qr.margin || 20,
        isDynamic: qr.isDynamic ?? true,
        shortId: qr.shortId,
      },
    };
  },
  createQRCode: async (data: CreateQRCodeDto) =>
    (await apiClient.post<BackendQRCode>("/qr-codes", data)).data,
  updateQRCode: async (id: string, data: Partial<BackendQRCode>) =>
    (await apiClient.put<BackendQRCode>(`/qr-codes/${id}`, data)).data,
  duplicateQRCode: async (id: string) =>
    (await apiClient.post<BackendQRCode>(`/qr-codes/${id}/duplicate`)).data,
  deleteQRCode: async (id: string) =>
    (await apiClient.delete(`/qr-codes/${id}`)).data,
};

export const statsApi = {
  getDashboardStats: async () =>
    (await apiClient.get<DashboardStats>("/qr-codes/stats")).data,
};

export const uploadApi = {
  getSignedUrl: async (
    fileType: string,
    fileName: string,
    fileSize: number,
  ) => {
    const res = await apiClient.post<{
      signedUrl: string;
      cloudinaryUrl: string;
      publicId: string;
    }>("/upload/signed-url", { fileType, fileName, fileSize });
    return res.data;
  },
  deleteFile: async (publicId: string) => {
    const res = await apiClient.delete(`/upload/file/${publicId}`);
    return res.data;
  },
};

export const mediaApi = {
  getSignature: async () =>
    (
      await apiClient.get<{
        signature: string;
        timestamp: number;
        folder: string;
        cloudName: string;
        apiKey: string;
      }>("/media/signature")
    ).data,
  updateQRCodeMedia: async (id: string, secureUrl: string) =>
    (await apiClient.patch(`/media/${id}`, { secureUrl })).data,
  uploadToCloudinary: async (
    file: any,
    credentials: {
      signature: string;
      timestamp: number;
      folder: string;
      cloudName: string;
      apiKey: string;
    },
  ) => {
    const formData = new FormData();

    // Ensure we are sending the actual file object, not a wrapper
    const fileToUpload =
      file instanceof File || file instanceof Blob ? file : file?.file;
    if (!fileToUpload) {
      throw new Error("No valid file provided for Cloudinary upload");
    }

    formData.append("file", fileToUpload);
    formData.append("signature", credentials.signature);
    formData.append("timestamp", credentials.timestamp.toString());
    formData.append("api_key", credentials.apiKey);
    formData.append("folder", credentials.folder);

    // Unauthenticated POST directly to Cloudinary
    // Note: Use /auto/ upload for dynamic handling of videos, PDFs, images, etc.
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${credentials.cloudName}/auto/upload`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data;
  },
};

export const adminApi = {
  getStats: async (range = "7d") =>
    (await apiClient.get<AdminStats>("/admin/stats", { params: { range } }))
      .data,
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) =>
    (await apiClient.get<AdminUsersResponse>("/admin/users", { params })).data,
  getConfig: async () =>
    (await apiClient.get<SystemConfig>("/admin/config")).data,
  updateConfig: async (data: Partial<SystemConfig>) =>
    (await apiClient.patch<SystemConfig>("/admin/config", data)).data,

  // Plans Management
  getPlans: async () => (await apiClient.get<Plan[]>("/plans/all")).data,
  createPlan: async (data: Partial<Plan>) =>
    (await apiClient.post<Plan>("/plans", data)).data,
  updatePlan: async (id: string, data: Partial<Plan>) =>
    (await apiClient.patch<Plan>(`/plans/${id}`, data)).data,
  deletePlan: async (id: string) =>
    (await apiClient.delete(`/plans/${id}`)).data,

  // Pricing & Geography
  getCountries: async () =>
    (await apiClient.get<Country[]>("/admin/countries")).data,
  updateCountry: async (code: string, data: Partial<Country>) =>
    (await apiClient.patch<Country>(`/admin/countries/${code}`, data)).data,
  getPlanPrices: async (planId: string) =>
    (await apiClient.get<PriceBook[]>(`/admin/plans/${planId}/prices`)).data,
  createPriceBook: async (planId: string, data: Partial<PriceBook>) =>
    (await apiClient.post<PriceBook>(`/admin/plans/${planId}/prices`, data))
      .data,
  updatePriceBook: async (id: string, data: Partial<PriceBook>) =>
    (await apiClient.patch<PriceBook>(`/admin/price-books/${id}`, data)).data,

  getPricingConfig: async () =>
    (await apiClient.get<PricingConfig>("/pricing/config")).data,
  updatePricingConfig: async (data: Partial<PricingConfig>) =>
    (await apiClient.patch<PricingConfig>("/pricing/config", data)).data,

  suggestPrice: async (
    basePriceUSD: number,
    targetCurrencyCode: string,
    tier?: string,
  ) =>
    (
      await apiClient.get("/pricing/suggest", {
        params: { basePriceUSD, targetCurrencyCode, tier },
      })
    ).data,

  banUser: async (id: string) =>
    (await apiClient.patch(`/admin/users/${id}/ban`)).data,
  grantPlan: async (
    userId: string,
    data: { planId: string; duration: string },
  ) => (await apiClient.post(`/admin/users/${userId}/grant-plan`, data)).data,
  deleteUser: async (id: string) =>
    (await apiClient.delete(`/admin/users/${id}`)).data,
  exportUsers: async () => {
    const res = await apiClient.get("/admin/users/export", {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "users-export.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
export const paymentsApi = {
  initialize: async (data: {
    planId: string;
    interval: string;
    isTrial?: boolean;
  }) => {
    return (await apiClient.post("/payments/initialize", data)).data;
  },
  verifyPayment: async (reference: string) => {
    return (await apiClient.post("/payments/verify", { reference })).data;
  },
  verifyPaymentWithPlanId: async (
    reference: string,
    planId: string,
    interval?: string,
  ) => {
    return (
      await apiClient.post("/payments/verify", { reference, planId, interval })
    ).data;
  },
  startTrial: async (data: { planId: string }) =>
    (
      await apiClient.post<{ message: string; trialEndsAt: string }>(
        "/payments/start-trial",
        data,
      )
    ).data,
  subscribeFree: async (data: { planId: string }) =>
    (
      await apiClient.post<{ message: string; planName: string }>(
        "/payments/subscribe-free",
        data,
      )
    ).data,
  cancelSubscription: async () =>
    (await apiClient.post<{ message: string }>("/payments/cancel")).data,
};

export const supportApi = {
  createTicket: async (data: {
    guestName?: string;
    guestEmail?: string;
    subject?: string;
  }) => (await apiClient.post<SupportTicket>("/support/tickets", data)).data,
  getMyTicket: async () =>
    (await apiClient.get<TicketWithMessages>("/support/tickets/mine")).data,
  sendMessage: async (ticketId: string, text: string) =>
    (await apiClient.post(`/support/tickets/${ticketId}/messages`, { text }))
      .data,
  sendTypingSignal: async (ticketId: string) =>
    (await apiClient.post(`/support/tickets/${ticketId}/typing`)).data,
  getTickets: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) =>
    (
      await apiClient.get<{
        data: (SupportTicket & { unreadCount: number; lastMessage?: any })[];
        meta: any;
      }>("/support/tickets", { params })
    ).data,
  getTicketMessages: async (ticketId: string) =>
    (
      await apiClient.get<TicketWithMessages>(
        `/support/tickets/${ticketId}/messages`,
      )
    ).data,
  updateTicketStatus: async (ticketId: string, status: TicketStatus) =>
    (await apiClient.patch(`/support/tickets/${ticketId}/status`, { status }))
      .data,
};
