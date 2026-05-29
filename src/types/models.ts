// ── Shared domain types derived from backend Mongoose models ─────────────────

// ── User ─────────────────────────────────────────────────────────────────────
export interface User {
  _id: string;
  username: string;
  email: string;
  role: "student" | "admin" | "instructor";
  avatar?: string;
  bio?: string;
  college?: string;
  branch?: string;
  cgpa?: number;
  graduationYear?: number;
  phone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  skills?: string[];
  resumeUrl?: string;
  isBlocked: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ── Company ───────────────────────────────────────────────────────────────────
export interface HiringDetails {
  ctc: string;
  roles: string[];
  eligibility: string;
  locations: string[];
  bond: string;
  selectionRate: string;
}

export interface CompanyRound {
  name: string;
  description: string;
  duration: string;
  tips: string;
  order: number;
}

export interface Company {
  _id: string;
  name: string;
  slug: string;
  logo: string;
  type: "Service" | "Product" | "Startup" | "Consulting" | "FAANG";
  color: string;
  badge: string;
  badgeColor: string;
  website: string;
  description: string;
  overview: string;
  hiringProcess: string;
  hiringDetails: HiringDetails;
  rounds: CompanyRound[];
  isPublished: boolean;
  order: number;
  createdAt?: string;
}

// ── PrepContent ───────────────────────────────────────────────────────────────
export type PrepCategory = "aptitude" | "communication" | "dsa" | "sql" | "lld" | "hld";

export interface PrepContent {
  _id: string;
  company: string;
  category: PrepCategory;
  title: string;
  content: string;
  order: number;
  isPublished: boolean;
}

// ── PrepQuestion ──────────────────────────────────────────────────────────────
export interface PrepQuestion {
  _id: string;
  company: string;
  category: PrepCategory;
  type: "mcq" | "coding" | "theory";
  question: string;
  options: string[];
  answer: string;
  solution: string;
  solutionCode: string;
  solutionLanguage: "python" | "java" | "cpp" | "javascript" | "c" | "";
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  order: number;
  isPublished: boolean;
}

// ── Course ────────────────────────────────────────────────────────────────────
export interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  coverImageUrl: string | null;
  tags: string[];
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  language: string;
  isPublished: boolean;
  views: number;
  price: number;
  totalEnrollments: number;
  rating: number;
  totalRatings: number;
  estimatedDuration: string;
  whatYouWillLearn: string[];
  requirements: string[];
  color: string;
  icon: string;
  createdAt?: string;
}

// ── Topic ─────────────────────────────────────────────────────────────────────
export interface Topic {
  _id: string;
  title: string;
  course: string;
  order: number;
}

// ── Subtopic ──────────────────────────────────────────────────────────────────
export interface ContentBlock {
  type: string;
  data: Record<string, unknown>;
}

export interface Subtopic {
  _id: string;
  title: string;
  slug: string;
  topic: string;
  order: number;
  isFreePreview: boolean;
  content: ContentBlock[];
  estimatedReadTime: number;
  videoUrl: string | null;
  summary: string;
}

// ── Problem ───────────────────────────────────────────────────────────────────
export interface ProblemExample {
  input: string;
  output: string;
  explanation: string;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface StarterCode {
  python: string;
  javascript: string;
  cpp: string;
  java: string;
  sql?: string;
}

export interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  type: "coding" | "sql";
  frequency: number;
  description: string;
  examples: ProblemExample[];
  testCases: TestCase[];
  starterCode: StarterCode;
  topicTag: string;
  course: string | null;
  companies: string[];
  solutionArticle: string;
  leetcodeUrl: string;
  isPublished: boolean;
  isProblemOfDay: boolean;
  order: number;
  createdAt?: string;
}

// ── Contest ───────────────────────────────────────────────────────────────────
export interface ContestProblemEntry {
  problem: Problem | string;
  points: number;
  order: number;
}

export interface Contest {
  _id: string;
  title: string;
  slug: string;
  description: string;
  startTime: string;
  endTime: string;
  problems: ContestProblemEntry[];
  registrations: string[];
  banner: string;
  type: "weekly" | "monthly" | "custom";
  isPublished: boolean;
  isStarted: boolean;
  startedAt?: string;
  totalRegistrations: number;
  status?: "upcoming" | "ongoing" | "ended";
  createdAt?: string;
}

// ── Hackathon ─────────────────────────────────────────────────────────────────
export interface HackathonPS {
  _id: string;
  hackathon: string;
  title: string;
  description: string;
  techStack: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  isLocked: boolean;
  lockedByTeam: { _id: string; teamName: string } | null;
  order: number;
  isPublished: boolean;
}

export interface HackathonTeam {
  _id: string;
  hackathon: string;
  teamName: string;
  leader: string;
  memberEmails: string[];
  selectedPS: HackathonPS | null;
  isSubmitted: boolean;
  createdAt?: string;
}

export interface Hackathon {
  _id: string;
  title: string;
  slug: string;
  description: string;
  theme: string;
  startTime: string;
  endTime: string;
  maxTeamSize: number;
  minTeamSize: number;
  banner: string;
  prizePool: string;
  isPublished: boolean;
  isStarted: boolean;
  startedAt?: string;
  status?: "upcoming" | "active" | "ended";
  createdAt?: string;
}

export interface HackathonLeaderboardEntry {
  rank: number;
  teamName: string;
  memberEmails: string[];
  psTitle: string;
  difficulty: "Easy" | "Medium" | "Hard";
  score: number;
  review: string;
  scoringDetails: { codeQuality: number; relevance: number; innovation: number; completeness: number };
  githubUrl: string;
  submittedAt: string;
}

export interface HackathonSubmission {
  _id: string;
  hackathon: string;
  team: { teamName: string; memberEmails: string[] };
  ps: { title: string; difficulty: string };
  githubUrl: string;
  zipUrl: string;
  aiScore: number;
  aiReview: string;
  scoringDetails: { codeQuality: number; relevance: number; innovation: number; completeness: number };
  isScored: boolean;
  createdAt?: string;
}

// ── Contest Submission ────────────────────────────────────────────────────────
export interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  stderr: string;
}

export interface ContestSubmission {
  _id: string;
  contest: string;
  user: string;
  problem: string;
  code: string;
  language: string;
  status: "accepted" | "wrong_answer" | "runtime_error" | "compile_error" | "pending";
  score: number;
  attemptNumber: number;
  timeFromStart: number;
  testResults: TestResult[];
  createdAt?: string;
}

// ── MockExam ──────────────────────────────────────────────────────────────────
export interface MockExam {
  _id: string;
  title: string;
  slug: string;
  description: string;
  instructions: string;
  duration: number;
  banner: string;
  isPublished: boolean;
  totalQuestions: number;
  passingScore: number;
  tags: string[];
  createdAt?: string;
}

export type MockSection = "aptitude" | "communication" | "coding" | "sql";

// ── MockQuestion ──────────────────────────────────────────────────────────────
export interface MockQuestion {
  _id: string;
  exam: string;
  section: MockSection;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard";
  order: number;
}

// ── MockAttempt ───────────────────────────────────────────────────────────────
export interface SectionScore {
  correct: number;
  total: number;
}

export interface MockAttemptAnswer {
  question: string;
  selected: number;
}

export interface MockAttempt {
  _id: string;
  user: string;
  exam: string;
  answers: MockAttemptAnswer[];
  score: number;
  total: number;
  sectionScores: Record<MockSection, SectionScore>;
  timeTaken: number;
  completedAt: string;
}

// ── Resource ──────────────────────────────────────────────────────────────────
export type ResourceType = "company-paper" | "dsa-note" | "cs-fundamental" | "blog";
export type ResourceDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface Resource {
  _id: string;
  title: string;
  slug: string;
  type: ResourceType;
  description: string;
  content?: string;
  coverColor: string;
  tags: string[];
  category: string;
  difficulty: ResourceDifficulty;
  fileUrl: string;
  videoUrl: string;
  company: string;
  readTime: number;
  authorName: string;
  isPublished: boolean;
  order: number;
  views: number;
  likes: number;
  createdAt?: string;
}

// ── InterviewExperience ───────────────────────────────────────────────────────
export interface InterviewExperience {
  _id: string;
  company: string | { _id: string; name: string; slug: string };
  author: string;
  authorName: string;
  role: string;
  year: number;
  experience: string;
  result: "selected" | "rejected" | "pending";
  rounds: string[];
  tips: string;
  isApproved: boolean;
  likes: number;
  createdAt?: string;
}

// ── Enrollment ────────────────────────────────────────────────────────────────
export interface Enrollment {
  _id: string;
  user: string;
  course: Course | string;
  completedSubtopics: string[];
  lastAccessedSubtopic: string | null;
  progress: number;
  isCompleted: boolean;
  bookmarks: string[];
  createdAt?: string;
}

// ── UserProfile ───────────────────────────────────────────────────────────────
export interface ActivityEntry {
  action: string;
  activityType: "solved" | "completed" | "badge" | "attempted" | "enrolled";
  createdAt: string;
}

export interface CalendarDay {
  date: string;
  level: 0 | 1 | 2 | 3;
}

export interface Achievement {
  id: string;
  title: string;
  description?: string;
  achievementType: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface UserProfile {
  _id: string;
  user: string;
  problemsSolved: number;
  currentStreak: number;
  longestStreak: number;
  contestRating: number;
  codingTimeHours: number;
  recentActivity: ActivityEntry[];
  activityCalendar: CalendarDay[];
  achievements: Achievement[];
}

// ── UserProblemStatus ─────────────────────────────────────────────────────────
export interface UserProblemStatus {
  _id: string;
  user: string;
  problem: string;
  status: "solved" | "attempted";
  language: string;
  lastCode: string;
  solvedAt?: string;
}

// ── Judge / Compile output ────────────────────────────────────────────────────
export interface RunOutput {
  status: string;
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  time?: string;
  memory?: number;
  passed?: number;
  total?: number;
  results?: TestResult[];
  error?: string;
}

// ── Resume Analyzer ───────────────────────────────────────────────────────────
export interface ScoreBreakdown {
  formatting: number;
  keywords: number;
  experience: number;
  education: number;
  skills: number;
}

export interface Improvement {
  category: string;
  issue: string;
  suggestion: string;
}

export interface ResumeAnalysis {
  atsScore: number;
  scoreBreakdown: ScoreBreakdown;
  summary: string;
  strengths: string[];
  improvements: Improvement[];
  keywords: { present: string[]; missing: string[] };
  verdict: string;
}

// ── Helper ────────────────────────────────────────────────────────────────────
/** Safely extract an error message from an unknown catch value */
export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "An unexpected error occurred";
}

// ── Alumni Connect ────────────────────────────────────────────────────────────
export interface AlumniProfile {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  batch: string;
  branch: string;
  currentRole: string;
  currentCompany: string;
  domain: string;
  bio: string;
  linkedIn: string;
  skills: string[];
  isVerified: boolean;
  contributionScore: number;
  sessionsCount: number;
  referralsCount: number;
  postsCount: number;
  createdAt?: string;
}

export interface AlumniExperience {
  _id: string;
  alumni: AlumniProfile;
  title: string;
  company: string;
  domain: string;
  content: string;
  tags: string[];
  likes: number;
  readTime: number;
  isPublished: boolean;
  createdAt?: string;
}

export interface AlumniSlot {
  _id: string;
  alumni: AlumniProfile;
  date: string;
  time: string;
  duration: 30 | 60;
  sessionType: "Mentorship" | "Mock Interview" | "Career Guidance";
  isBooked: boolean;
  topic: string;
  createdAt?: string;
}

export interface AlumniReferral {
  _id: string;
  alumni: AlumniProfile;
  company: string;
  role: string;
  jobUrl: string;
  description: string;
  skills: string[];
  location: string;
  deadline?: string;
  applicantsCount: number;
  isActive: boolean;
  createdAt?: string;
}

export interface AlumniQuestion {
  _id: string;
  studentName: string;
  question: string;
  answer: string;
  isAnswered: boolean;
  votes: number;
  createdAt?: string;
}

export interface AlumniAMA {
  _id: string;
  alumni: AlumniProfile;
  title: string;
  description: string;
  scheduledAt?: string;
  isLive: boolean;
  isCompleted: boolean;
  questions: AlumniQuestion[];
  registrationsCount: number;
  createdAt?: string;
}
