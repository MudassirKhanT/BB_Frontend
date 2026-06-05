# BeyondBasic — Comprehensive Context Document

---

## 1. Project Overview

**BeyondBasic** is a full-stack placement-preparation platform for engineering students and freshers targeting tech companies (FAANG, product companies, service companies). It consolidates everything needed for campus placement: structured courses, DSA/SQL problem practice with a real judge, company-specific interview prep, mock exams, competitive contests, hackathons, alumni networking, AI-powered resume analysis, and a placement-roadmap generator.

### Domain
EdTech / Placement Preparation — Indian engineering college audience, but content is universally applicable.

### Architecture Style
- **Monorepo with two independent packages**: `BB_Backend` and `BB_Frontend`.
- Backend: **REST API** (Express 5), no GraphQL, no WebSockets.
- Frontend: **SPA** (React 19 + React Router 7), communicates with backend over HTTP.
- No shared code between packages; frontend types in `src/types/models.ts` mirror backend Mongoose schemas.

### Tech Stack (with versions from package.json)

| Layer | Technology | Version |
|---|---|---|
| **Runtime** | Node.js (ESM mode) | — |
| **Backend framework** | Express | ^5.2.1 |
| **Database** | MongoDB via Mongoose | ^9.2.1 |
| **Auth** | JWT (jsonwebtoken) | ^9.0.3 |
| **Password hashing** | bcryptjs | ^3.0.3 |
| **Validation** | Zod | ^4.3.6 |
| **Logging** | Winston | ^3.19.0 |
| **HTTP logging** | Morgan | ^1.10.1 |
| **Security headers** | Helmet | ^8.1.0 |
| **CORS** | cors | ^2.8.6 |
| **File upload** | Multer | ^2.1.1 |
| **PDF parsing** | pdf-parse / unpdf | ^2.4.5 / ^1.6.1 |
| **Slugs** | slugify | ^1.6.6 |
| **AI — Google** | Gemini 2.5 Flash (via raw HTTPS) | — |
| **AI — Meta/Groq** | Llama-3.3-70b-versatile via Groq SDK | ^1.1.2 |
| **Code judge** | Judge0 CE (public, `ce.judge0.com`) | — |
| **Frontend framework** | React | ^19.2.4 |
| **Build tool** | Vite | ^5.4.11 |
| **Routing** | React Router DOM | ^7.14.0 |
| **Styling** | Tailwind CSS | ^4.2.2 |
| **Icons** | lucide-react | ^1.16.0 |
| **PDF client** | pdfjs-dist | ^5.7.284 |
| **QR** | qrcode | ^1.5.4 |
| **TypeScript (BE)** | typescript | ^5.9.3 |
| **TypeScript (FE)** | typescript | ~6.0.2 |

---

## 2. Directory Structure

```
BB/
├── BB_Backend/                 # Express REST API
│   ├── server.ts               # Entry point; mounts all routers, CORS, global error handler
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example            # MONGO_URI, PORT (minimal — actual .env has more keys)
│   ├── config/
│   │   ├── db.ts               # Mongoose connection
│   │   └── logger.ts           # Winston logger (file + console)
│   ├── middlewares/
│   │   ├── auth.middleware.ts        # protect() — validates JWT, rejects blocked/deleted users
│   │   ├── optionalAuth.middleware.ts# optionalAuth() — attaches user if token present, never rejects
│   │   ├── role.middleware.ts        # restrictTo(...roles) / authorize() — role guard
│   │   └── validate.middleware.ts    # validate(zodSchema) — request body validation
│   ├── utils/
│   │   ├── gemini.ts           # Raw HTTPS wrapper for Google Gemini API
│   │   ├── groq.ts             # Raw HTTPS wrapper for Groq (Llama) API
│   │   ├── generateToken.ts    # JWT sign helper (7d expiry)
│   │   └── judge.ts            # Judge0 CE integration: runCode() + judgeSubmission()
│   ├── models/                 # 30+ Mongoose schemas (see Section 4)
│   ├── routes/                 # One file per resource, wires middleware + controller
│   ├── controllers/            # Business logic; one file per resource
│   └── logs/                   # Winston log output (combined.log, error.log) — gitignored
│
└── BB_Frontend/                # React SPA
    ├── src/
    │   ├── main.tsx            # BrowserRouter + StrictMode root
    │   ├── App.tsx             # All routes declared with React Router <Routes>
    │   ├── lib/
    │   │   └── api.ts          # Typed API client (fetch wrappers, token injection)
    │   ├── types/
    │   │   └── models.ts       # TypeScript interfaces mirroring every Mongoose model
    │   ├── lucide-react.d.ts   # Manual type declarations for lucide-react icons
    │   ├── pages/              # One file per route/page component
    │   ├── components/         # Shared UI components (ChatBot, ScrollToTop, etc.)
    │   └── index.css           # Tailwind entry
    ├── package.json
    └── .env                    # VITE_API_URL, VITE_RAPIDAPI_KEY
```

---

## 3. Core Modules & Components

### Backend Modules

| Module | File(s) | Responsibility |
|---|---|---|
| **Auth** | routes/auth, controllers/auth | Register, login, forgot/reset password |
| **User** | routes/user, controllers/user | Profile CRUD, dashboard stats, admin user management |
| **Courses** | routes/course, controllers/course | Course catalog CRUD, slug generation, publish control |
| **Topics** | routes/topic, controllers/topic | Topics nested under a course; cascading delete to subtopics |
| **Subtopics** | routes/subtopic, controllers/subtopic | Rich content blocks, slug auto-gen, free preview flag |
| **Enrollment** | routes/enrollment, controllers/enrollment | Enroll, track progress %, notes, bookmarks |
| **Problems** | routes/problem, controllers/problem | DSA/SQL problems, POTD, judge submission, user status tracking |
| **Compile** | routes/compile, controllers/compile | Free-run code via Judge0 (no test case comparison) |
| **Companies** | routes/company, controllers/company | Company profiles, prep content, prep questions |
| **Interview Exp.** | routes/interview-experience, controllers/interview-experience | User-submitted interview stories with admin approval workflow |
| **Resources** | routes/resource, controllers/resource | Curated notes, cheat sheets, blogs, company papers |
| **Contests** | routes/contest, controllers/contest | Contest lifecycle, registration, judge submission, ICPC leaderboard |
| **Hackathons** | routes/hackathon, controllers/hackathon | Team registration, PS locking, AI scoring via Gemini |
| **Mock Exams** | routes/mock, controllers/mock | 4-section placement mock tests, one-attempt-per-user, score review |
| **Alumni** | routes/alumni, controllers/alumni | Profiles, experiences, 1:1 slots, referrals, AMA sessions |
| **Roadmap** | routes/roadmap, controllers/roadmap | AI-generated placement roadmap via Gemini |
| **Chatbot** | routes/chatbot, controllers/chatbot | Platform-aware AI chatbot via Gemini |
| **Jobs** | routes/jobs, controllers/jobs | Aggregated job listings from 4 sources (Remotive, Adzuna, JSearch, TheMuse) |
| **Resume** | routes/resume, controllers/resume | AI resume ATS analysis via Gemini |

### Frontend Pages (from App.tsx)

| Route | Page | Description |
|---|---|---|
| `/` | HomePage | Landing page |
| `/signup` | SignupPage | User registration |
| `/login` | LoginPage | Login |
| `/forgot-password` | ForgotPasswordPage | Password reset flow |
| `/dashboard` | Dashboard | Personal learning stats |
| `/practice` | PracticePage | Problem browser (all problems) |
| `/problem-of-the-day` | ProblemOfTheDay | Today's coding + SQL problems |
| `/courses` | CourseCatalog | Course listing |
| `/courses/:slug` | CourseDetail | Course landing page |
| `/learn/:slug` | CourseLearn | In-course learner view |
| `/practice/:courseSlug` | Practice | Problems for a specific course |
| `/problems/:slug` | ProblemSolver | Full problem + code editor |
| `/company-prep` | CompanyPrepPage | Company list |
| `/company-prep/:slug` | CompanyDetailPage | Company overview |
| `/company-prep/:slug/prepare` | CompanyPreparationPage | Prep content + questions |
| `/resources` | ResourcesHubPage | Resource hub |
| `/resources/interview-experiences` | InterviewExperiencesPage | All interview stories |
| `/resources/:type/:slug` | ResourceDetailPage | Single resource |
| `/resources/:type` | ResourceListPage | Resources by type |
| `/how-it-works` | HowItWorksPage | Platform explanation |
| `/resume-analyzer` | ResumeAnalyzerPage | AI resume analysis |
| `/mock-assessments` | MockAssessmentsPage | Exam listing |
| `/mock-assessments/:id` | MockExamPage | Take exam / view result |
| `/contests` | ContestsPage | Contest listing |
| `/contests/:slug` | ContestDetailPage | Contest detail + registration |
| `/contests/:slug/solve/:problemSlug` | ContestSolverPage | In-contest code editor |
| `/hackathon` | HackathonPage | Hackathon listing |
| `/hackathon/:slug` | HackathonPage | Hackathon detail |
| `/hackathon/:slug/submit` | HackathonSubmitPage | Team submission form |
| `/jobs` | JobsPage | Aggregated job listings |
| `/profile` | ProfilePage | User profile editor |
| `/admin` | AdminDashboard | Admin management panel |
| `/roadmap-generator` | RoadmapGeneratorPage | AI roadmap generator |
| `/alumni-connect` | AlumniConnectPage | Alumni profiles, slots, referrals, AMA |

---

## 4. Data Models & Schemas

### User (`models/user.model.ts`)

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `username` | String | Yes | — | 3–20 chars, trimmed |
| `email` | String | Yes | — | unique, lowercase |
| `password` | String | Yes | — | bcrypt hash; `select: false` |
| `role` | String (enum) | No | `"student"` | `student \| admin \| instructor \| alumni` |
| `avatar` | String | No | — | URL |
| `bio` | String | No | — | |
| `college` | String | No | — | |
| `branch` | String | No | — | |
| `cgpa` | Number | No | — | |
| `graduationYear` | Number | No | — | |
| `phone` | String | No | — | |
| `linkedinUrl` | String | No | — | |
| `githubUrl` | String | No | — | |
| `skills` | String[] | No | `[]` | |
| `resumeUrl` | String | No | — | |
| `isBlocked` | Boolean | No | `false` | Blocks login |
| `isDeleted` | Boolean | No | `false` | Soft delete |
| `resetPasswordToken` | String | No | — | SHA-256 hash; `select: false` |
| `resetPasswordExpires` | Date | No | — | 15-minute expiry; `select: false` |
| `createdAt`, `updatedAt` | Date | — | — | timestamps |

---

### UserProfile (`models/userProfile.model.ts`)

One document per user; lazy-created on first dashboard visit.

| Field | Type | Required | Default |
|---|---|---|---|
| `user` | ObjectId → User | Yes | — |
| `problemsSolved` | Number | No | `0` |
| `currentStreak` | Number | No | `0` |
| `longestStreak` | Number | No | `0` |
| `contestRating` | Number | No | `0` |
| `codingTimeHours` | Number | No | `0` |
| `recentActivity` | [ActivitySchema] | No | `[]` |
| `activityCalendar` | [CalendarDaySchema] | No | `[]` |
| `achievements` | [AchievementSchema] | No | `[]` |

**ActivitySchema** (embedded, with timestamps):

| Field | Type | Enum |
|---|---|---|
| `action` | String (required) | — |
| `activityType` | String | `solved \| completed \| badge \| attempted \| enrolled` |

**CalendarDaySchema** (no _id):

| Field | Type | Notes |
|---|---|---|
| `date` | String | `"YYYY-MM-DD"` |
| `level` | Number 0–3 | 0=none, 1=light, 2=medium, 3=heavy |

**AchievementSchema** (no _id):

| Field | Type |
|---|---|
| `id` | String (required) |
| `title` | String (required) |
| `description` | String |
| `achievementType` | String (default `"general"`) |
| `unlocked` | Boolean (default `false`) |
| `unlockedAt` | Date |

---

### Problem (`models/problem.model.ts`)

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `title` | String | Yes | — | |
| `slug` | String | Yes | — | unique |
| `difficulty` | String (enum) | Yes | — | `Easy \| Medium \| Hard` |
| `type` | String (enum) | No | `"coding"` | `coding \| sql` |
| `frequency` | Number | No | `3` | 1–5 scale |
| `description` | String | Yes | — | Markdown |
| `examples` | [ExampleSchema] | No | `[]` | |
| `testCases` | [TestCaseSchema] | No | `[]` | |
| `starterCode` | StarterCodeSchema | No | `{}` | |
| `topicTag` | String | Yes | — | e.g. `"Arrays"` |
| `course` | ObjectId → Course | No | `null` | |
| `companies` | String[] | No | `[]` | |
| `solutionArticle` | String | No | `""` | |
| `leetcodeUrl` | String | No | `""` | |
| `isPublished` | Boolean | No | `true` | |
| `isProblemOfDay` | Boolean | No | `false` | |
| `order` | Number | No | `0` | |

**ExampleSchema** (no _id): `input`, `output`, `explanation` — all String, default `""`.

**TestCaseSchema** (no _id): `input` (String), `expectedOutput` (String), `isHidden` (Boolean, default `false`).

**StarterCodeSchema** (no _id): `python`, `javascript`, `cpp`, `java`, `sql` — all String with language-specific default comments.

---

### UserProblemStatus (`models/userProblemStatus.model.ts`)

Unique index: `{ user, problem }`.

| Field | Type | Required | Default |
|---|---|---|---|
| `user` | ObjectId → User | Yes | — |
| `problem` | ObjectId → Problem | Yes | — |
| `status` | String (enum) | No | `"attempted"` |
| `language` | String | No | `"python"` |
| `lastCode` | String | No | `""` |
| `solvedAt` | Date | No | — |

---

### Course (`models/course.model.ts`)

| Field | Type | Required | Default |
|---|---|---|---|
| `title` | String | Yes | — |
| `slug` | String | Yes | — (unique) |
| `description` | String | Yes | — |
| `shortDescription` | String | No | `""` |
| `coverImageUrl` | String | No | `null` |
| `tags` | String[] | No | `[]` |
| `category` | String | No | `"Programming"` |
| `level` | String (enum) | No | `"Beginner"` |
| `language` | String | No | `"English"` |
| `author` | ObjectId → User | Yes | — |
| `isPublished` | Boolean | No | `false` |
| `views` | Number | No | `0` |
| `price` | Number | No | `0` |
| `totalEnrollments` | Number | No | `0` |
| `rating` | Number | No | `0` |
| `totalRatings` | Number | No | `0` |
| `estimatedDuration` | String | No | `"0 hours"` |
| `whatYouWillLearn` | String[] | No | `[]` |
| `requirements` | String[] | No | `[]` |
| `color` | String | No | `"from-blue-500 to-cyan-500"` |
| `icon` | String | No | `"Code2"` |

---

### Topic (`models/topic.model.ts`)

| Field | Type | Required |
|---|---|---|
| `title` | String | Yes |
| `course` | ObjectId → Course | Yes |
| `order` | Number | Yes |

---

### Subtopic (`models/subtopic.model.ts`)

Unique index: `{ topic, slug }`.

| Field | Type | Required | Default |
|---|---|---|---|
| `title` | String | Yes | — |
| `slug` | String | Yes | — |
| `topic` | ObjectId → Topic | Yes | — |
| `order` | Number | Yes | — |
| `isFreePreview` | Boolean | No | `false` |
| `content` | [ContentBlockSchema] | No | `[]` |
| `estimatedReadTime` | Number | No | `5` |
| `videoUrl` | String | No | `null` |
| `summary` | String | No | `""` |

**ContentBlockSchema** (no _id): `type` (required enum: `heading \| paragraph \| code \| info \| tip \| warning \| success \| keyPoints \| list \| image \| quiz \| divider \| table \| comparison`), `data` (Mixed, required).

---

### Enrollment (`models/enrollment.model.ts`)

Unique index: `{ user, course }`.

| Field | Type | Required | Default |
|---|---|---|---|
| `user` | ObjectId → User | Yes | — |
| `course` | ObjectId → Course | Yes | — |
| `completedSubtopics` | ObjectId[] → Subtopic | No | `[]` |
| `lastAccessedSubtopic` | ObjectId → Subtopic | No | `null` |
| `progress` | Number | No | `0` |
| `isCompleted` | Boolean | No | `false` |
| `notes` | [NoteSchema] | No | `[]` |
| `bookmarks` | ObjectId[] → Subtopic | No | `[]` |

**NoteSchema** (with timestamps): `subtopicId` (ObjectId → Subtopic), `content` (String, required).

---

### Contest (`models/contest.model.ts`)

**Virtual `status`**: `"upcoming"` if `!isStarted`; `"ongoing"` if `isStarted && now <= endTime`; `"ended"` otherwise. `toJSON`/`toObject` include virtuals.

| Field | Type | Required | Default |
|---|---|---|---|
| `title` | String | Yes | — |
| `slug` | String | Yes | — (unique) |
| `description` | String | No | `""` |
| `startTime` | Date | Yes | — |
| `endTime` | Date | Yes | — |
| `problems` | [ContestProblemSchema] | No | `[]` |
| `registrations` | ObjectId[] → User | No | `[]` |
| `type` | String (enum) | No | `"custom"` |
| `banner` | String | No | gradient string |
| `isPublished` | Boolean | No | `false` |
| `isStarted` | Boolean | No | `false` |
| `startedAt` | Date | No | — |
| `totalRegistrations` | Number | No | `0` |

**ContestProblemSchema** (no _id): `problem` (ObjectId → Problem, required), `points` (Number, default 100), `order` (Number, default 0).

---

### ContestSubmission (`models/contest-submission.model.ts`)

| Field | Type | Default |
|---|---|---|
| `contest` | ObjectId → Contest (required) | — |
| `user` | ObjectId → User (required) | — |
| `problem` | ObjectId → Problem (required) | — |
| `code` | String (required) | — |
| `language` | String (required) | — |
| `status` | String enum | `"pending"` |
| `score` | Number | `0` |
| `attemptNumber` | Number | `1` |
| `timeFromStart` | Number | `0` (seconds since contest start) |
| `testResults` | [TestResultSchema] | `[]` |

**TestResultSchema** (no _id): `input`, `expectedOutput`, `actualOutput`, `stderr` (Strings), `passed` (Boolean).

---

### Hackathon (`models/hackathon.model.ts`)

**Virtual `status`**: `"upcoming"` if `!isStarted`; `"active"` if started and `now <= endTime`; `"ended"` otherwise.

| Field | Type | Required | Default |
|---|---|---|---|
| `title` | String | Yes | — |
| `slug` | String | Yes | — (unique) |
| `description` | String | No | `""` |
| `theme` | String | No | `"MERN Stack Application"` |
| `startTime` | Date | Yes | — |
| `endTime` | Date | Yes | — |
| `maxTeamSize` | Number | No | `4` |
| `minTeamSize` | Number | No | `2` |
| `banner` | String | No | gradient string |
| `prizePool` | String | No | `""` |
| `isPublished` | Boolean | No | `false` |
| `isStarted` | Boolean | No | `false` |
| `startedAt` | Date | No | — |

---

### HackathonPS (`models/hackathon-ps.model.ts`)

Problem Statement (PS) for a hackathon. Can be locked by one team.

| Field | Type | Required | Default |
|---|---|---|---|
| `hackathon` | ObjectId → Hackathon | Yes | — |
| `title` | String | Yes | — |
| `description` | String | Yes | — |
| `techStack` | String[] | No | `[]` |
| `difficulty` | String (enum) | No | `"Medium"` |
| `isLocked` | Boolean | No | `false` |
| `lockedByTeam` | ObjectId → HackathonTeam | No | `null` |
| `order` | Number | No | `0` |
| `isPublished` | Boolean | No | `true` |

---

### HackathonTeam (`models/hackathon-team.model.ts`)

Unique index: `{ hackathon, leader }` — one team per user per hackathon.

| Field | Type | Required | Default |
|---|---|---|---|
| `hackathon` | ObjectId → Hackathon | Yes | — |
| `teamName` | String | Yes | — |
| `leader` | ObjectId → User | Yes | — |
| `memberEmails` | String[] | No | `[]` |
| `selectedPS` | ObjectId → HackathonPS | No | `null` |
| `isSubmitted` | Boolean | No | `false` |

---

### HackathonSubmission (`models/hackathon-submission.model.ts`)

| Field | Type | Required | Default |
|---|---|---|---|
| `hackathon` | ObjectId → Hackathon | Yes | — |
| `team` | ObjectId → HackathonTeam | Yes | — |
| `ps` | ObjectId → HackathonPS | Yes | — |
| `githubUrl` | String | Yes | — |
| `zipUrl` | String | No | `""` |
| `aiScore` | Number | No | `0` |
| `aiReview` | String | No | `""` |
| `scoringDetails` | ScoringDetailsSchema | No | `{}` |
| `isScored` | Boolean | No | `false` |

**ScoringDetailsSchema** (no _id): `codeQuality`, `relevance`, `innovation`, `completeness` — all Number, default `0`.

---

### MockExam (`models/mock-exam.model.ts`)

| Field | Type | Required | Default |
|---|---|---|---|
| `title` | String | Yes | — |
| `slug` | String | Yes | — (unique) |
| `description` | String | No | `""` |
| `instructions` | String | No | `""` |
| `duration` | Number | No | `60` (minutes) |
| `banner` | String | No | gradient string |
| `isPublished` | Boolean | No | `false` |
| `totalQuestions` | Number | No | `0` (denormalised) |
| `passingScore` | Number | No | `60` (percentage) |
| `tags` | String[] | No | `[]` |

---

### MockQuestion (`models/mock-question.model.ts`)

| Field | Type | Required | Default |
|---|---|---|---|
| `exam` | ObjectId → MockExam | Yes | — |
| `section` | String (enum) | Yes | — |
| `question` | String | Yes | — |
| `options` | String[4] | No | — (validated: exactly 4) |
| `correctAnswer` | Number 0–3 | Yes | — |
| `explanation` | String | No | `""` |
| `difficulty` | String (enum) | No | `"Medium"` |
| `order` | Number | No | `0` |

Section enum: `aptitude \| communication \| coding \| sql`.

---

### MockAttempt (`models/mock-attempt.model.ts`)

Unique index: `{ user, exam }` — one attempt per user per exam.

| Field | Type | Default |
|---|---|---|
| `user` | ObjectId → User (required) | — |
| `exam` | ObjectId → MockExam (required) | — |
| `answers` | [AnswerSchema] | `[]` |
| `score` | Number | `0` (total correct) |
| `total` | Number | `0` (total questions) |
| `sectionScores` | Object with aptitude/communication/coding/sql SectionScoreSchemas | `{}` |
| `timeTaken` | Number | `0` (seconds) |
| `completedAt` | Date | `Date.now` |

**AnswerSchema** (no _id): `question` (ObjectId → MockQuestion, required), `selected` (Number, default -1 = skipped).

**SectionScoreSchema** (no _id): `correct` (Number, default 0), `total` (Number, default 0).

---

### AlumniProfile (`models/alumni-profile.model.ts`)

| Field | Type | Required | Default |
|---|---|---|---|
| `user` | ObjectId → User | No | — (sparse unique) |
| `name` | String | Yes | — |
| `email` | String | Yes | — |
| `avatar` | String | No | `""` |
| `batch` | String | Yes | — |
| `branch` | String | No | `"CSE"` |
| `currentRole` | String | Yes | — |
| `currentCompany` | String | Yes | — |
| `domain` | String | Yes | — |
| `bio` | String | No | `""` |
| `linkedIn` | String | No | `""` |
| `skills` | String[] | No | `[]` |
| `isVerified` | Boolean | No | `false` |
| `contributionScore` | Number | No | `0` |
| `sessionsCount` | Number | No | `0` |
| `referralsCount` | Number | No | `0` |
| `postsCount` | Number | No | `0` |

---

### AlumniAMA (`models/alumni-ama.model.ts`)

| Field | Type | Required | Default |
|---|---|---|---|
| `alumni` | ObjectId → AlumniProfile | Yes | — |
| `title` | String | Yes | — |
| `description` | String | No | `""` |
| `scheduledAt` | Date | No | — |
| `isLive` | Boolean | No | `false` |
| `isCompleted` | Boolean | No | `false` |
| `questions` | [QuestionSchema] | No | `[]` |
| `registrationsCount` | Number | No | `0` |

**Embedded QuestionSchema** (with timestamps, has _id): `studentName` (String, default `"Anonymous"`), `question` (String, required), `answer` (String, default `""`), `isAnswered` (Boolean, default `false`), `votes` (Number, default `0`).

---

### AlumniExperience (`models/alumni-experience.model.ts`)

| Field | Type | Required | Default |
|---|---|---|---|
| `alumni` | ObjectId → AlumniProfile | Yes | — |
| `title` | String | Yes | — |
| `company` | String | Yes | — |
| `domain` | String | Yes | — |
| `content` | String | Yes | — |
| `tags` | String[] | No | `[]` |
| `likes` | Number | No | `0` |
| `readTime` | Number | No | `5` |
| `isPublished` | Boolean | No | `true` |

---

### AlumniReferral (`models/alumni-referral.model.ts`)

| Field | Type | Required | Default |
|---|---|---|---|
| `alumni` | ObjectId → AlumniProfile | Yes | — |
| `company` | String | Yes | — |
| `role` | String | Yes | — |
| `jobUrl` | String | No | `""` |
| `description` | String | Yes | — |
| `skills` | String[] | No | `[]` |
| `location` | String | No | `"Remote"` |
| `deadline` | Date | No | — |
| `applicantsCount` | Number | No | `0` |
| `isActive` | Boolean | No | `true` |

---

### AlumniSlot (`models/alumni-slot.model.ts`)

| Field | Type | Required | Default |
|---|---|---|---|
| `alumni` | ObjectId → AlumniProfile | Yes | — |
| `date` | String | Yes | — |
| `time` | String | Yes | — |
| `duration` | Number (enum 30\|60) | No | `30` |
| `sessionType` | String (enum) | Yes | — |
| `isBooked` | Boolean | No | `false` |
| `bookedBy` | ObjectId → User | No | `null` |
| `topic` | String | No | `""` |

Session type enum: `Mentorship \| Mock Interview \| Career Guidance`.

---

### Company (`models/company.model.ts`)

| Field | Type | Required | Default |
|---|---|---|---|
| `name` | String | Yes | — |
| `slug` | String | Yes | — (unique) |
| `logo` | String | No | `""` |
| `type` | String (enum) | No | `"Service"` |
| `color` | String | No | `"bg-blue-600"` |
| `badge` | String | No | `""` |
| `badgeColor` | String | No | `"bg-slate-50..."` |
| `website` | String | No | `""` |
| `description` | String | No | `""` |
| `overview` | String | No | `""` |
| `hiringProcess` | String | No | `""` |
| `hiringDetails` | HiringDetailsSchema | No | `{}` |
| `rounds` | [RoundSchema] | No | `[]` |
| `isPublished` | Boolean | No | `false` |
| `order` | Number | No | `0` |

**HiringDetailsSchema** (no _id): `ctc`, `eligibility`, `bond`, `selectionRate` (Strings); `roles`, `locations` (String[]).

**RoundSchema** (no _id): `name` (required), `description`, `duration`, `tips`, `order` (Number).

Company type enum: `Service \| Product \| Startup \| Consulting \| FAANG`.

---

### InterviewExperience (`models/interview-experience.model.ts`)

| Field | Type | Required | Default |
|---|---|---|---|
| `company` | ObjectId → Company | Yes | — |
| `author` | ObjectId → User | Yes | — |
| `authorName` | String | No | `"Anonymous"` |
| `role` | String | Yes | — |
| `year` | Number | Yes | — |
| `experience` | String | Yes | — |
| `result` | String (enum) | No | `"pending"` |
| `rounds` | String[] | No | `[]` |
| `tips` | String | No | `""` |
| `isApproved` | Boolean | No | `false` |
| `likes` | Number | No | `0` |

---

### Resource (`models/resource.model.ts`)

| Field | Type | Required | Default |
|---|---|---|---|
| `title` | String | Yes | — |
| `slug` | String | Yes | — (unique) |
| `type` | String (enum) | Yes | — |
| `description` | String | No | `""` |
| `content` | String | No | `""` (markdown) |
| `coverColor` | String | No | gradient string |
| `tags` | String[] | No | `[]` |
| `category` | String | No | `""` |
| `difficulty` | String (enum) | No | `"Beginner"` |
| `fileUrl` | String | No | `""` |
| `videoUrl` | String | No | `""` |
| `company` | String | No | `""` |
| `readTime` | Number | No | `5` |
| `authorName` | String | No | `"BeyondBasic Team"` |
| `isPublished` | Boolean | No | `true` |
| `order` | Number | No | `0` |
| `views` | Number | No | `0` |
| `likes` | Number | No | `0` |

Type enum: `company-paper \| dsa-note \| cs-fundamental \| blog`.

---

### Roadmap (`models/roadmap.model.ts`)

| Field | Type | Required | Default |
|---|---|---|---|
| `title` | String | Yes | — |
| `slug` | String | Yes | — (unique) |
| `content` | String | Yes | — |
| `coverImageUrl` | String | No | `null` |
| `tags` | String[] | No | `[]` |
| `authors` | ObjectId → User | Yes | — |
| `isPublished` | Boolean | No | `false` |
| `views` | Number | No | `0` |

---

### PrepContent (`models/prep-content.model.ts`)

| Field | Type | Required | Default |
|---|---|---|---|
| `company` | ObjectId → Company | Yes | — |
| `category` | String (enum) | Yes | — |
| `title` | String | Yes | — |
| `content` | String | No | `""` |
| `resources` | [ResourceSchema] | No | `[]` |
| `order` | Number | No | `0` |
| `isPublished` | Boolean | No | `false` |

Category enum: `aptitude \| communication \| dsa \| sql \| lld \| hld`.

**Embedded ResourceSchema** (no _id): `title` (required), `url`, `type` (enum: `article \| video \| pdf \| practice \| book`).

---

### PrepQuestion (`models/prep-question.model.ts`)

| Field | Type | Required | Default |
|---|---|---|---|
| `company` | ObjectId → Company | Yes | — |
| `category` | String (enum) | Yes | — |
| `type` | String (enum) | No | `"theory"` |
| `question` | String | Yes | — |
| `options` | String[] | No | `[]` |
| `answer` | String | No | `""` |
| `solution` | String | No | `""` (markdown) |
| `solutionCode` | String | No | `""` |
| `solutionLanguage` | String (enum) | No | `""` |
| `difficulty` | String (enum) | No | `"Easy"` |
| `tags` | String[] | No | `[]` |
| `order` | Number | No | `0` |
| `isPublished` | Boolean | No | `true` |

---

### Blog (`models/blog.model.ts`)

| Field | Type | Required | Default |
|---|---|---|---|
| `title` | String | Yes | — |
| `slug` | String | Yes | — (unique) |
| `content` | String | Yes | — (markdown) |
| `coverImageUrl` | String | No | `null` |
| `subtopic` | ObjectId → Subtopic | Yes | — (unique — one blog per subtopic) |
| `author` | ObjectId → User | Yes | — |
| `tags` | String[] | No | `[]` |
| `isDraft` | Boolean | No | `false` |
| `views` | Number | No | `0` |
| `likes` | Number | No | `0` |
| `generatedByAI` | Boolean | No | `false` |

---

### BlogComment (`models/blog-comments.model.ts`)

| Field | Type | Required | Default |
|---|---|---|---|
| `blog` | ObjectId → Blog | Yes | — |
| `user` | ObjectId → User | Yes | — |
| `content` | String | Yes | — |
| `parentComment` | ObjectId → Comment | No | `null` (for replies) |
| `likes` | Number | No | `0` |

---

### Review (`models/review.model.ts`)

Unique index: `{ student, course }`.

| Field | Type | Required |
|---|---|---|
| `course` | ObjectId → Course | Yes |
| `student` | ObjectId → User | Yes |
| `rating` | Number 1–5 | Yes |
| `comment` | String | No |

---

### Question (`models/question.model.ts`) — Legacy

Older model using CommonJS `require`. Appears unused by current routes/controllers.

| Field | Type | Notes |
|---|---|---|
| `questionId` | String | unique, indexed |
| `title` | String | — |
| `slug` | String | unique |
| `difficulty` | String (enum) | Easy\|Medium\|Hard |
| `description` | String | — |
| `languagesSupported` | String[] | default JS/Python/Java/C++ |
| `constraints` | String[] | — |
| `examples` | [ExampleSchema] | input/output/explanation (Mixed) |
| `publicTestCases` | [TestCaseSchema] | input/output (Mixed) |
| `privateTestCases` | [TestCaseSchema] | — |
| `tags` | String[] | — |
| `totalSubmissions` | Number | — |
| `totalAccepted` | Number | — |
| `acceptanceRate` | Number | — |
| `isActive` | Boolean | default true |

---

## 5. Configuration & Environment

### Backend (`.env.example` + inferred from controllers)

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | **Yes** | MongoDB connection string (Atlas or local) |
| `PORT` | No | Server port (default `5000`) |
| `JWT_SECRET` | **Yes** | Secret for signing JWTs (used but not in .env.example) |
| `GEMINI_API_KEY` | Conditional | Google Gemini API key. Required for: chatbot, roadmap generator, hackathon AI scoring, resume analysis. Falls back gracefully if missing. |
| `GROQ_API_KEY` | Conditional | Groq API key (Llama). Utility available but no current controller uses it directly. |
| `ADZUNA_APP_ID` | Conditional | Adzuna jobs API ID. Jobs feature degrades gracefully if absent. |
| `ADZUNA_APP_KEY` | Conditional | Adzuna jobs API key. |
| `JSEARCH_API_KEY` | Conditional | RapidAPI JSearch key. Jobs feature degrades gracefully if absent. |
| `NODE_ENV` | No | If `"test"`, Winston logging is silenced. |
| `NODE_TLS_REJECT_UNAUTHORIZED` | — | Hard-coded to `"0"` in server.ts (corporate proxy workaround). |

### Frontend (`.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No | Backend base URL. Default: `http://localhost:5000/api` |
| `VITE_RAPIDAPI_KEY` | Conditional | RapidAPI key for client-side requests (if any). Present in repo. |

### CORS Origins (hardcoded in server.ts)
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000`
- `https://bb-frontend-three.vercel.app` (production frontend on Vercel)

---

## 6. Key Business Logic

### POTD — Deterministic Daily Problem Selection
`getProblemOfTheDay` in `problem.controller.ts`:
1. Fetches all published `coding` problems and all published `sql` problems separately.
2. Computes `hash` = sum of char codes of today's ISO date string (`"YYYY-MM-DD"`).
3. Coding POTD index = `hash % codingProblems.length`.
4. SQL POTD index = `(hash + 1) % sqlProblems.length`.
5. Completely deterministic — everyone sees the same problem each day. Changes only when problems are added/removed.

### isStarted Gating (Contests & Hackathons)
Both `Contest` and `Hackathon` models use an `isStarted` boolean that **must be explicitly set to `true` by an admin** via the `PATCH /:id/start` endpoint. The virtual `status` field computes:
- `"upcoming"` if `!isStarted` (even if `now > startTime`)
- `"ongoing"` / `"active"` if `isStarted && now <= endTime`
- `"ended"` otherwise

This prevents a contest from accidentally going "live" just because the scheduled `startTime` passed — an admin has to consciously start it.

### Problem Submission Flow
1. Client sends `{ language, code }` to `POST /api/problems/:slug/submit`.
2. `protect` middleware validates JWT.
3. Controller fetches all test cases (including hidden ones).
4. `judgeSubmission()` in `utils/judge.ts` iterates test cases sequentially against Judge0 CE:
   - Compilation error → stops immediately, returns `"compile_error"`.
   - TLE → stops immediately, returns `"time_limit_exceeded"`.
   - Runtime error (status 7–12) → stops immediately, returns `"runtime_error"`.
   - Wrong answer → stops immediately, returns `"wrong_answer"`.
   - All pass → returns `"accepted"`.
5. `UserProblemStatus` is upserted (solved/attempted).
6. Response includes `status`, `passedCount`, `totalCount`, and per-test `testResults`.

**Hidden test cases**: When fetching a problem by slug (`GET /api/problems/:slug`), hidden test cases are stripped from the response. Only count (`hiddenTestCaseCount`) is returned. During submission, all test cases are used.

**Problem creation validation**: Admin must provide at least 50 hidden test cases or creation/update is rejected.

**Java normalization**: Any `public class <Name>` in Java code is renamed to `public class Main` before submission to Judge0.

### Contest Submission & Leaderboard (ICPC-style)
- Submissions only accepted when `status === "ongoing"` and user is registered.
- Once a problem is `"accepted"` for a user, further submissions for that problem are rejected.
- Leaderboard ranks by `totalScore DESC`, then `penaltyTime ASC`.
- Penalty = `acceptedAt (seconds) + wrongAttempts × 300`.

### Hackathon PS Locking (Atomic)
When a team selects a problem statement, `findOneAndUpdate` atomically sets `isLocked: true, lockedByTeam: team._id` with the condition `isLocked: false`. If another team races to select the same PS, they receive 409. The team's `selectedPS` is only set after the lock is confirmed.

### Hackathon AI Scoring
`scoreWithAI()` in `hackathon.controller.ts`:
1. Calls Gemini 2.5 Flash with a judge prompt instructing scores in range 7.0–9.5.
2. If `GEMINI_API_KEY` is absent, Gemini fails, or the response can't be parsed, falls back to a deterministic random score in range 7.0–9.5.
3. Scores: `codeQuality`, `relevance`, `innovation`, `completeness`, overall `score`.

### User Dashboard Stats (Lazy Profile Init)
`getDashboardStats`: If `UserProfile` doesn't exist for a user (new user), it is created on-the-fly with default achievements. Global rank is computed by counting documents where `problemsSolved > user.problemsSolved` and adding 1.

### Progress Calculation for Enrollment
`markSubtopicComplete`: Progress = `Math.round((completedSubtopics.length / totalSubtopics) * 100)`. `isCompleted` = `progress === 100`. Automatically sets `lastAccessedSubtopic` on every mark.

### Alumni Contribution Score
Each alumni action increments `contributionScore`:
- Posting an experience: +10
- Creating a slot: +5
- Posting a referral: +15

### Job Aggregation Caching
Jobs are fetched from up to 4 external APIs (`Remotive`, `Adzuna`, `JSearch`, `TheMuse`) in parallel. Results are deduplicated by `title|company` key and cached in-memory for 30 minutes using a simple `Map<string, { data, expiresAt }>`.

### Auth — Forgot/Reset Password (No Email Required)
The 6-digit `resetToken` is returned directly in the API response. The SHA-256 hash is stored in the database. This is explicitly noted as a dev/demo pattern; a production system would email the token instead.

---

## 7. External Dependencies & Integrations

| Service | Used In | Notes |
|---|---|---|
| **Google Gemini 2.5 Flash** | chatbot, roadmap generator, hackathon AI scoring, resume analysis | Raw HTTPS via `utils/gemini.ts`. No SDK. Requires `GEMINI_API_KEY`. |
| **Groq (Llama-3.3-70b)** | `utils/groq.ts` (utility exists but no controller currently calls it) | Raw HTTPS wrapper. Requires `GROQ_API_KEY`. |
| **Judge0 CE** (`ce.judge0.com`) | `utils/judge.ts`, `controllers/compile.controller.ts` | Public free instance. No API key. Languages: Python 3.8.1 (id 71), JavaScript/Node 12 (id 63), C++ GCC 9.2 (id 54), Java OpenJDK 13 (id 62), C GCC 9.2 (id 50), MySQL 8.0 (id 82). Limits: 10s CPU, 256MB RAM. SSL verification disabled globally. |
| **MongoDB Atlas** | All DB operations | Via Mongoose 9. URI from `MONGO_URI` env var. |
| **Remotive API** | jobs controller | Free, no key. `https://remotive.com/api/remote-jobs` |
| **Adzuna API** | jobs controller | Paid. Requires `ADZUNA_APP_ID` + `ADZUNA_APP_KEY`. India jobs. |
| **JSearch (RapidAPI)** | jobs controller | Paid. Requires `JSEARCH_API_KEY`. |
| **The Muse API** | jobs controller | Free, no key. `https://www.themuse.com/api/public/jobs` |

---

## 8. Authentication & Authorization

### JWT Flow
1. `POST /api/auth/register` or `/login` → server calls `generateToken(userId)` → signs JWT with `JWT_SECRET`, 7-day expiry.
2. Token returned in response body as `{ token }`.
3. Frontend stores token in `localStorage` and attaches it as `Authorization: Bearer <token>` on all subsequent requests.
4. Backend `protect` middleware: extracts Bearer token → `jwt.verify(token, JWT_SECRET)` → `User.findById(decoded.id)` → rejects if user is `isBlocked` or `isDeleted`.

### Middleware Chain

```
protect → (restrictTo / authorize)
```

- `protect` (`middlewares/auth.middleware.ts`): Mandatory auth. Attaches `req.user`. Returns 401 if no/invalid token or disabled user.
- `optionalAuth` (`middlewares/optionalAuth.middleware.ts`): Soft auth — attaches `req.user` if token is present and valid, never rejects. Used for public endpoints that personalize for logged-in users (e.g., problem status overlay).
- `restrictTo(...roles)` (`middlewares/role.middleware.ts`): Role guard. Returns 403 if `req.user.role` not in allowed list. Alias: `authorize`.

### Roles

| Role | Can do |
|---|---|
| `student` (default) | Browse public content, enroll in courses, solve problems, submit contest entries, register for hackathons, take mock exams, submit interview experiences, book alumni slots, apply for referrals |
| `instructor` | All student permissions + create/update/delete courses, topics, subtopics |
| `admin` | All permissions + manage all resources, publish/unpublish, start contests/hackathons, approve interview experiences, manage users (block/unblock/role change) |
| `alumni` | All student permissions + create experiences/slots/referrals/AMAs, view own alumni profile |

### Implicit Permission in Course Update
`updateCourse` checks `course.author.toString() === req.user._id.toString() || req.user.role === "admin"`. Instructors can only update their own courses.

---

## 9. Error Handling Strategy

### Pattern
All controllers follow `try/catch` blocks. Errors are returned as:
```json
{ "message": "<human-readable error string>" }
```
With appropriate HTTP status codes (400, 401, 403, 404, 409, 500, 503).

### Global Error Handler (server.ts)
```typescript
app.use((err, _req, res, _next) => {
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});
```
Catches any errors passed via `next(err)` or thrown synchronously in Express middleware.

### Validation Middleware
`validate(zodSchema)` catches Zod parse errors and returns 400 with `{ message: "Validation failed", errors: err.errors }`.

### Frontend Error Handling
`src/lib/api.ts` `handleResponse` reads non-ok responses, attempts `JSON.parse` to extract `.message`, throws an `Error`. Page components catch this in their own try/catch or `.catch()` handlers.

---

## 10. Testing Strategy

No test files were found in the project. There is no `jest.config.*`, `vitest.config.*`, `*.test.ts`, or `*.spec.ts` anywhere in either package. The only reference to testing is `process.env.NODE_ENV === "test"` in `logger.ts` to silence Winston logs.

**Recommendation for new developers**: Set up Vitest (frontend) and Jest/Supertest (backend). Priority areas: judge utility, POTD selection, contest leaderboard scoring, enrollment progress calculation.

---

## 11. Build, Run & Deployment

### Backend (`BB_Backend`)

```bash
# Install dependencies
npm install

# Development (nodemon + ts-node)
npm run dev

# Production start (tsx — runs TypeScript directly)
npm start

# Type-check only (no emit)
npm run build

# Seed the database
npm run seed          # generic seed
npm run seed:sql      # SQL problems only
npm run seed:all      # all data (uses --esm flag)

# Lint / format
npm run lint
npm run format
```

**Requirements**: Node.js, MongoDB URI in `.env` (`MONGO_URI`), `JWT_SECRET` in `.env`.

### Frontend (`BB_Frontend`)

```bash
# Install dependencies
npm install

# Development server (Vite, port 5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

**Environment**: Create `.env` with `VITE_API_URL=http://localhost:5000/api` for local dev.

### Local Full-Stack Setup

1. Start MongoDB (local or Atlas).
2. Copy `BB_Backend/.env.example` to `BB_Backend/.env`, fill `MONGO_URI`, `JWT_SECRET`, optionally `GEMINI_API_KEY`.
3. `cd BB_Backend && npm install && npm run dev` → API at `http://localhost:5000`.
4. `cd BB_Frontend && npm install && npm run dev` → App at `http://localhost:5173`.

### Production Deployment

- **Frontend**: Deployed to Vercel (`https://bb-frontend-three.vercel.app`). Vite SPA build.
- **Backend**: No `render.yaml` found. Likely deployed to a Node.js host (Render, Railway, or similar). The `npm start` script uses `npx tsx server.ts` (no compile step needed — tsx runs TS directly). `PORT` env var controls the listening port.

### SSL Note
`process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"` is set at the top of `server.ts` to bypass SSL certificate validation. This is a known workaround for corporate proxy environments. **Remove this line before any production deployment** to restore proper TLS validation.
