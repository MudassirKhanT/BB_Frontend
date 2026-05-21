const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      message = JSON.parse(text).message || text;
    } catch {}
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  get: (url: string) => fetch(`${API_BASE}${url}`, { headers: getHeaders() }).then(handleResponse),

  post: (url: string, data?: unknown) =>
    fetch(`${API_BASE}${url}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  patch: (url: string, data?: unknown) =>
    fetch(`${API_BASE}${url}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  put: (url: string, data?: unknown) =>
    fetch(`${API_BASE}${url}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  delete: (url: string) =>
    fetch(`${API_BASE}${url}`, {
      method: "DELETE",
      headers: getHeaders(),
    }).then(handleResponse),
};

// ── Course API ──
export const courseApi = {
  getAll: () => api.get("/course"),
  getAllAdmin: () => api.get("/course/admin/all"),
  getBySlug: (slug: string) => api.get(`/course/${slug}`),
  getCurriculum: (courseSlug: string) => api.get(`/topic/course/${courseSlug}`),
  getSubtopic: (id: string) => api.get(`/subtopic/${id}`),
  // Admin
  create: (data: unknown) => api.post("/course", data),
  update: (id: string, data: unknown) => api.patch(`/course/${id}`, data),
  delete: (id: string) => api.delete(`/course/${id}`),
  publish: (id: string) => api.patch(`/course/${id}/publish`, {}),
  // Topics (admin)
  getTopics: (courseSlug: string) => api.get(`/topic/course/${courseSlug}`),
  createTopic: (data: unknown) => api.post("/topic", data),
  updateTopic: (id: string, data: unknown) => api.patch(`/topic/${id}`, data),
  deleteTopic: (id: string) => api.delete(`/topic/${id}`),
  // Subtopics (admin)
  getSubtopics: (topicId: string) => api.get(`/subtopic/topic/${topicId}`),
  getSubtopicById: (id: string) => api.get(`/subtopic/${id}`),
  createSubtopic: (data: unknown) => api.post("/subtopic", data),
  updateSubtopic: (id: string, data: unknown) => api.patch(`/subtopic/${id}`, data),
  deleteSubtopic: (id: string) => api.delete(`/subtopic/${id}`),
};

// ── Enrollment API ──
export const enrollmentApi = {
  enroll: (courseId: string) => api.post("/enrollment", { courseId }),
  getMyEnrollments: () => api.get("/enrollment"),
  getByCourse: (courseSlug: string) => api.get(`/enrollment/course/${courseSlug}`),
  markComplete: (courseSlug: string, subtopicId: string) => api.post(`/enrollment/course/${courseSlug}/complete/${subtopicId}`),
  saveNote: (courseSlug: string, subtopicId: string, content: string) => api.post(`/enrollment/course/${courseSlug}/note`, { subtopicId, content }),
  toggleBookmark: (courseSlug: string, subtopicId: string) => api.post(`/enrollment/course/${courseSlug}/bookmark/${subtopicId}`),
};

// ── User API ──
export const userApi = {
  getDashboardStats: () => api.get("/user/dashboard-stats"),
  getProfile: () => api.get("/user/profile"),
  updateProfile: (data: unknown) => api.put("/user/profile", data),
};

// ── Auth API ──
export const authApi = {
  login: (email: string, password: string) => api.post("/auth/login", { email, password }),
  register: (username: string, email: string, password: string) => api.post("/auth/register", { username, email, password }),
};

// ── Problem API ──
export const problemApi = {
  getAll: (company?: string) => api.get(`/problems/all${company ? `?company=${encodeURIComponent(company)}` : ""}`),
  getByCourse: (courseSlug: string) => api.get(`/problems/course/${courseSlug}`),
  getBySlug: (slug: string) => api.get(`/problems/${slug}`),
  getPotd: () => api.get("/problems/potd"),
  submit: (slug: string, data: { language: string; code: string }) => api.post(`/problems/${slug}/submit`, data),
  updateStatus: (slug: string, data: { status: string; language?: string; code?: string }) => api.post(`/problems/${slug}/status`, data),
};

// ── Compile API ──
export const compileApi = {
  run: (data: { language: string; code: string; stdin?: string }) => api.post("/compile", data),
};

// ── Company API ──
export const companyApi = {
  getAll: () => api.get("/company"),
  getBySlug: (slug: string) => api.get(`/company/${slug}`),
  getPrepContent: (slug: string) => api.get(`/company/${slug}/prep`),
  // Admin — company
  create: (data: unknown) => api.post("/company", data),
  update: (id: string, data: unknown) => api.patch(`/company/${id}`, data),
  delete: (id: string) => api.delete(`/company/${id}`),
  // Admin — prep content
  createPrepContent: (companyId: string, data: unknown) => api.post(`/company/${companyId}/prep`, data),
  updatePrepContent: (contentId: string, data: unknown) => api.patch(`/company/prep/${contentId}`, data),
  deletePrepContent: (contentId: string) => api.delete(`/company/prep/${contentId}`),
  // Questions (public read, admin write)
  getQuestions: (slug: string, category?: string) => api.get(`/company/${slug}/questions${category ? `?category=${category}` : ""}`),
  createQuestion: (companyId: string, data: unknown) => api.post(`/company/${companyId}/questions`, data),
  updateQuestion: (qId: string, data: unknown) => api.patch(`/company/questions/${qId}`, data),
  deleteQuestion: (qId: string) => api.delete(`/company/questions/${qId}`),
};

// ── Interview Experience API ──
export const interviewExpApi = {
  getAll: (params?: { result?: string; page?: number; limit?: number }) => {
    const qs = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)]),
        ).toString()
      : "";
    return api.get(`/interview-experience${qs ? `?${qs}` : ""}`);
  },
  getByCompany: (slug: string) => api.get(`/interview-experience/company/${slug}`),
  submit: (slug: string, data: unknown) => api.post(`/interview-experience/company/${slug}`, data),
  // Admin
  getPending: () => api.get("/interview-experience/pending"),
  approve: (id: string) => api.patch(`/interview-experience/${id}/approve`, {}),
  delete: (id: string) => api.delete(`/interview-experience/${id}`),
};

// ── Mock Assessment API ──
export const mockApi = {
  getAll: () => api.get("/mock"),
  getById: (id: string) => api.get(`/mock/${id}`),
  submit: (id: string, data: { answers: { questionId: string; selected: number }[]; timeTaken: number }) => api.post(`/mock/${id}/submit`, data),
  getMyResult: (id: string) => api.get(`/mock/${id}/my-result`),
  // Admin
  create: (data: unknown) => api.post("/mock", data),
  update: (id: string, data: unknown) => api.patch(`/mock/${id}`, data),
  delete: (id: string) => api.delete(`/mock/${id}`),
  getQuestionsAdmin: (id: string) => api.get(`/mock/${id}/questions`),
  addQuestion: (id: string, data: unknown) => api.post(`/mock/${id}/questions`, data),
  updateQuestion: (qid: string, data: unknown) => api.patch(`/mock/questions/${qid}`, data),
  deleteQuestion: (qid: string) => api.delete(`/mock/questions/${qid}`),
};

// ── Contest API ──
export const contestApi = {
  getAll: () => api.get("/contest"),
  getBySlug: (slug: string) => api.get(`/contest/${slug}`),
  getLeaderboard: (slug: string) => api.get(`/contest/${slug}/leaderboard`),
  register: (slug: string) => api.post(`/contest/${slug}/register`, {}),
  submit: (slug: string, problemSlug: string, data: { code: string; language: string }) => api.post(`/contest/${slug}/submit/${problemSlug}`, data),
  getMySubmissions: (slug: string) => api.get(`/contest/${slug}/my-submissions`),
  // Admin
  create: (data: unknown) => api.post("/contest", data),
  update: (id: string, data: unknown) => api.patch(`/contest/${id}`, data),
  delete: (id: string) => api.delete(`/contest/${id}`),
  addProblem: (id: string, data: unknown) => api.post(`/contest/${id}/problems`, data),
  removeProblem: (id: string, problemId: string) => api.delete(`/contest/${id}/problems/${problemId}`),
  createProblem: (id: string, data: unknown) => api.post(`/contest/${id}/create-problem`, data),
};

// ── Admin Problems API ──
export const adminProblemApi = {
  getAll: () => api.get("/problems/admin/all"),
  create: (data: unknown) => api.post("/problems", data),
  update: (id: string, data: unknown) => api.patch(`/problems/${id}`, data),
  delete: (id: string) => api.delete(`/problems/${id}`),
};

// ── Admin Users API ──
export const adminUserApi = {
  getAll: () => api.get("/user/admin/all"),
  block: (id: string) => api.patch(`/user/block/${id}`, {}),
  unblock: (id: string) => api.patch(`/user/unblock/${id}`, {}),
  setRole: (id: string, role: string) => api.patch(`/user/role/${id}`, { role }),
};

// ── Chatbot API ──
export const chatbotApi = {
  chat: (message: string, history: { role: "user" | "model"; text: string }[] = []) => api.post("/chatbot/chat", { message, history }),
};

// ── Jobs API ──
export const jobsApi = {
  getJobs: (params: { keyword?: string; location?: string; category?: string; type?: string; page?: number; source?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    return api.get(`/jobs${qs ? `?${qs}` : ""}`);
  },
  getStatus: () => api.get("/jobs/status"),
};

// ── Roadmap API ──
export const roadmapApi = {
  generate: (data: { companyType: string; timeline: string; skillLevel?: string }) =>
    api.post("/roadmap/generate", data),
};

// ── Resource API ──
export const resourceApi = {
  getAll: (params?: { type?: string; category?: string; difficulty?: string }) => {
    const qs = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString() : "";
    return api.get(`/resource${qs ? `?${qs}` : ""}`);
  },
  getAllAdmin: () => api.get("/resource/admin/all"),
  getBySlug: (slug: string) => api.get(`/resource/${slug}`),
  create: (data: unknown) => api.post("/resource", data),
  update: (id: string, data: unknown) => api.patch(`/resource/${id}`, data),
  delete: (id: string) => api.delete(`/resource/${id}`),
};
