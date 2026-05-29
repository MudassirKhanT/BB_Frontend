import { Routes, Route } from "react-router-dom";
import ChatBot from "./components/shared/ChatBot";
import ScrollToTop from "./components/shared/ScrollToTop";
import HomePage from "./pages/HomePage";
import SignupPage from "./pages/signup";
import LoginPage from "./pages/login";
import Dashboard from "./pages/Dashboard";
import CourseCatalog from "./pages/CourseCatalog";
import CourseDetail from "./pages/CourseDetail";
import CourseLearn from "./pages/CourseLearn";
import ForgotPasswordPage from "./pages/ForgotPassword";
import Practice from "./pages/Practice";
import ProblemSolver from "./pages/ProblemSolver";
import ProblemOfTheDay from "./pages/ProblemOfTheDay";
import CompanyPrepPage from "./pages/CompanyPrepPage";
import CompanyDetailPage from "./pages/CompanyDetailPage";
import CompanyPreparationPage from "./pages/CompanyPreparationPage";
import ResourcesHubPage from "./pages/ResourcesHubPage";
import ResourceListPage from "./pages/ResourceListPage";
import ResourceDetailPage from "./pages/ResourceDetailPage";
import InterviewExperiencesPage from "./pages/InterviewExperiencesPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import ResumeAnalyzerPage from "./pages/ResumeAnalyzerPage";
import MockAssessmentsPage from "./pages/MockAssessmentsPage";
import MockExamPage from "./pages/MockExamPage";
import ContestsPage from "./pages/ContestsPage";
import ContestDetailPage from "./pages/ContestDetailPage";
import ContestSolverPage from "./pages/ContestSolverPage";
import HackathonPage from "./pages/HackathonPage";
import HackathonSubmitPage from "./pages/HackathonSubmitPage";
import AdminDashboard from "./pages/AdminDashboard";
import PracticePage from "./pages/PracticePage";
import JobsPage from "./pages/JobsPage";
import ProfilePage from "./pages/ProfilePage";
import RoadmapGeneratorPage from "./pages/RoadmapGeneratorPage";
import AlumniConnectPage from "./pages/AlumniConnectPage";

function App() {
  return (
    <>
      <ScrollToTop />
      <ChatBot />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/problem-of-the-day" element={<ProblemOfTheDay />} />
        <Route path="/courses" element={<CourseCatalog />} />
        <Route path="/courses/:slug" element={<CourseDetail />} />
        <Route path="/learn/:slug" element={<CourseLearn />} />
        <Route path="/practice/:courseSlug" element={<Practice />} />
        <Route path="/problems/:slug" element={<ProblemSolver />} />
        <Route path="/company-prep" element={<CompanyPrepPage />} />
        <Route path="/company-prep/:slug" element={<CompanyDetailPage />} />
        <Route path="/company-prep/:slug/prepare" element={<CompanyPreparationPage />} />
        {/* Resources — specific routes before wildcard :type */}
        <Route path="/resources" element={<ResourcesHubPage />} />
        <Route path="/resources/interview-experiences" element={<InterviewExperiencesPage />} />
        <Route path="/resources/:type/:slug" element={<ResourceDetailPage />} />
        <Route path="/resources/:type" element={<ResourceListPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/resume-analyzer" element={<ResumeAnalyzerPage />} />
        <Route path="/mock-assessments" element={<MockAssessmentsPage />} />
        <Route path="/mock-assessments/:id" element={<MockExamPage />} />
        <Route path="/mock-assessments/:id/result" element={<MockExamPage />} />
        {/* Contest routes — solver before detail to avoid :slug catching "solve" */}
        <Route path="/contests" element={<ContestsPage />} />
        <Route path="/contests/:slug/solve/:problemSlug" element={<ContestSolverPage />} />
        <Route path="/contests/:slug" element={<ContestDetailPage />} />
        <Route path="/hackathon" element={<HackathonPage />} />
        <Route path="/hackathon/:slug/submit" element={<HackathonSubmitPage />} />
        <Route path="/hackathon/:slug" element={<HackathonPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/roadmap-generator" element={<RoadmapGeneratorPage />} />
        <Route path="/alumni-connect" element={<AlumniConnectPage />} />
      </Routes>
    </>
  );
}

export default App;
