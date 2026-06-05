# BeyondBasic — Complete API Documentation

---

## Global Reference

### Base URL
```
http://localhost:5000/api         (local dev)
https://<backend-host>/api        (production)
```

### Authentication
All protected endpoints require a Bearer JWT in the `Authorization` header:
```
Authorization: Bearer <token>
```
Tokens are obtained from `/auth/login` or `/auth/register`. They expire after **7 days**.

### Common Headers
```
Content-Type: application/json
Authorization: Bearer <token>   (required endpoints only)
```

### Shared Error Response Format
```json
{ "message": "Human-readable error string" }
```

| Status | Meaning |
|---|---|
| 400 | Bad request / validation error |
| 401 | Not authenticated (missing/invalid token, blocked/deleted user) |
| 403 | Authenticated but insufficient role permissions |
| 404 | Resource not found |
| 409 | Conflict (duplicate slug, already registered, etc.) |
| 500 | Internal server error |
| 503 | External service (e.g. Gemini) not configured |

### Role Hierarchy
`student` < `instructor` < `admin` (alumna is a parallel role, not a superset of student)

---

## Auth

### POST /auth/register
**Description**: Create a new user account. If `role` is `"alumni"`, an `AlumniProfile` document is also created automatically.

**Auth**: Public

**Request Body**:
| Field | Type | Required | Notes |
|---|---|---|---|
| `username` | string | Yes | 3–20 chars |
| `email` | string | Yes | Lowercased, must be unique |
| `password` | string | Yes | Stored as bcrypt hash (salt 10) |
| `role` | string | No | Only `"alumni"` is honoured; anything else → `"student"` |
| `currentRole` | string | No | Alumni only — default `"Software Engineer"` |
| `currentCompany` | string | No | Alumni only |
| `batch` | string | No | Alumni only |
| `branch` | string | No | Alumni only — default `"CSE"` |
| `domain` | string | No | Alumni only — default `"Software Engineering"` |
| `bio` | string | No | Alumni only |

**Response 201**:
```json
{
  "message": "User registered successfully",
  "token": "<jwt>",
  "user": { "id": "...", "username": "...", "email": "...", "role": "student" }
}
```

**Error Cases**: 400 if missing fields; 400 if email already exists; 500 on DB error.

**Side Effects**: Creates `User` document; creates `AlumniProfile` if role is alumni.

**Handler**: `controllers/auth.controller.ts::register`

---

### POST /auth/login
**Description**: Authenticate and receive a JWT.

**Auth**: Public

**Request Body**:
| Field | Type | Required |
|---|---|---|
| `email` | string | Yes |
| `password` | string | Yes |

**Response 200**:
```json
{
  "message": "Login successful",
  "token": "<jwt>",
  "user": { "id": "...", "username": "...", "email": "...", "role": "..." }
}
```

**Error Cases**: 400 missing fields; 401 invalid credentials; 403 blocked/deleted account.

**Handler**: `controllers/auth.controller.ts::login`

---

### POST /auth/forgot-password
**Description**: Generate a 6-digit password reset token. Token is returned directly in the response (no email sent — demo mode).

**Auth**: Public

**Request Body**:
| Field | Type | Required |
|---|---|---|
| `email` | string | Yes |

**Response 200** (always 200 to prevent email enumeration):
```json
{
  "message": "Password reset token generated successfully.",
  "resetToken": "123456",
  "expiresIn": "15 minutes"
}
```

If email is not found, returns 200 with generic message and no `resetToken`.

**Side Effects**: Saves SHA-256 hash of token and 15-minute expiry to `User.resetPasswordToken / resetPasswordExpires`.

**Handler**: `controllers/auth.controller.ts::forgotPassword`

---

### POST /auth/reset-password
**Description**: Reset user password using the 6-digit token. On success, returns a fresh JWT.

**Auth**: Public

**Request Body**:
| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | Yes | |
| `resetToken` | string | Yes | 6-digit code |
| `newPassword` | string | Yes | Min 6 chars |

**Response 200**:
```json
{
  "message": "Password reset successful! You are now logged in.",
  "token": "<jwt>",
  "user": { ... }
}
```

**Error Cases**: 400 missing fields; 400 password too short; 400 invalid/expired token.

**Side Effects**: Updates `User.password`; clears `resetPasswordToken` and `resetPasswordExpires`.

**Handler**: `controllers/auth.controller.ts::resetPassword`

---

## Users

### GET /user/profile
**Description**: Get the authenticated user's full profile.

**Auth**: Bearer JWT required

**Response 200**: Full `User` document (password excluded by schema `select: false`).

**Handler**: `controllers/user.controller.ts::getProfile`

---

### PUT /user/profile
**Description**: Update the authenticated user's profile fields.

**Auth**: Bearer JWT required

**Request Body** (all optional):
| Field | Type |
|---|---|
| `username` | string |
| `bio` | string |
| `avatar` | string (URL) |
| `college` | string |
| `branch` | string |
| `cgpa` | number |
| `graduationYear` | number |
| `phone` | string |
| `linkedinUrl` | string |
| `githubUrl` | string |
| `skills` | string[] |
| `resumeUrl` | string |

**Response 200**: `{ "message": "Profile updated successfully", "user": { ... } }`

**Handler**: `controllers/user.controller.ts::updateProfile`

---

### GET /user/dashboard-stats
**Description**: Return profile stats, enrolled courses, recent activity, activity calendar, and achievements for the authenticated user. Creates a `UserProfile` document if one does not exist (lazy init).

**Auth**: Bearer JWT required

**Response 200**:
```json
{
  "stats": {
    "problemsSolved": 0,
    "currentStreak": 0,
    "longestStreak": 0,
    "contestRating": 0,
    "codingTimeHours": 0,
    "globalRank": 1
  },
  "enrollments": [
    {
      "course": { "_id": "...", "title": "...", "slug": "...", "color": "...", "icon": "..." },
      "progress": 0,
      "completedSubtopics": 0,
      "totalSubtopics": 10,
      "lastLesson": "Arrays Intro",
      "enrollmentId": "..."
    }
  ],
  "recentActivity": [ { "action": "...", "activityType": "solved", "createdAt": "..." } ],
  "activityCalendar": [ { "date": "2025-06-01", "level": 2 } ],
  "achievements": [ { "id": "first_blood", "title": "...", "unlocked": false } ]
}
```

**Handler**: `controllers/user.controller.ts::getDashboardStats`

---

### DELETE /user/delete
**Description**: Soft-delete the authenticated user's account (`isDeleted: true`). The user will be blocked from logging in.

**Auth**: Bearer JWT required

**Response 200**: `{ "message": "Account deleted" }`

**Handler**: `controllers/user.controller.ts::softDeleteUser`

---

### GET /user/admin/all
**Description**: List all non-deleted users (admin view).

**Auth**: Bearer JWT + `admin` role

**Response 200**: Array of `User` objects (password/reset fields excluded), sorted newest first.

**Handler**: `controllers/user.controller.ts::getAllUsersAdmin`

---

### PATCH /user/block/:id
**Description**: Block a user (sets `isBlocked: true`).

**Auth**: Bearer JWT + `admin` role

**Path Params**: `id` — User ObjectId

**Response 200**: `{ "message": "User blocked" }`

**Handler**: Inline in `routes/user.routes.ts`

---

### PATCH /user/unblock/:id
**Description**: Unblock a user (sets `isBlocked: false`).

**Auth**: Bearer JWT + `admin` role

**Path Params**: `id` — User ObjectId

**Response 200**: `{ "message": "User unblocked" }`

**Handler**: Inline in `routes/user.routes.ts`

---

### PATCH /user/role/:id
**Description**: Change a user's role.

**Auth**: Bearer JWT + `admin` role

**Path Params**: `id` — User ObjectId

**Request Body**:
| Field | Type | Required | Notes |
|---|---|---|---|
| `role` | string | Yes | Must be `student \| admin \| instructor` |

**Response 200**: `{ "message": "Role updated", "user": { ... } }`

**Error Cases**: 400 if invalid role.

**Handler**: Inline in `routes/user.routes.ts`

---

## Problems

### GET /problems/admin/all
**Description**: List all problems (including unpublished) for admin management.

**Auth**: Bearer JWT + `admin` role

**Response 200**: Array of all `Problem` documents populated with `course.title/slug`, sorted newest first.

**Handler**: `controllers/problem.controller.ts::getAllProblemsAdmin`

---

### GET /problems/potd
**Description**: Get today's Problem of the Day (deterministic daily selection — one coding + one SQL problem).

**Auth**: Optional (provides `userStatus` if authenticated)

**Response 200**:
```json
{
  "codingProblem": { /* full Problem document */ },
  "sqlProblem": { /* full Problem document */ },
  "date": "2025-06-05"
}
```

**Business Logic**: Hash = sum of char codes of today's date string. Coding index = `hash % count`. SQL index = `(hash+1) % count`.

**Handler**: `controllers/problem.controller.ts::getProblemOfTheDay`

---

### GET /problems/all
**Description**: Get all published problems grouped by `topicTag`. Supports filtering and user status overlay.

**Auth**: Optional

**Query Params**:
| Param | Type | Required | Notes |
|---|---|---|---|
| `company` | string | No | Case-insensitive regex match on `companies[]` |
| `type` | string | No | `"sql"` or `"dsa"` |

**Response 200**:
```json
{
  "topics": [
    {
      "topic": "Arrays",
      "solved": 3,
      "total": 10,
      "problems": [ { /* Problem fields */ , "userStatus": "solved" } ]
    }
  ]
}
```

**Handler**: `controllers/problem.controller.ts::getAllProblems`

---

### GET /problems/course/:courseSlug
**Description**: Get all published problems for a specific course, grouped by `topicTag`.

**Auth**: Optional

**Path Params**: `courseSlug` — Course slug

**Response 200**: Same shape as `/problems/all` but filtered to the given course.

**Handler**: `controllers/problem.controller.ts::getProblemsByCourse`

---

### GET /problems/:slug
**Description**: Get a single published problem by slug. Hidden test cases are stripped; only visible test cases and counts are returned.

**Auth**: Optional (provides `userStatus` if authenticated)

**Path Params**: `slug` — Problem slug

**Response 200**:
```json
{
  /* All Problem fields */,
  "testCases": [ /* only visible (non-hidden) test cases */ ],
  "hiddenTestCaseCount": 52,
  "totalTestCaseCount": 55,
  "userStatus": "solved"
}
```

**Handler**: `controllers/problem.controller.ts::getProblemBySlug`

---

### POST /problems/:slug/submit
**Description**: Submit code for a problem. Runs against all test cases (including hidden) via Judge0 CE and updates `UserProblemStatus`.

**Auth**: Bearer JWT required

**Path Params**: `slug` — Problem slug

**Request Body**:
| Field | Type | Required |
|---|---|---|
| `language` | string | Yes — `python \| javascript \| cpp \| java \| c \| sql` |
| `code` | string | Yes |

**Response 200**:
```json
{
  "status": "accepted",
  "passedCount": 55,
  "totalCount": 55,
  "testResults": [ { "input": "...", "expectedOutput": "...", "actualOutput": "...", "passed": true, "stderr": "" } ],
  "message": "All test cases passed!"
}
```

**Side Effects**: Upserts `UserProblemStatus` document.

**Handler**: `controllers/problem.controller.ts::submitProblem`

---

### POST /problems/:slug/status
**Description**: Manually update the user's status for a problem (e.g., mark as attempted after running custom tests).

**Auth**: Bearer JWT required

**Path Params**: `slug` — Problem slug

**Request Body**:
| Field | Type | Required | Notes |
|---|---|---|---|
| `status` | string | Yes | `"solved"` or `"attempted"` |
| `language` | string | No | Default `"python"` |
| `code` | string | No | |

**Response 200**: `{ "message": "Status updated", "status": "attempted" }`

**Side Effects**: Upserts `UserProblemStatus`.

**Handler**: `controllers/problem.controller.ts::updateProblemStatus`

---

### POST /problems
**Description**: Create a new problem.

**Auth**: Bearer JWT + `admin` role

**Request Body**: All `Problem` schema fields. `testCases` must include at least 50 hidden test cases (`isHidden: true`).

**Response 201**: Created `Problem` document.

**Error Cases**: 400 if fewer than 50 hidden test cases.

**Handler**: `controllers/problem.controller.ts::createProblem`

---

### PATCH /problems/:id
**Description**: Update a problem by ID.

**Auth**: Bearer JWT + `admin` role

**Path Params**: `id` — Problem ObjectId

**Request Body**: Any subset of `Problem` fields. If `testCases` is included, hidden test case minimum (50) is re-validated.

**Response 200**: Updated `Problem` document.

**Handler**: `controllers/problem.controller.ts::updateProblem`

---

### DELETE /problems/:id
**Description**: Delete a problem and all associated `UserProblemStatus` records.

**Auth**: Bearer JWT + `admin` role

**Path Params**: `id` — Problem ObjectId

**Response 200**: `{ "message": "Problem deleted" }`

**Side Effects**: Cascading delete of `UserProblemStatus` documents for this problem.

**Handler**: `controllers/problem.controller.ts::deleteProblem`

---

## Courses

### GET /course
**Description**: List all published courses.

**Auth**: Public

**Response 200**: Array of `Course` documents with `author.username/email` populated.

**Handler**: `controllers/course.controller.ts::getCourses`

---

### GET /course/admin/all
**Description**: List all courses (including unpublished) for admin management.

**Auth**: Bearer JWT + `admin` role

**Response 200**: All courses sorted newest first.

**Handler**: `controllers/course.controller.ts::getAllCoursesAdmin`

---

### GET /course/:slug
**Description**: Get a single published course by slug. Increments `views` counter by 1.

**Auth**: Public

**Path Params**: `slug`

**Response 200**: Full `Course` document with `author` populated.

**Side Effects**: `course.views += 1`.

**Handler**: `controllers/course.controller.ts::getCourseBySlug`

---

### POST /course
**Description**: Create a new course. Slug is auto-generated from title using `slugify`.

**Auth**: Bearer JWT + `instructor` or `admin` role

**Request Body** (validated by Zod schema `createCourseSchema`):
| Field | Type | Required |
|---|---|---|
| `title` | string | Yes |
| `description` | string | Yes |
| `shortDescription` | string | No |
| `coverImageUrl` | string | No |
| `tags` | string[] | No |
| `price` | number | No |
| `category` | string | No |
| `level` | string | No |
| `whatYouWillLearn` | string[] | No |
| `requirements` | string[] | No |
| `color` | string | No |
| `icon` | string | No |

**Response 201**: Created `Course` document.

**Error Cases**: 400 if slug already exists.

**Handler**: `controllers/course.controller.ts::createCourse`

---

### PATCH /course/:id
**Description**: Update a course. Only the course author or an admin may update.

**Auth**: Bearer JWT (must be course author or `admin`)

**Path Params**: `id` — Course ObjectId

**Request Body** (validated by Zod `updateCourseSchema`): Any `Course` fields.

**Response 200**: Updated `Course` document.

**Error Cases**: 403 if not author and not admin.

**Handler**: `controllers/course.controller.ts::updateCourse`

---

### PATCH /course/:id/publish
**Description**: Publish a course (sets `isPublished: true`).

**Auth**: Bearer JWT + `instructor` or `admin` role

**Path Params**: `id` — Course ObjectId

**Response 200**: `{ "message": "Course published" }`

**Handler**: `controllers/course.controller.ts::publishCourse`

---

### DELETE /course/:id
**Description**: Delete a course.

**Auth**: Bearer JWT + `admin` role

**Path Params**: `id` — Course ObjectId

**Response 200**: `{ "message": "Course deleted" }`

**Handler**: `controllers/course.controller.ts::deleteCourse`

---

## Topics

### GET /topic/course/:courseSlug
**Description**: Get all topics for a course sorted by `order`, each with its subtopics (content field excluded).

**Auth**: Public

**Path Params**: `courseSlug`

**Response 200**: Array of topic objects each with `subtopics: [...]`.

**Handler**: `controllers/topic.controller.ts::getTopicsByCourse`

---

### POST /topic
**Description**: Create a topic within a course.

**Auth**: Bearer JWT + `instructor` or `admin` role

**Request Body**:
| Field | Type | Required |
|---|---|---|
| `title` | string | Yes |
| `courseId` | string (ObjectId) | Yes |
| `order` | number | Yes |

**Response 201**: Created `Topic` document.

**Handler**: `controllers/topic.controller.ts::createTopic`

---

### PATCH /topic/:id
**Description**: Update a topic.

**Auth**: Bearer JWT + `instructor` or `admin` role

**Path Params**: `id` — Topic ObjectId

**Request Body**: Any `Topic` fields.

**Response 200**: Updated `Topic`.

**Handler**: `controllers/topic.controller.ts::updateTopic`

---

### DELETE /topic/:id
**Description**: Delete a topic and cascade-delete all its subtopics.

**Auth**: Bearer JWT + `instructor` or `admin` role

**Path Params**: `id` — Topic ObjectId

**Response 200**: `{ "message": "Topic deleted" }`

**Side Effects**: Deletes all `Subtopic` documents where `topic === id`.

**Handler**: `controllers/topic.controller.ts::deleteTopic`

---

## Subtopics

### GET /subtopic/topic/:topicId
**Description**: Get all subtopics for a topic, sorted by `order`. Content blocks excluded.

**Auth**: Public

**Path Params**: `topicId`

**Response 200**: Array of subtopics (no `content` field).

**Handler**: `controllers/subtopic.controller.ts::getSubtopicsByTopic`

---

### GET /subtopic/topic/:topicId/slug/:slug
**Description**: Get a subtopic by topic ID and slug (with full content blocks).

**Auth**: Public

**Path Params**: `topicId`, `slug`

**Response 200**: Full `Subtopic` document with `topic.title/course` populated.

**Handler**: `controllers/subtopic.controller.ts::getSubtopicBySlug`

---

### GET /subtopic/:id
**Description**: Get a single subtopic by ID with full content blocks.

**Auth**: Public

**Path Params**: `id` — Subtopic ObjectId

**Response 200**: Full `Subtopic` with `topic.title/course` populated.

**Handler**: `controllers/subtopic.controller.ts::getSubtopicById`

---

### POST /subtopic
**Description**: Create a subtopic. Slug is auto-generated from title.

**Auth**: Bearer JWT + `instructor` or `admin` role

**Request Body**:
| Field | Type | Required | Default |
|---|---|---|---|
| `title` | string | Yes | — |
| `topicId` | string (ObjectId) | Yes | — |
| `order` | number | Yes | — |
| `isFreePreview` | boolean | No | `false` |
| `content` | ContentBlock[] | No | `[]` |
| `estimatedReadTime` | number | No | `5` |
| `videoUrl` | string | No | `null` |
| `summary` | string | No | `""` |

**Response 201**: Created `Subtopic`.

**Handler**: `controllers/subtopic.controller.ts::createSubtopic`

---

### PATCH /subtopic/:id
**Description**: Update a subtopic.

**Auth**: Bearer JWT + `instructor` or `admin` role

**Path Params**: `id` — Subtopic ObjectId

**Response 200**: Updated `Subtopic`.

**Handler**: `controllers/subtopic.controller.ts::updateSubtopic`

---

### DELETE /subtopic/:id
**Description**: Delete a subtopic.

**Auth**: Bearer JWT + `instructor` or `admin` role

**Path Params**: `id` — Subtopic ObjectId

**Response 200**: `{ "message": "Subtopic deleted" }`

**Handler**: `controllers/subtopic.controller.ts::deleteSubtopic`

---

## Enrollments

All enrollment routes require authentication (`router.use(protect)` applied globally).

### POST /enrollment
**Description**: Enroll the authenticated user in a course. Sets `lastAccessedSubtopic` to the first subtopic automatically. Increments `course.totalEnrollments`.

**Auth**: Bearer JWT required

**Request Body**:
| Field | Type | Required |
|---|---|---|
| `courseId` | string (ObjectId) | Yes |

**Response 201**: Created `Enrollment` document.

**Error Cases**: 400 if already enrolled; 404 if course not found.

**Side Effects**: Creates `Enrollment`; increments `Course.totalEnrollments`.

**Handler**: `controllers/enrollment.controller.ts::enrollInCourse`

---

### GET /enrollment
**Description**: Get all enrollments for the authenticated user with course details.

**Auth**: Bearer JWT required

**Response 200**: Array of `Enrollment` documents with `course` (title, slug, coverImageUrl, color, icon, estimatedDuration, level, totalEnrollments, rating) populated.

**Handler**: `controllers/enrollment.controller.ts::getMyEnrollments`

---

### GET /enrollment/course/:courseSlug
**Description**: Get the authenticated user's enrollment for a specific course.

**Auth**: Bearer JWT required

**Path Params**: `courseSlug`

**Response 200**: `Enrollment` with `lastAccessedSubtopic.title/slug` populated.

**Error Cases**: 404 if not enrolled.

**Handler**: `controllers/enrollment.controller.ts::getEnrollmentByCourse`

---

### POST /enrollment/course/:courseSlug/complete/:subtopicId
**Description**: Mark a subtopic as completed for the authenticated user. Recalculates `progress` percentage and sets `isCompleted` if 100%.

**Auth**: Bearer JWT required

**Path Params**: `courseSlug`, `subtopicId`

**Response 200**:
```json
{
  "progress": 75,
  "completedSubtopics": ["..."],
  "isCompleted": false
}
```

**Side Effects**: Idempotent addition to `completedSubtopics`; updates `lastAccessedSubtopic`.

**Handler**: `controllers/enrollment.controller.ts::markSubtopicComplete`

---

### POST /enrollment/course/:courseSlug/note
**Description**: Add a note to the enrollment for a specific subtopic.

**Auth**: Bearer JWT required

**Path Params**: `courseSlug`

**Request Body**:
| Field | Type | Required |
|---|---|---|
| `subtopicId` | string (ObjectId) | Yes |
| `content` | string | Yes |

**Response 200**: `{ "notes": [...] }`

**Handler**: `controllers/enrollment.controller.ts::saveNote`

---

### POST /enrollment/course/:courseSlug/bookmark/:subtopicId
**Description**: Toggle bookmark on a subtopic. Adds if not bookmarked; removes if bookmarked.

**Auth**: Bearer JWT required

**Path Params**: `courseSlug`, `subtopicId`

**Response 200**: `{ "bookmarks": ["..."] }`

**Handler**: `controllers/enrollment.controller.ts::toggleBookmark`

---

## Contests

### GET /contest
**Description**: List all published contests sorted by `startTime` DESC. Includes virtual `status` and `problemCount`. Registration list excluded.

**Auth**: Optional

**Response 200**: Array of contest objects with `status` (`upcoming | ongoing | ended`) and `problemCount`.

**Handler**: `controllers/contest.controller.ts::getContests`

---

### GET /contest/admin/all
**Description**: List all contests (published and unpublished) for admin.

**Auth**: Bearer JWT + `admin` role

**Response 200**: All contests (no registration list), with `problemCount`.

**Handler**: `controllers/contest.controller.ts::getAdminContests`

---

### GET /contest/:slug
**Description**: Get a single published contest with full problem details. Problem visibility depends on `status` and user role:
- `upcoming` + non-admin: only `_id`, `title`, `slug`, `difficulty` returned per problem (no description/test cases).
- `ongoing` + non-admin: problem details shown but hidden test cases stripped.
- admin: full data always.

**Auth**: Optional (provides `isRegistered` if authenticated)

**Path Params**: `slug`

**Response 200**:
```json
{
  /* Contest fields */,
  "status": "ongoing",
  "isRegistered": true,
  "problemCount": 3,
  "problems": [ { "problem": { /* Problem */ }, "points": 100, "order": 0 } ]
}
```

**Handler**: `controllers/contest.controller.ts::getContestBySlug`

---

### GET /contest/:slug/leaderboard
**Description**: Get the contest leaderboard (ICPC-style: highest score first, then lowest penalty time).

**Auth**: Public

**Path Params**: `slug`

**Response 200**:
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "...",
      "username": "...",
      "totalScore": 300,
      "penaltyTime": 1800,
      "solvedCount": 3,
      "problems": { "<problemId>": { "accepted": true, "attempts": 1, "acceptedAt": 600 } }
    }
  ],
  "contestProblems": [ ... ]
}
```

**Handler**: `controllers/contest.controller.ts::getLeaderboard`

---

### POST /contest/:slug/register
**Description**: Register the authenticated user for a contest. Rejected if contest has ended.

**Auth**: Bearer JWT required

**Path Params**: `slug`

**Response 200**: `{ "message": "Registered successfully" }`

**Error Cases**: 400 if already registered or contest ended.

**Side Effects**: Pushes user to `contest.registrations`; increments `totalRegistrations`.

**Handler**: `controllers/contest.controller.ts::registerForContest`

---

### POST /contest/:slug/submit/:problemSlug
**Description**: Submit code for a contest problem. Only accepted while contest is `ongoing` and user is registered. Once a problem is accepted, further submissions are rejected.

**Auth**: Bearer JWT required

**Path Params**: `slug` (contest), `problemSlug` (problem)

**Request Body**:
| Field | Type | Required |
|---|---|---|
| `code` | string | Yes |
| `language` | string | Yes |

**Response 200**:
```json
{
  "status": "accepted",
  "score": 100,
  "attemptNumber": 1,
  "testResults": [ /* up to 5 */ ],
  "submissionId": "..."
}
```

**Error Cases**: 400 if contest not ongoing; 403 if not registered; 400 if already accepted.

**Side Effects**: Creates `ContestSubmission` document.

**Handler**: `controllers/contest.controller.ts::submitSolution`

---

### GET /contest/:slug/my-submissions
**Description**: Get all of the authenticated user's submissions for a contest.

**Auth**: Bearer JWT required

**Path Params**: `slug`

**Response 200**: Array of `ContestSubmission` with `problem.title/slug/difficulty` populated.

**Handler**: `controllers/contest.controller.ts::getMySubmissions`

---

### POST /contest
**Description**: Create a new contest. Slug auto-generated from title.

**Auth**: Bearer JWT + `admin` role

**Request Body**: `Contest` schema fields (`title`, `description`, `startTime`, `endTime`, `type`, `banner`, `isPublished`).

**Response 201**: Created `Contest`.

**Error Cases**: 409 if title produces duplicate slug.

**Handler**: `controllers/contest.controller.ts::createContest`

---

### PATCH /contest/:id
**Description**: Update a contest.

**Auth**: Bearer JWT + `admin` role

**Path Params**: `id` — Contest ObjectId

**Request Body**: Any `Contest` fields.

**Response 200**: Updated `Contest`.

**Handler**: `controllers/contest.controller.ts::updateContest`

---

### DELETE /contest/:id
**Description**: Delete a contest and all its submissions.

**Auth**: Bearer JWT + `admin` role

**Path Params**: `id` — Contest ObjectId

**Response 200**: `{ "message": "Contest deleted" }`

**Side Effects**: Cascades delete to all `ContestSubmission` documents.

**Handler**: `controllers/contest.controller.ts::deleteContest`

---

### POST /contest/:id/problems
**Description**: Add an existing problem to a contest by its slug.

**Auth**: Bearer JWT + `admin` role

**Path Params**: `id` — Contest ObjectId

**Request Body**:
| Field | Type | Required | Default |
|---|---|---|---|
| `problemSlug` | string | Yes | — |
| `points` | number | No | `100` |
| `order` | number | No | `0` |

**Response 200**: Updated `Contest` document.

**Error Cases**: 409 if problem already in contest.

**Handler**: `controllers/contest.controller.ts::addProblemToContest`

---

### DELETE /contest/:id/problems/:problemId
**Description**: Remove a problem from a contest.

**Auth**: Bearer JWT + `admin` role

**Path Params**: `id` (Contest), `problemId` (Problem ObjectId)

**Response 200**: Updated `Contest` document.

**Handler**: `controllers/contest.controller.ts::removeProblemFromContest`

---

### POST /contest/:id/create-problem
**Description**: Create a new `Problem` document and immediately add it to the contest.

**Auth**: Bearer JWT + `admin` role

**Path Params**: `id` — Contest ObjectId

**Request Body**: All `Problem` creation fields plus `points` (number, default 100) and `order` (number, default 0). Slug auto-generated from title.

**Response 201**: `{ "problem": { ... }, "contest": { ... } }`

**Handler**: `controllers/contest.controller.ts::createAndAddProblem`

---

### PATCH /contest/:id/start
**Description**: Start a contest. Sets `isStarted: true` and `startedAt` timestamp. This is what activates the `status` virtual to `"ongoing"`.

**Auth**: Bearer JWT + `admin` role

**Path Params**: `id` — Contest ObjectId

**Response 200**: `{ "message": "Contest started", "contest": { ... } }`

**Error Cases**: 400 if already started.

**Handler**: `controllers/contest.controller.ts::startContest`

---

## Hackathons

### GET /hackathon
**Description**: List all published hackathons sorted by `startTime` DESC.

**Auth**: Public

**Response 200**: Array of `Hackathon` objects with `status` virtual included.

**Handler**: `controllers/hackathon.controller.ts::getHackathons`

---

### GET /hackathon/admin/all
**Description**: List all hackathons for admin (published and unpublished).

**Auth**: Bearer JWT + `admin` role

**Response 200**: All hackathons sorted by `startTime` DESC.

**Handler**: `controllers/hackathon.controller.ts::getAdminHackathons`

---

### GET /hackathon/slug/:slug
**Description**: Get a hackathon by slug, with published problem statements and team count.

**Auth**: Public

**Path Params**: `slug`

**Response 200**:
```json
{
  "hackathon": { /* Hackathon */ },
  "problemStatements": [ { /* HackathonPS */ , "lockedByTeam": { "teamName": "..." } } ],
  "teamCount": 12
}
```

**Handler**: `controllers/hackathon.controller.ts::getHackathonBySlug`

---

### GET /hackathon/:hackathonId/leaderboard
**Description**: Get the hackathon leaderboard ranked by `aiScore` DESC.

**Auth**: Public

**Path Params**: `hackathonId`

**Response 200**: Array of `{ rank, teamName, memberEmails, psTitle, difficulty, score, review, scoringDetails, githubUrl, submittedAt }`.

**Handler**: `controllers/hackathon.controller.ts::getLeaderboard`

---

### POST /hackathon/:hackathonId/teams/register
**Description**: Register a new team for a hackathon. Team size (leader + memberEmails) must be within `minTeamSize` and `maxTeamSize`.

**Auth**: Bearer JWT required

**Path Params**: `hackathonId`

**Request Body**:
| Field | Type | Required | Notes |
|---|---|---|---|
| `hackathonId` | string | Yes | Also taken from URL param |
| `teamName` | string | Yes | |
| `memberEmails` | string[] | No | Emails of other members (not including leader) |

**Response 201**: Created `HackathonTeam` document.

**Error Cases**: 400 if team size invalid; 400 if user already has a team (unique index violation).

**Handler**: `controllers/hackathon.controller.ts::registerTeam`

---

### GET /hackathon/:hackathonId/teams/my
**Description**: Get the authenticated user's team for a hackathon.

**Auth**: Bearer JWT required

**Path Params**: `hackathonId`

**Response 200**: `HackathonTeam` with `selectedPS` populated, or `null` if no team.

**Handler**: `controllers/hackathon.controller.ts::getMyTeam`

---

### POST /hackathon/:hackathonId/teams/select-ps
**Description**: Select a problem statement for the team. Atomically locks the PS so no other team can select it.

**Auth**: Bearer JWT required (must be team leader)

**Path Params**: `hackathonId`

**Request Body**:
| Field | Type | Required |
|---|---|---|
| `psId` | string (ObjectId) | Yes |

**Response 200**: `{ "team": { ... }, "ps": { ... } }`

**Error Cases**: 403 if not registered; 400 if already selected; 409 if PS already taken.

**Side Effects**: Sets `HackathonPS.isLocked = true`, `lockedByTeam`; sets `HackathonTeam.selectedPS`.

**Handler**: `controllers/hackathon.controller.ts::selectPS`

---

### POST /hackathon/:hackathonId/submit
**Description**: Submit a solution (GitHub URL + optional zip URL). Triggers AI scoring via Gemini. Only team leader can submit. One submission per team.

**Auth**: Bearer JWT required (must be team leader)

**Path Params**: `hackathonId`

**Request Body**:
| Field | Type | Required |
|---|---|---|
| `githubUrl` | string | Yes |
| `zipUrl` | string | No |

**Response 201**: `{ "submission": { ... }, "score": 8.5, "review": "..." }`

**Error Cases**: 400 if no PS selected; 400 if already submitted; 400 if past `endTime`.

**Side Effects**: Creates `HackathonSubmission`; sets `HackathonTeam.isSubmitted = true`; calls Gemini AI for scoring.

**Handler**: `controllers/hackathon.controller.ts::submitSolution`

---

### POST /hackathon
**Description**: Create a new hackathon.

**Auth**: Bearer JWT + `admin` role

**Request Body**: `Hackathon` schema fields.

**Response 201**: Created `Hackathon`.

**Handler**: `controllers/hackathon.controller.ts::createHackathon`

---

### PATCH /hackathon/:id
**Description**: Update a hackathon.

**Auth**: Bearer JWT + `admin` role

**Path Params**: `id` — Hackathon ObjectId

**Response 200**: Updated `Hackathon`.

**Handler**: `controllers/hackathon.controller.ts::updateHackathon`

---

### DELETE /hackathon/:id
**Description**: Delete a hackathon and cascade-delete all PSes, teams, and submissions.

**Auth**: Bearer JWT + `admin` role

**Response 200**: `{ "message": "Hackathon deleted" }`

**Handler**: `controllers/hackathon.controller.ts::deleteHackathon`

---

### POST /hackathon/:hackathonId/ps
**Description**: Create a problem statement for a hackathon.

**Auth**: Bearer JWT + `admin` role

**Path Params**: `hackathonId`

**Request Body**: `HackathonPS` fields (`title`, `description`, `techStack`, `difficulty`, `order`, `isPublished`).

**Response 201**: Created `HackathonPS`.

**Handler**: `controllers/hackathon.controller.ts::createPS`

---

### PATCH /hackathon/:hackathonId/ps/:psId
**Description**: Update a problem statement.

**Auth**: Bearer JWT + `admin` role

**Response 200**: Updated `HackathonPS`.

**Handler**: `controllers/hackathon.controller.ts::updatePS`

---

### DELETE /hackathon/:hackathonId/ps/:psId
**Description**: Delete a problem statement. If it was locked by a team, the team's `selectedPS` is cleared.

**Auth**: Bearer JWT + `admin` role

**Response 200**: `{ "message": "Problem Statement deleted." }`

**Handler**: `controllers/hackathon.controller.ts::deletePS`

---

### GET /hackathon/:hackathonId/admin/teams
**Description**: List all teams for a hackathon.

**Auth**: Bearer JWT + `admin` role

**Response 200**: Array of `HackathonTeam` with `leader.username/email` and `selectedPS.title` populated.

**Handler**: `controllers/hackathon.controller.ts::getAdminTeams`

---

### GET /hackathon/:hackathonId/admin/submissions
**Description**: List all submissions for a hackathon.

**Auth**: Bearer JWT + `admin` role

**Response 200**: Array of `HackathonSubmission` with team and PS details, sorted by `aiScore` DESC.

**Handler**: `controllers/hackathon.controller.ts::getAdminSubmissions`

---

### PATCH /hackathon/:id/start
**Description**: Start a hackathon. Sets `isStarted: true` and `startedAt`.

**Auth**: Bearer JWT + `admin` role

**Response 200**: `{ "message": "Hackathon started", "hackathon": { ... } }`

**Handler**: `controllers/hackathon.controller.ts::startHackathon`

---

## Mock Exams

### GET /mock
**Description**: List all published mock exams. If authenticated, includes `myAttempt` status per exam.

**Auth**: Optional

**Response 200**: Array of `MockExam` objects, each with `myAttempt: { score, total, completedAt } | null`.

**Handler**: `controllers/mock.controller.ts::getExams`

---

### GET /mock/:id
**Description**: Get a single exam with questions grouped by section. Questions are returned **without** `correctAnswer` or `explanation` (to prevent cheating). If authenticated, includes `myAttempt` summary.

**Auth**: Optional

**Path Params**: `id` — MockExam ObjectId

**Response 200**:
```json
{
  "exam": { /* MockExam */ },
  "sections": {
    "aptitude": [ { "_id": "...", "question": "...", "options": ["A","B","C","D"], "difficulty": "Easy", "order": 0 } ],
    "communication": [],
    "coding": [],
    "sql": []
  },
  "myAttempt": null
}
```

**Handler**: `controllers/mock.controller.ts::getExamById`

---

### POST /mock/:id/submit
**Description**: Submit exam answers. One attempt per user per exam. Returns full review with correct answers after submission.

**Auth**: Bearer JWT required

**Path Params**: `id` — MockExam ObjectId

**Request Body**:
| Field | Type | Required |
|---|---|---|
| `answers` | `{ questionId: string, selected: number }[]` | Yes |
| `timeTaken` | number | No (default 0, seconds) |

**Response 200**:
```json
{
  "score": 18,
  "total": 30,
  "percentage": 60,
  "sectionScores": {
    "aptitude":      { "correct": 5, "total": 10 },
    "communication": { "correct": 4, "total": 8 },
    "coding":        { "correct": 5, "total": 8 },
    "sql":           { "correct": 4, "total": 4 }
  },
  "timeTaken": 3600,
  "attemptId": "...",
  "review": [
    {
      "_id": "...", "section": "aptitude", "question": "...", "options": [...],
      "correctAnswer": 2, "explanation": "...", "selected": 2, "isCorrect": true
    }
  ]
}
```

**Error Cases**: 400 if already attempted; 400 if `answers` not array.

**Side Effects**: Creates `MockAttempt`.

**Handler**: `controllers/mock.controller.ts::submitExam`

---

### GET /mock/:id/my-result
**Description**: Retrieve the authenticated user's previous attempt result with full review.

**Auth**: Bearer JWT required

**Path Params**: `id` — MockExam ObjectId

**Response 200**: Same shape as submit response (without `attemptId`).

**Error Cases**: 404 if no attempt found.

**Handler**: `controllers/mock.controller.ts::getMyResult`

---

### GET /mock/admin/all
**Description**: List all mock exams (including unpublished) for admin.

**Auth**: Bearer JWT + `admin` role

**Response 200**: All `MockExam` documents.

**Handler**: `controllers/mock.controller.ts::getAllExamsAdmin`

---

### GET /mock/admin/results
**Description**: List all user attempts across all exams.

**Auth**: Bearer JWT + `admin` role

**Response 200**: Array of `MockAttempt` with `user.username/email` and `exam.title/slug` populated.

**Handler**: `controllers/mock.controller.ts::getAllResultsAdmin`

---

### POST /mock
**Description**: Create a mock exam. Slug auto-generated from title.

**Auth**: Bearer JWT + `admin` role

**Request Body**: `MockExam` fields.

**Response 201**: Created `MockExam`.

**Error Cases**: 409 if title produces duplicate slug.

**Handler**: `controllers/mock.controller.ts::createExam`

---

### PATCH /mock/:id
**Description**: Update a mock exam.

**Auth**: Bearer JWT + `admin` role

**Response 200**: Updated `MockExam`.

**Handler**: `controllers/mock.controller.ts::updateExam`

---

### DELETE /mock/:id
**Description**: Delete a mock exam and all its questions and attempts.

**Auth**: Bearer JWT + `admin` role

**Response 200**: `{ "message": "Exam deleted" }`

**Side Effects**: Cascades delete to `MockQuestion` and `MockAttempt`.

**Handler**: `controllers/mock.controller.ts::deleteExam`

---

### GET /mock/:id/questions
**Description**: List all questions for an exam with correct answers (admin view for editing).

**Auth**: Bearer JWT + `admin` role

**Path Params**: `id` — MockExam ObjectId

**Response 200**: Array of `MockQuestion` sorted by `section, order`.

**Handler**: `controllers/mock.controller.ts::getQuestionsAdmin`

---

### POST /mock/:id/questions
**Description**: Add a question to a mock exam. Increments `exam.totalQuestions`.

**Auth**: Bearer JWT + `admin` role

**Request Body**:
| Field | Type | Required |
|---|---|---|
| `section` | string (enum) | Yes — `aptitude \| communication \| coding \| sql` |
| `question` | string | Yes |
| `options` | string[4] | No |
| `correctAnswer` | number 0–3 | Yes |
| `explanation` | string | No |
| `difficulty` | string | No |
| `order` | number | No |

**Response 201**: Created `MockQuestion`.

**Side Effects**: `MockExam.totalQuestions += 1`.

**Handler**: `controllers/mock.controller.ts::addQuestion`

---

### PATCH /mock/questions/:qid
**Description**: Update a mock question.

**Auth**: Bearer JWT + `admin` role

**Path Params**: `qid` — MockQuestion ObjectId

**Response 200**: Updated `MockQuestion`.

**Handler**: `controllers/mock.controller.ts::updateQuestion`

---

### DELETE /mock/questions/:qid
**Description**: Delete a mock question. Decrements `exam.totalQuestions`.

**Auth**: Bearer JWT + `admin` role

**Response 200**: `{ "message": "Question deleted" }`

**Side Effects**: `MockExam.totalQuestions -= 1`.

**Handler**: `controllers/mock.controller.ts::deleteQuestion`

---

## Alumni

### GET /alumni/profiles
**Description**: List all alumni profiles sorted by `contributionScore` DESC.

**Auth**: Public

**Response 200**: Array of `AlumniProfile` documents.

**Handler**: `controllers/alumni.controller.ts::getProfiles`

---

### GET /alumni/profiles/:id
**Description**: Get a single alumni profile by ID.

**Auth**: Public

**Path Params**: `id` — AlumniProfile ObjectId

**Response 200**: `AlumniProfile` document.

**Handler**: `controllers/alumni.controller.ts::getProfile`

---

### GET /alumni/me
**Description**: Get the authenticated alumni's own profile (looked up by `user` field).

**Auth**: Bearer JWT + `alumni` role

**Response 200**: `AlumniProfile` document.

**Handler**: `controllers/alumni.controller.ts::getMyProfile`

---

### GET /alumni/experiences
**Description**: List all published alumni experiences. Supports domain and company filters.

**Auth**: Public

**Query Params**:
| Param | Type | Notes |
|---|---|---|
| `domain` | string | Case-insensitive regex filter |
| `company` | string | Case-insensitive regex filter |

**Response 200**: Array of `AlumniExperience` with `alumni.name/currentRole/currentCompany/avatar/batch/domain/isVerified` populated.

**Handler**: `controllers/alumni.controller.ts::getExperiences`

---

### POST /alumni/experiences
**Description**: Post an alumni experience. Alumni's `postsCount` +1, `contributionScore` +10.

**Auth**: Bearer JWT + `alumni` role

**Request Body**: `AlumniExperience` fields (`title`, `content`, `tags`, `readTime`). `alumni`, `company`, `domain` are set from the alumni's profile.

**Response 201**: Created `AlumniExperience`.

**Handler**: `controllers/alumni.controller.ts::createExperience`

---

### GET /alumni/slots
**Description**: List all unbooked alumni slots sorted by date/time.

**Auth**: Public

**Response 200**: Array of `AlumniSlot` with `alumni` details populated.

**Handler**: `controllers/alumni.controller.ts::getSlots`

---

### POST /alumni/slots/:id/book
**Description**: Book an alumni slot. Sets `isBooked: true` and `bookedBy`.

**Auth**: Bearer JWT required

**Path Params**: `id` — AlumniSlot ObjectId

**Request Body**:
| Field | Type | Notes |
|---|---|---|
| `topic` | string | Optional discussion topic |

**Response 200**: `{ "message": "Slot booked successfully", "slot": { ... } }`

**Error Cases**: 400 if slot already booked.

**Handler**: `controllers/alumni.controller.ts::bookSlot`

---

### POST /alumni/slots
**Description**: Create a new availability slot as an alumni. Alumni's `sessionsCount` +1, `contributionScore` +5.

**Auth**: Bearer JWT + `alumni` role

**Request Body**: `AlumniSlot` fields (`date`, `time`, `duration`, `sessionType`).

**Response 201**: Created `AlumniSlot`.

**Handler**: `controllers/alumni.controller.ts::createSlot`

---

### GET /alumni/referrals
**Description**: List all active referrals posted by alumni.

**Auth**: Public

**Response 200**: Array of `AlumniReferral` with `alumni` details populated.

**Handler**: `controllers/alumni.controller.ts::getReferrals`

---

### POST /alumni/referrals/:id/apply
**Description**: Apply for a referral. Increments `applicantsCount`.

**Auth**: Bearer JWT required

**Path Params**: `id` — AlumniReferral ObjectId

**Response 200**: `{ "message": "Applied successfully", "applicantsCount": 5 }`

**Handler**: `controllers/alumni.controller.ts::applyReferral`

---

### POST /alumni/referrals
**Description**: Post a job referral as an alumni. Alumni's `referralsCount` +1, `contributionScore` +15.

**Auth**: Bearer JWT + `alumni` role

**Request Body**: `AlumniReferral` fields (`role`, `description`, `skills`, `jobUrl`, `location`, `deadline`). `company` defaults to alumni's `currentCompany` if not provided.

**Response 201**: Created `AlumniReferral`.

**Handler**: `controllers/alumni.controller.ts::createReferral`

---

### GET /alumni/ama
**Description**: List all AMA sessions sorted by `scheduledAt` DESC.

**Auth**: Public

**Response 200**: Array of `AlumniAMA` with `alumni` details populated.

**Handler**: `controllers/alumni.controller.ts::getAMAs`

---

### POST /alumni/ama/:id/question
**Description**: Post a question to an AMA session.

**Auth**: Bearer JWT required

**Path Params**: `id` — AlumniAMA ObjectId

**Request Body**:
| Field | Type | Required |
|---|---|---|
| `question` | string | Yes |

**Response 200**: `{ "message": "Question posted successfully", "ama": { ... } }`

**Handler**: `controllers/alumni.controller.ts::postQuestion`

---

### POST /alumni/ama
**Description**: Create a new AMA session as an alumni.

**Auth**: Bearer JWT + `alumni` role

**Request Body**: `AlumniAMA` fields (`title`, `description`, `scheduledAt`).

**Response 201**: Created `AlumniAMA`.

**Handler**: `controllers/alumni.controller.ts::createAMA`

---

### GET /alumni/admin/all
**Description**: List all alumni profiles for admin management.

**Auth**: Bearer JWT + `admin` role

**Response 200**: All `AlumniProfile` documents sorted newest first.

**Handler**: `controllers/alumni.controller.ts::getProfilesAdmin`

---

### PATCH /alumni/admin/:id/verify
**Description**: Toggle `isVerified` on an alumni profile.

**Auth**: Bearer JWT + `admin` role

**Path Params**: `id` — AlumniProfile ObjectId

**Response 200**: Updated `AlumniProfile`.

**Handler**: `controllers/alumni.controller.ts::toggleVerify`

---

### PATCH /alumni/admin/:id
**Description**: Update an alumni profile (admin override).

**Auth**: Bearer JWT + `admin` role

**Path Params**: `id` — AlumniProfile ObjectId

**Request Body**: Any `AlumniProfile` fields.

**Response 200**: Updated `AlumniProfile`.

**Handler**: `controllers/alumni.controller.ts::updateProfileAdmin`

---

### DELETE /alumni/admin/:id
**Description**: Delete an alumni profile.

**Auth**: Bearer JWT + `admin` role

**Response 200**: `{ "message": "Profile deleted" }`

**Handler**: `controllers/alumni.controller.ts::deleteProfileAdmin`

---

## Companies

### GET /company
**Description**: List all published companies sorted by `order ASC, name ASC`.

**Auth**: Public

**Response 200**: Array of `Company` documents.

**Handler**: `controllers/company.controller.ts::getCompanies`

---

### GET /company/:slug
**Description**: Get a single published company by slug.

**Auth**: Public

**Path Params**: `slug`

**Response 200**: `Company` document.

**Handler**: `controllers/company.controller.ts::getCompanyBySlug`

---

### GET /company/:slug/prep
**Description**: Get all prep content and questions for a company, grouped by category.

**Auth**: Public

**Path Params**: `slug`

**Response 200**:
```json
{
  "company": { /* Company */ },
  "prepContent": {
    "dsa": [ { /* PrepContent */ } ],
    "aptitude": []
  },
  "questions": {
    "dsa": [ { /* PrepQuestion */ } ]
  }
}
```

**Handler**: `controllers/company.controller.ts::getCompanyPrepContent`

---

### GET /company/:slug/questions
**Description**: Get prep questions for a company, optionally filtered by category.

**Auth**: Public

**Path Params**: `slug`

**Query Params**:
| Param | Type | Notes |
|---|---|---|
| `category` | string | Optional. One of `aptitude \| communication \| dsa \| sql \| lld \| hld` |

**Response 200**: Array of `PrepQuestion` documents.

**Handler**: `controllers/company.controller.ts::getQuestions`

---

### POST /company
**Description**: Create a company. Slug auto-generated from name.

**Auth**: Bearer JWT + `admin` role

**Request Body**: `Company` schema fields.

**Response 201**: Created `Company`.

**Error Cases**: 409 if company name produces duplicate slug.

**Handler**: `controllers/company.controller.ts::createCompany`

---

### PATCH /company/:id
**Description**: Update a company.

**Auth**: Bearer JWT + `admin` role

**Response 200**: Updated `Company`.

**Handler**: `controllers/company.controller.ts::updateCompany`

---

### DELETE /company/:id
**Description**: Delete a company and cascade-delete its prep content.

**Auth**: Bearer JWT + `admin` role

**Response 200**: `{ "message": "Company deleted" }`

**Side Effects**: Deletes all `PrepContent` for this company.

**Handler**: `controllers/company.controller.ts::deleteCompany`

---

### POST /company/:id/prep
**Description**: Add prep content to a company.

**Auth**: Bearer JWT + `admin` role

**Path Params**: `id` — Company ObjectId

**Request Body**: `PrepContent` fields (`category`, `title`, `content`, `resources`, `order`, `isPublished`).

**Response 201**: Created `PrepContent`.

**Handler**: `controllers/company.controller.ts::createPrepContent`

---

### PATCH /company/prep/:contentId
**Description**: Update a prep content document.

**Auth**: Bearer JWT + `admin` role

**Response 200**: Updated `PrepContent`.

**Handler**: `controllers/company.controller.ts::updatePrepContent`

---

### DELETE /company/prep/:contentId
**Description**: Delete a prep content document.

**Auth**: Bearer JWT + `admin` role

**Response 200**: `{ "message": "Prep content deleted" }`

**Handler**: `controllers/company.controller.ts::deletePrepContent`

---

### POST /company/:id/questions
**Description**: Create a prep question for a company.

**Auth**: Bearer JWT + `admin` role

**Path Params**: `id` — Company ObjectId

**Request Body**: `PrepQuestion` fields.

**Response 201**: Created `PrepQuestion`.

**Handler**: `controllers/company.controller.ts::createQuestion`

---

### PATCH /company/questions/:qId
**Description**: Update a prep question.

**Auth**: Bearer JWT + `admin` role

**Response 200**: Updated `PrepQuestion`.

**Handler**: `controllers/company.controller.ts::updateQuestion`

---

### DELETE /company/questions/:qId
**Description**: Delete a prep question.

**Auth**: Bearer JWT + `admin` role

**Response 200**: `{ "message": "Question deleted" }`

**Handler**: `controllers/company.controller.ts::deleteQuestion`

---

## Interview Experiences

### GET /interview-experience
**Description**: List all approved interview experiences with pagination.

**Auth**: Public

**Query Params**:
| Param | Type | Default | Notes |
|---|---|---|---|
| `result` | string | — | Filter by `selected \| rejected \| pending` |
| `page` | number | `1` | |
| `limit` | number | `20` | |

**Response 200**:
```json
{
  "experiences": [ { /* InterviewExperience with company populated */ } ],
  "total": 100,
  "page": 1,
  "pages": 5
}
```

**Handler**: `controllers/interview-experience.controller.ts::getAllExperiences`

---

### GET /interview-experience/company/:slug
**Description**: List all approved interview experiences for a specific company (up to 50).

**Auth**: Public

**Path Params**: `slug` — Company slug

**Response 200**: Array of `InterviewExperience`.

**Handler**: `controllers/interview-experience.controller.ts::getExperiencesByCompany`

---

### POST /interview-experience/company/:slug
**Description**: Submit an interview experience for a company. Requires admin approval before it becomes public.

**Auth**: Bearer JWT required

**Path Params**: `slug` — Company slug

**Request Body**:
| Field | Type | Required |
|---|---|---|
| `role` | string | Yes |
| `year` | number | Yes |
| `experience` | string | Yes |
| `result` | string | No — `selected \| rejected \| pending` |
| `rounds` | string[] | No |
| `tips` | string | No |

**Response 201**: `{ "message": "...", "experience": { /* InterviewExperience */ } }`

**Side Effects**: Creates `InterviewExperience` with `isApproved: false`.

**Handler**: `controllers/interview-experience.controller.ts::submitExperience`

---

### GET /interview-experience/pending
**Description**: List all unapproved interview experiences for admin review.

**Auth**: Bearer JWT + `admin` role

**Response 200**: Array of `InterviewExperience` with `company.name/slug` populated.

**Handler**: `controllers/interview-experience.controller.ts::getPendingExperiences`

---

### PATCH /interview-experience/:id/approve
**Description**: Approve an interview experience (sets `isApproved: true`).

**Auth**: Bearer JWT + `admin` role

**Path Params**: `id` — InterviewExperience ObjectId

**Response 200**: Updated `InterviewExperience`.

**Handler**: `controllers/interview-experience.controller.ts::approveExperience`

---

### DELETE /interview-experience/:id
**Description**: Delete an interview experience.

**Auth**: Bearer JWT + `admin` role

**Response 200**: `{ "message": "Experience deleted" }`

**Handler**: `controllers/interview-experience.controller.ts::deleteExperience`

---

## Resources

### GET /resource
**Description**: List all published resources (content field excluded for listing). Supports filtering.

**Auth**: Public

**Query Params**:
| Param | Type | Notes |
|---|---|---|
| `type` | string | `company-paper \| dsa-note \| cs-fundamental \| blog` |
| `category` | string | e.g. `"Arrays"`, `"Operating Systems"` |
| `difficulty` | string | `Beginner \| Intermediate \| Advanced` |

**Response 200**: Array of `Resource` objects (no `content` field), sorted by `order ASC, createdAt DESC`.

**Handler**: `controllers/resource.controller.ts::getResources`

---

### GET /resource/admin/all
**Description**: List all resources (including unpublished) for admin.

**Auth**: Bearer JWT + `admin` role

**Response 200**: All `Resource` documents (with content) sorted newest first.

**Handler**: `controllers/resource.controller.ts::getAllResourcesAdmin`

---

### GET /resource/:slug
**Description**: Get a single published resource by slug. Increments `views` counter.

**Auth**: Public

**Path Params**: `slug`

**Response 200**: Full `Resource` document.

**Side Effects**: `resource.views += 1`.

**Handler**: `controllers/resource.controller.ts::getResourceBySlug`

---

### POST /resource
**Description**: Create a resource. Slug auto-generated from title.

**Auth**: Bearer JWT + `admin` role

**Request Body**: `Resource` schema fields.

**Response 201**: Created `Resource`.

**Error Cases**: 409 if title produces duplicate slug.

**Handler**: `controllers/resource.controller.ts::createResource`

---

### PATCH /resource/:id
**Description**: Update a resource.

**Auth**: Bearer JWT + `admin` role

**Response 200**: Updated `Resource`.

**Handler**: `controllers/resource.controller.ts::updateResource`

---

### DELETE /resource/:id
**Description**: Delete a resource.

**Auth**: Bearer JWT + `admin` role

**Response 200**: `{ "message": "Resource deleted" }`

**Handler**: `controllers/resource.controller.ts::deleteResource`

---

## Roadmaps

### POST /roadmap/generate
**Description**: Generate a personalized placement preparation roadmap using Google Gemini AI. Returns a structured JSON roadmap with phases, daily plans, company-specific topics, and key tips. No auth required.

**Auth**: Public

**Request Body**:
| Field | Type | Required | Notes |
|---|---|---|---|
| `companyType` | string | Yes | e.g. `"FAANG"`, `"Service"`, `"Product"` |
| `timeline` | string | Yes | e.g. `"2 months"`, `"6 weeks"` |
| `skillLevel` | string | No | Default `"Beginner"`. `Beginner \| Intermediate \| Advanced` |

**Response 200**:
```json
{
  "roadmap": {
    "title": "...",
    "summary": "...",
    "totalDuration": "8 weeks",
    "weeklyHoursRequired": 4,
    "phases": [
      {
        "phaseNumber": 1,
        "phaseName": "Foundation",
        "duration": "Week 1-2",
        "focusAreas": ["Arrays", "Strings"],
        "dailyPlan": [
          { "day": "Day 1-2", "topic": "Arrays", "tasks": ["..."], "estimatedHours": 3 }
        ],
        "milestone": "..."
      }
    ],
    "companySpecificTopics": ["LLD", "System Design"],
    "mockTestSchedule": ["End of week 4: full mock"],
    "keyTips": ["..."]
  }
}
```

**Error Cases**: 400 missing `companyType`/`timeline`; 503 if `GEMINI_API_KEY` not set; 500 on AI error.

**Handler**: `controllers/roadmap.controller.ts::generateRoadmap`

---

## Compile

### POST /compile
**Description**: Run code against optional stdin via Judge0 CE. Returns stdout, stderr, status, execution time, and memory. Does not compare against test cases — use `/problems/:slug/submit` for judged submission.

**Auth**: Bearer JWT required

**Request Body**:
| Field | Type | Required | Notes |
|---|---|---|---|
| `language` | string | Yes | `python \| javascript \| cpp \| java \| c \| sql` |
| `code` | string | Yes | |
| `stdin` | string | No | Standard input for the program |

**Response 200**:
```json
{
  "stdout": "Hello World\n",
  "stderr": "",
  "exitCode": 0,
  "status": "Accepted",
  "statusId": 3,
  "time": "0.05",
  "memory": 3072,
  "language": "Python",
  "version": "3.8.1"
}
```

**Limits**: CPU 10s, 256 MB RAM.

**Handler**: `controllers/compile.controller.ts::compileCode`

---

## Chatbot

### POST /chatbot/chat
**Description**: Chat with the BeyondBasic AI assistant (powered by Gemini 2.5 Flash). The chatbot has a built-in system context about all platform features and guides users accordingly.

**Auth**: Public

**Request Body**:
| Field | Type | Required | Notes |
|---|---|---|---|
| `message` | string | Yes | The user's message |
| `history` | `{ role: "user" \| "model", text: string }[]` | No | Previous conversation turns |

**Response 200**: `{ "reply": "..." }`

**Error Cases**: 400 if `message` is empty; 503 if `GEMINI_API_KEY` not set.

**Handler**: `controllers/chatbot.controller.ts::chatWithBot`

---

## Jobs

### GET /jobs
**Description**: Fetch job listings aggregated from up to 4 sources (Remotive, Adzuna, JSearch, TheMuse). Results are deduplicated, sorted newest-first, and cached in memory for 30 minutes.

**Auth**: Public

**Query Params**:
| Param | Type | Default | Notes |
|---|---|---|---|
| `keyword` | string | `""` | Job title keyword |
| `location` | string | `""` | Location (used by Adzuna and JSearch) |
| `category` | string | `"All"` | `Software \| Data \| DevOps \| Design \| Marketing \| QA \| Management \| All` |
| `type` | string | `"All"` | `Full-time \| Part-time \| Remote \| Internship \| Contract \| All` |
| `page` | number | `1` | Pagination page |
| `source` | string | `"all"` | `all \| remotive \| adzuna \| jsearch \| themuse` |

**Response 200**:
```json
{
  "jobs": [
    {
      "id": "remotive-123",
      "title": "Software Engineer",
      "company": "Acme Corp",
      "location": "Remote",
      "type": "Remote",
      "category": "Software",
      "description": "...",
      "salary": "",
      "postedAt": "2025-06-01T00:00:00Z",
      "applyUrl": "https://...",
      "source": "Remotive",
      "logo": "https://...",
      "tags": ["react", "node"],
      "isRemote": true,
      "experience": "Fresher"
    }
  ],
  "total": 42,
  "page": 1,
  "sources": ["Remotive", "TheMuse"],
  "apiStatus": {
    "remotive": true,
    "jsearch": false,
    "adzuna": false,
    "themuse": true
  }
}
```

**Handler**: `controllers/jobs.controller.ts::getJobs`

---

### GET /jobs/status
**Description**: Check which job API sources are configured (have API keys set).

**Auth**: Public

**Response 200**:
```json
{
  "configured": {
    "jsearch": false,
    "adzuna": false,
    "remotive": true,
    "themuse": true
  },
  "freeApis": ["remotive", "themuse"],
  "paidApis": ["jsearch", "adzuna"]
}
```

**Handler**: `controllers/jobs.controller.ts::getJobsStatus`

---

## Resume

### POST /resume/analyze
**Description**: Analyze a resume text using Google Gemini AI. Returns ATS score, score breakdown, strengths, improvement suggestions, keywords, and a final verdict.

**Auth**: Bearer JWT required

**Request Body**:
| Field | Type | Required | Notes |
|---|---|---|---|
| `resumeText` | string | Yes | Minimum 100 characters of resume text |

**Response 200**:
```json
{
  "atsScore": 72,
  "scoreBreakdown": {
    "formatting": 15,
    "keywords": 20,
    "experience": 18,
    "education": 10,
    "skills": 9
  },
  "summary": "...",
  "strengths": ["Strong project experience", "Clear skills section"],
  "improvements": [
    {
      "category": "Keywords",
      "issue": "Missing cloud keywords",
      "suggestion": "Add AWS/GCP/Azure to skills"
    }
  ],
  "keywords": {
    "present": ["React", "Node.js"],
    "missing": ["Docker", "Kubernetes"]
  },
  "verdict": "Competitive resume; add cloud skills to improve shortlisting."
}
```

**Error Cases**: 400 if `resumeText` too short; 503 if `GEMINI_API_KEY` not set.

**Handler**: `controllers/resume.controller.ts::analyzeResume`

---

## Health Check

### GET /api
**Description**: Health check endpoint.

**Auth**: Public

**Response 200**: `{ "status": "ok", "message": "BeyondBasic API is running", "timestamp": "..." }`

---

### GET /api/health
**Description**: Health check endpoint (alias).

**Auth**: Public

**Response 200**: Same as above.
