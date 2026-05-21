import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Star, Users, Clock, CheckCircle2, PlayCircle, Lock, ChevronDown,
  BookOpen, Award, Code2, BarChart3, Globe,
  Zap, TrendingUp, AlertCircle, ChevronUp, Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { courseApi, enrollmentApi } from "@/lib/api";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

interface Subtopic {
  _id: string;
  title: string;
  slug: string;
  estimatedReadTime: number;
  isFreePreview: boolean;
  order: number;
}

interface Topic {
  _id: string;
  title: string;
  order: number;
  subtopics: Subtopic[];
}

interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  tags: string[];
  category: string;
  level: string;
  author: { username?: string; name?: string; email: string } | string;
  price: number;
  totalEnrollments: number;
  rating: number;
  totalRatings: number;
  estimatedDuration: string;
  color: string;
  icon: string;
  whatYouWillLearn: string[];
  requirements: string[];
  createdAt: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Code2,
  BarChart3,
  Globe,
  Zap,
  BookOpen,
  TrendingUp,
  Award,
};

const LEVEL_BADGES: Record<string, string> = {
  Beginner: "bg-green-100 text-green-700",
  Intermediate: "bg-blue-100 text-blue-700",
  Advanced: "bg-purple-100 text-purple-700",
};

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [curriculum, setCurriculum] = useState<Topic[]>([]);
  const [enrollment, setEnrollment] = useState<{ progress: number; completedSubtopics: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [showAllChapters, setShowAllChapters] = useState(false);

  useEffect(() => {
    if (!slug) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [courseData, curriculumData] = await Promise.all([courseApi.getBySlug(slug!), courseApi.getCurriculum(slug!)]);
        setCourse(courseData);
        setCurriculum(curriculumData);
        // Expand first chapter by default
        if (curriculumData.length > 0) {
          setExpandedChapters(new Set([curriculumData[0]._id]));
        }
        // Check enrollment
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const e = await enrollmentApi.getByCourse(slug!);
            setEnrollment(e);
          } catch {}
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load course");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const handleEnroll = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    if (!course) return;
    setEnrolling(true);
    setEnrollError(null);
    try {
      await enrollmentApi.enroll(course._id);
      navigate(`/learn/${slug}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Already enrolled")) {
        navigate(`/learn/${slug}`);
      } else {
        setEnrollError(msg || "Enrollment failed. Please try again.");
      }
    } finally {
      setEnrolling(false);
    }
  };

  const totalLessons = curriculum.reduce((s, t) => s + t.subtopics.length, 0);
  const totalReadTime = curriculum.reduce((s, t) => s + t.subtopics.reduce((ss, st) => ss + st.estimatedReadTime, 0), 0);
  const visibleChapters = showAllChapters ? curriculum : curriculum.slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">Course not found</h2>
          <p className="text-slate-500 mb-4">{error}</p>
          <Link to="/courses">
            <Button variant="outline">Browse Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const Icon = ICON_MAP[course.icon] || BookOpen;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <div className={`bg-gradient-to-br ${course.color || "from-blue-600 to-indigo-800"} relative overflow-hidden`}>
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge className="bg-white/20 text-white border-white/30 text-xs">{course.category}</Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-xs">{course.level}</Badge>
              {enrollment && <Badge className="bg-green-500 text-white border-0 text-xs">Enrolled · {enrollment.progress}% complete</Badge>}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">{course.title}</h1>
            <p className="text-blue-100 text-lg mb-6 leading-relaxed">{course.shortDescription || course.description}</p>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-5 text-sm text-blue-100 mb-6">
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-white">{course.rating.toFixed(1)}</span>
                <span>({course.totalRatings.toLocaleString()} ratings)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {course.totalEnrollments.toLocaleString()} students
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {course.estimatedDuration}
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                {totalLessons} lessons
              </span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {course.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-white/10 backdrop-blur-sm rounded-lg text-blue-100 text-xs font-medium border border-white/10">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Course Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* What you'll learn */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h2 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  What You'll Learn
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {course.whatYouWillLearn.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-slate-600 text-sm leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            {course.requirements.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <h2 className="text-xl font-black text-slate-900 mb-5">Requirements</h2>
                  <ul className="space-y-2">
                    {course.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-slate-600 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Curriculum */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-black text-slate-900">Course Curriculum</h2>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-6 pb-4 border-b border-slate-100">
                  <span>{curriculum.length} chapters</span>
                  <span>·</span>
                  <span>{totalLessons} lessons</span>
                  <span>·</span>
                  <span>
                    {Math.round(totalReadTime / 60)}h {totalReadTime % 60}m total length
                  </span>
                </div>

                <div className="space-y-2">
                  {visibleChapters.map((chapter) => {
                    const isExpanded = expandedChapters.has(chapter._id);
                    const completedInChapter = chapter.subtopics.filter((st) => enrollment?.completedSubtopics?.includes(st._id)).length;

                    return (
                      <div key={chapter._id} className="border border-slate-200 rounded-xl overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                          onClick={() => {
                            const next = new Set(expandedChapters);
                            if (isExpanded) next.delete(chapter._id);
                            else next.add(chapter._id);
                            setExpandedChapters(next);
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                              <span className="text-white font-black text-xs">{chapter.order}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 text-sm">{chapter.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {chapter.subtopics.length} lessons · {chapter.subtopics.reduce((s, st) => s + st.estimatedReadTime, 0)} min
                                {enrollment && (
                                  <span className="text-green-600 ml-1.5">
                                    · {completedInChapter}/{chapter.subtopics.length} done
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                        </button>

                        {isExpanded && (
                          <div className="divide-y divide-slate-100">
                            {chapter.subtopics.map((subtopic) => {
                              const isDone = enrollment?.completedSubtopics?.includes(subtopic._id);
                              return (
                                <div key={subtopic._id} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-blue-50/40 transition-colors">
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">{isDone ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : subtopic.isFreePreview ? <PlayCircle className="w-5 h-5 text-blue-500" /> : <Lock className="w-4 h-4 text-slate-300" />}</div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${isDone ? "text-green-700" : "text-slate-700"}`}>{subtopic.title}</p>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {subtopic.isFreePreview && !enrollment && <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-[10px]">Preview</Badge>}
                                    <span className="text-xs text-slate-400">{subtopic.estimatedReadTime} min</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {curriculum.length > 4 && (
                  <button onClick={() => setShowAllChapters(!showAllChapters)} className="mt-4 w-full py-3 border border-slate-200 rounded-xl text-blue-600 font-semibold text-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                    {showAllChapters ? (
                      <>
                        <ChevronUp className="w-4 h-4" /> Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" /> Show {curriculum.length - 4} more chapters
                      </>
                    )}
                  </button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Enrollment Card (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <Card className="border-0 shadow-xl overflow-hidden">
                {/* Preview Banner */}
                <div className={`h-40 bg-gradient-to-br ${course.color || "from-blue-500 to-cyan-500"} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mx-auto mb-2 shadow-xl">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    {enrollment && <p className="text-white text-xs font-medium bg-white/20 px-3 py-1 rounded-full">{enrollment.progress}% Complete</p>}
                  </div>
                </div>

                <CardContent className="p-6">
                  {enrollment && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-semibold text-slate-700">Your Progress</span>
                        <span className="font-bold text-blue-600">{enrollment.progress}%</span>
                      </div>
                      <Progress value={enrollment.progress} className="h-2.5" />
                      <p className="text-xs text-slate-500 mt-1.5">
                        {enrollment.completedSubtopics.length} of {totalLessons} lessons completed
                      </p>
                    </div>
                  )}

                  <div className="text-center mb-5">{course.price === 0 ? <div className="text-3xl font-black text-green-600">Free</div> : <div className="text-3xl font-black text-slate-900">₹{course.price.toLocaleString()}</div>}</div>

                  <Button onClick={handleEnroll} disabled={enrolling} className="w-full h-12 font-bold text-base shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white gap-2">
                    {enrolling ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Play className="w-5 h-5" />}
                    {enrollment ? "Continue Learning" : course.price === 0 ? "Enroll Free" : "Enroll Now"}
                  </Button>

                  {enrollError && <p className="mt-2 text-sm text-red-600 text-center font-medium">{enrollError}</p>}

                  {enrollment && (
                    <Link to={`/practice/${slug}`} className="block mt-2">
                      <Button variant="outline" className="w-full h-11 font-bold border-blue-200 text-blue-600 hover:bg-blue-50 gap-2">
                        <Code2 className="w-4 h-4" />
                        Practice Problems
                      </Button>
                    </Link>
                  )}

                  <div className="mt-5 space-y-3">
                    {[
                      { icon: Clock, label: `${course.estimatedDuration} of content` },
                      { icon: BookOpen, label: `${totalLessons} lessons` },
                      { icon: Award, label: "Certificate of completion" },
                      { icon: Users, label: `${course.totalEnrollments.toLocaleString()} students enrolled` },
                    ].map(({ icon: ItemIcon, label }) => (
                      <div key={label} className="flex items-center gap-2.5 text-sm text-slate-600">
                        <ItemIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        {label}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2.5 mb-1">
                      <Avatar className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500">
                        <AvatarFallback className="text-white font-bold text-xs">{typeof course.author === "string" ? "IN" : (course.author.username || course.author.name || "IN").slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{typeof course.author === "string" ? "Instructor" : course.author.username || course.author.name || "Instructor"}</p>
                        <p className="text-xs text-slate-500">Course Instructor</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={`text-xs ${LEVEL_BADGES[course.level] || ""}`}>
                      {course.level}
                    </Badge>
                    <Badge variant="outline" className="text-xs text-slate-500">
                      {course.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
