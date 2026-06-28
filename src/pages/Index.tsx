import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { MainNavbar } from "@/components/MainNavbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import heroTeenCoding from "@/assets/hero-teen-coding.jpg";
import heroKidsCollab from "@/assets/hero-kids-collab.jpg";
import heroTeenGame from "@/assets/hero-teen-game.jpg";
import heroStudentPresenting from "@/assets/hero-student-presenting.jpg";
import parent1 from "@/assets/testimonial-parent-1.jpg";
import parent2 from "@/assets/testimonial-parent-2.jpg";
import parent3 from "@/assets/testimonial-parent-3.jpg";
import parent4 from "@/assets/testimonial-parent-4.jpg";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Brain, Computer, GraduationCap, Mic2, Palette, Sparkles, TrendingUp, Video } from "lucide-react";

type ProjectSummary = Pick<
  Tables<"projects">,
  "id" | "title" | "description" | "media_type" | "thumbnail_url" | "external_url"
>;

const fetchFeaturedProjects = async (): Promise<ProjectSummary[]> => {
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, description, media_type, thumbnail_url, external_url")
    .eq("visibility", "public")
    .eq("approved_by_admin", true)
    .eq("is_public_gallery", true)
    .eq("is_featured_homepage", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) throw error;
  return data ?? [];
};

const Index = () => {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["home-featured-projects"],
    queryFn: fetchFeaturedProjects,
  });

  const testimonialPeople = [
    {
      image: parent1,
      name: "Mrs. Adeoye",
      role: "Parent",
      quote:
        "In three months my son went from watching YouTube tutorials to showing me real apps he built himself.",
    },
    {
      image: parent2,
      name: "Chioma O.",
      role: "Parent",
      quote:
        "This is the first program where I can log in and clearly see what my daughter is building each week.",
    },
    {
      image: parent3,
      name: "Mr. Ibrahim",
      role: "Parent",
      quote:
        "Her confidence changed when she presented her AI project to our family – it felt like watching her future open up.",
    },
    {
      image: parent4,
      name: "School Director, Abuja",
      role: "School Leader",
      quote:
        "The portal finally gives us evidence of learning, not just attendance. We now showcase projects at every PTA.",
    },
  ];

  const heroImages = [
    { src: heroTeenCoding, alt: "African teen focused on coding on a laptop in a bright classroom" },
    { src: heroKidsCollab, alt: "Group of African kids collaborating around a computer and smiling" },
    { src: heroTeenGame, alt: "Teenager building a game or web app on a laptop in a modern workspace" },
    { src: heroStudentPresenting, alt: "Student presenting a digital project on a large screen to classmates" },
  ];

  const learningModules = [
    {
      title: "Web Development & Mini Projects",
      description: [
        "Building real-world web applications",
        "Website creation",
        "Interactive mini-games",
        "Solving practical problems with technology",
      ],
      icon: Sparkles,
    },
    {
      title: "AI Tools & Prompt Engineering",
      description: [
        "Artificial Intelligence fundamentals",
        "Prompt Engineering",
        "AI-assisted productivity",
        "AI-powered learning systems",
      ],
      icon: Brain,
    },
    {
      title: "Music & Podcast Creation",
      description: [
        "Music creation tools",
        "Podcast production",
        "Audio editing",
        "Creative storytelling",
      ],
      icon: Mic2,
    },
    {
      title: "Computer Fundamentals",
      description: [
        "Computer basics",
        "Digital literacy",
        "Productivity tools",
        "Internet research",
      ],
      icon: Computer,
    },
    {
      title: "Academic Research & Study Skills",
      description: [
        "Research techniques",
        "Understanding difficult topics",
        "Customized learning support",
        "Study productivity methods",
      ],
      icon: GraduationCap,
    },
    {
      title: "Video Creation & Animation",
      description: [
        "AI video creation",
        "Animation tools",
        "Content production",
        "Visual storytelling",
      ],
      icon: Video,
    },
    {
      title: "Graphic Design & Creativity",
      description: [
        "Professional flyer design",
        "Presentation design",
        "Image generation",
        "Creative branding",
      ],
      icon: Palette,
    },
    {
      title: "Real Project Development",
      description: [
        "Build practical projects",
        "Team collaboration",
        "Innovation challenges",
        "Portfolio creation",
      ],
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="AI Summer Holiday Program | Innovator Portal"
        description="Join the AI Summer Holiday Program for children and young adults aged 8–21. Learn AI, Web Development, Content Creation, Prompt Engineering, Graphic Design, Research Skills, and more through practical project-based learning in Enugu State."
        canonical={window.location.origin}
        keywords="AI Summer Holiday Program, AI Training for Kids, Enugu Tech Bootcamp, Summer Coding Program, Artificial Intelligence Training Nigeria, Youth Technology Program, Web Development for Students, Prompt Engineering Training"
      />
      <MainNavbar />

      <main className="mx-auto w-full max-w-7xl overflow-x-clip px-4 pb-24 pt-6 sm:px-6 md:pt-14 lg:px-8">
        <section className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center">
          <div className="space-y-5 w-full">
            <div className="inline-flex w-full max-w-sm items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary via-sky-500 to-secondary px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-primary/20 sm:max-w-full sm:px-4 sm:text-[10px] sm:tracking-[0.28em]">
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-white" />
              <span className="truncate">2026 AI SUMMER HOLIDAY PROGRAM</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-balance text-[1.5rem] font-black leading-[1.1] tracking-[-0.02em] text-slate-700 sm:text-[1.75rem] md:text-3xl lg:text-4xl">
                Proof over promises.
                <span className="mt-2 block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Real projects your child actually ships.
                </span>
              </h1>
              <p className="text-balance text-xs font-medium leading-6 text-slate-600 sm:text-sm md:text-base">
                The AI Innovators Program is a project-first experience where African kids and teens build web apps,
                games and AI-powered ideas – with every project saved, tracked and visible to you.
              </p>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-amber-50 p-3 text-slate-700 shadow-[0_20px_55px_rgba(37,99,235,0.08)] sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">AI Summer Holiday Program</p>
              <h2 className="mt-2 text-base font-bold leading-7 text-slate-700 sm:text-lg sm:leading-8">
                Empowering children and teenagers with practical AI, technology, creativity, and innovation skills through hands-on learning and real-world projects.
              </h2>
              <p className="mt-2 text-xs font-semibold text-slate-600 sm:mt-3 sm:text-sm">
                Age Range: <span className="font-black text-slate-700">8 – 21 Years</span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs sm:mt-3 sm:text-sm">
                <span className="text-slate-400 line-through">₦50,000</span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 sm:text-[11px]">
                  Now ₦30,000 for the first 25 students
                </span>
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-2 text-xs sm:gap-3 sm:text-sm sm:flex-row sm:items-center">
              <Button
                asChild
                size="sm"
                variant="playful"
                className="interactive-button button-glow w-full sm:w-auto text-xs sm:text-sm"
              >
                <Link to="/payments">Enroll Now</Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="parent"
                className="interactive-button w-full sm:w-auto text-xs sm:text-sm"
              >
                <Link to="/projects">View student projects</Link>
              </Button>
            </div>

            <div className="grid gap-3 text-[11px] text-slate-600 sm:gap-3 sm:text-xs sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm sm:p-4">
                <p className="text-xs font-black text-slate-700 sm:text-sm">Project evidence, not just scores</p>
                <p className="mt-1 leading-snug text-[10px] sm:text-xs">
                  Track every build, submission and presentation your child completes in the portal.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm sm:p-4">
                <p className="text-xs font-black text-slate-700 sm:text-sm">Built for Nigerian schools</p>
                <p className="mt-1 leading-snug text-[10px] sm:text-xs">Simple to deploy across classes without new hardware or complex setup.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm sm:p-4">
                <p className="text-xs font-black text-slate-700 sm:text-sm">Parent and school dashboards</p>
                <p className="mt-1 leading-snug text-[10px] sm:text-xs">One place where parents, teachers and students see the same progress.</p>
              </div>
            </div>
          </div>

          {/* Hero image grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            {heroImages.map((image, index) => (
              <div
                key={image.alt}
                className={`group relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[var(--shadow-soft)] transition-transform duration-300 hover:-translate-y-1 ${
                  index === 1 || index === 2 ? "md:translate-y-4" : ""
                }`}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105 md:h-44 lg:h-48"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 border-t border-dashed border-border/70 pt-8">
          <div className="overflow-hidden rounded-[1.75rem] border border-sky-100 bg-gradient-to-br from-sky-100 via-white to-amber-50 p-4 shadow-[0_20px_60px_rgba(37,99,235,0.06)] sm:p-6 lg:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">About The Program</p>
                <h2 className="mt-2 text-2xl font-black leading-tight text-slate-700 sm:text-3xl">
                  A practical technology bootcamp for future-ready learners.
                </h2>
                <p className="mt-4 max-w-3xl text-base font-medium leading-8 text-slate-500">
                  The AI Summer Holiday Program is a hands-on learning experience designed to help children and teenagers grow confident with digital tools, creative thinking, and real-world technology.
                </p>
                <p className="mt-3 max-w-3xl text-base font-medium leading-8 text-slate-500">
                  From Artificial Intelligence and web design to presentation skills and project building, each session is structured to help learners create something meaningful.
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-sky-100 bg-white/90 p-4 shadow-sm sm:p-5">
                <p className="text-sm font-black text-slate-700">What makes it special</p>
                <ul className="mt-3 space-y-3 text-sm font-medium text-slate-500">
                  <li className="flex items-start gap-2"><span className="mt-2 h-2 w-2 rounded-full bg-primary" />Hands-on projects that feel real and exciting.</li>
                  <li className="flex items-start gap-2"><span className="mt-2 h-2 w-2 rounded-full bg-secondary" />Mentorship that keeps learning practical and age-appropriate.</li>
                  <li className="flex items-start gap-2"><span className="mt-2 h-2 w-2 rounded-full bg-primary" />A strong foundation for school, creativity, and future careers.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14 border-t border-dashed border-border/70 pt-8" id="learn">
          <div className="mb-6 max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">What You&apos;ll Learn</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-slate-700 sm:text-3xl">
              A modern curriculum built for creativity, innovation, and real-world problem solving.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {learningModules.map((module, index) => {
              const Icon = module.icon;
              return (
                <Card key={module.title} className="group h-full border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_22px_60px_rgba(37,99,235,0.14)]">
                  <CardContent className="flex h-full flex-col gap-3 p-4 sm:p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-md transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black leading-6 text-slate-700">{module.title}</h3>
                      <ul className="mt-2 space-y-1 text-[12px] font-medium leading-6 text-slate-500">
                        {module.description.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mt-14 border-t border-dashed border-border/70 pt-8">
          <div className="rounded-[1.75rem] border border-sky-100 bg-gradient-to-br from-sky-100 via-white to-amber-50 p-4 text-slate-700 shadow-[0_20px_60px_rgba(37,99,235,0.06)] sm:p-6 lg:p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Who Can Join?</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-slate-700 sm:text-3xl">
              A welcoming program for curious learners at every stage.
            </h2>
            <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div className="rounded-[1.25rem] bg-white/95 p-4 text-slate-700 shadow-sm sm:p-5">
                <p className="text-sm font-black text-slate-700">Age Range: 8 – 21 Years</p>
                <p className="mt-3 text-sm font-semibold text-slate-500">Suitable for:</p>
                <ul className="mt-3 grid gap-2 text-sm font-medium text-slate-500 sm:grid-cols-2">
                  <li className="rounded-2xl bg-slate-100 p-3">Primary School Students</li>
                  <li className="rounded-2xl bg-slate-100 p-3">Secondary School Students</li>
                  <li className="rounded-2xl bg-slate-100 p-3">Undergraduate Students</li>
                  <li className="rounded-2xl bg-slate-100 p-3">Young Innovators</li>
                  <li className="rounded-2xl bg-slate-100 p-3">Young Creators</li>
                  <li className="rounded-2xl bg-slate-100 p-3">Aspiring Tech Enthusiasts</li>
                </ul>
              </div>
              <div className="rounded-[1.25rem] border border-sky-100 bg-white/90 p-4 text-sm font-medium leading-8 text-slate-600 shadow-sm sm:p-5">
                <p className="text-base font-black text-slate-700">Whether your child is exploring technology for the first time or already building ideas, this bootcamp creates a strong foundation for innovation, collaboration, and digital confidence.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14 border-t border-dashed border-border/70 pt-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[1.5rem] border border-sky-100 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.04)] sm:p-6">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Venue &amp; Schedule</p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-slate-700">
                A structured program with practical sessions and mentorship.
              </h2>
              <div className="mt-5 space-y-4 text-sm font-medium text-slate-500">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-700">Venue</p>
                  <p className="mt-2 leading-7">No. 6 Magma Plaza, Nkwo Nike, Amoji, Abakpa, Enugu East, Enugu State, Nigeria</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-700">Program Duration</p>
                  <p className="mt-2">August 4th – September 5th</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-700">Training Format</p>
                  <ul className="mt-2 space-y-2">
                    <li>• Physical Classes</li>
                    <li>• Practical Workshops</li>
                    <li>• Real Project Development</li>
                    <li>• Mentorship Sessions</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-sky-100 bg-gradient-to-br from-sky-100 via-white to-amber-50 p-4 text-slate-700 shadow-[0_20px_60px_rgba(37,99,235,0.06)] sm:p-6">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Why Join This Program?</p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-slate-700">Build confidence, creativity, and real digital skills.</h2>
              <ul className="mt-5 grid gap-2 text-sm font-semibold text-slate-600 sm:grid-cols-2">
                <li className="rounded-2xl bg-white/90 p-3 shadow-sm">Learn practical AI skills</li>
                <li className="rounded-2xl bg-white/90 p-3 shadow-sm">Build real projects</li>
                <li className="rounded-2xl bg-white/90 p-3 shadow-sm">Improve digital creativity</li>
                <li className="rounded-2xl bg-white/90 p-3 shadow-sm">Strengthen academic research skills</li>
                <li className="rounded-2xl bg-white/90 p-3 shadow-sm">Gain technology exposure early</li>
                <li className="rounded-2xl bg-white/90 p-3 shadow-sm">Develop problem-solving abilities</li>
                <li className="rounded-2xl bg-white/90 p-3 shadow-sm">Create a professional portfolio</li>
                <li className="rounded-2xl bg-white/90 p-3 shadow-sm">Receive mentorship and guidance</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-14 border-t border-dashed border-border/70 pt-8">
          <div className="mb-6 max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Contact Us</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-slate-700">Reach the program team easily.</h2>
          </div>
          <div className="rounded-[1.5rem] border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-amber-50 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.04)] sm:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black text-slate-700">Phone Numbers</p>
                <div className="mt-3 space-y-2 text-sm font-semibold text-slate-500">
                  <a href="tel:+2348125650249" className="flex items-center gap-2 hover:text-primary">
                    <span className="text-primary">📞</span>
                    <span>08125650249</span>
                  </a>
                  <a href="tel:+2348130984004" className="flex items-center gap-2 hover:text-primary">
                    <span className="text-primary">📞</span>
                    <span>08130984004</span>
                  </a>
                  <a href="tel:+2349030892635" className="flex items-center gap-2 hover:text-primary">
                    <span className="text-primary">📞</span>
                    <span>09030892635</span>
                  </a>
                </div>
              </div>
              <div className="rounded-[1.25rem] bg-white/90 p-4 text-sm font-medium leading-7 text-slate-500 shadow-sm">
                <p className="font-black text-slate-700">Enroll Now</p>
                <p className="mt-2">Reserve your place in the AI Summer Holiday Program by paying through the secure enrollment flow.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="enrollment" className="mt-14 border-t border-dashed border-border/70 pt-8">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Enrollment</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-slate-700">Securely reserve your child&apos;s place.</h2>
            <p className="mt-3 max-w-2xl text-base font-medium leading-8 text-slate-600">
              The existing payment process remains active, and the official enroll button now connects directly to the secure enrollment flow.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild size="sm" variant="playful" className="interactive-button button-glow">
                <Link to="/payments">Start Enrollment</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="interactive-button">
                <Link to="/projects">Browse student projects</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* PROOF OVER PROMISES */}
        <section className="mt-14 border-t border-dashed border-border/70 pt-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)] lg:items-start">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent-foreground/80">
                Proof Over Promises
              </p>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">What kids actually build</h2>
                  <p className="mt-1 max-w-xl text-xs text-muted-foreground">
                    These are real projects from real African students – web apps, games, designs and videos built inside
                    the AI Innovators Program. No templates. No fake screenshots.
                  </p>
                </div>
                <Button asChild size="sm" variant="teen" className="interactive-button">
                  <Link to="/projects">See more projects</Link>
                </Button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="animate-pulse border-border/60 bg-muted/40">
                      <CardContent className="h-28" />
                    </Card>
                  ))}

                {!isLoading && projects.length === 0 && (
                  <p className="col-span-full text-xs text-muted-foreground">
                    Public student projects will appear here as soon as they are approved. You can already explore the
                    live gallery.
                  </p>
                )}

                {!isLoading &&
                  projects.map((project) => (
                    <Card
                      key={project.id}
                      className="group flex h-full flex-col overflow-hidden border-border/70 bg-card/90 shadow-[var(--shadow-soft)]"
                    >
                      <div className="relative h-28 overflow-hidden">
                        <img
                          src={project.thumbnail_url || heroTeenGame}
                          alt={project.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute left-2 top-2 inline-flex items-center rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          <span className="mr-1 h-1.5 w-1.5 rounded-full bg-success" />
                          {project.media_type.replace("_", " ")}
                        </div>
                      </div>
                      <CardContent className="flex flex-1 flex-col gap-1.5 p-3 text-xs">
                        <h3 className="line-clamp-2 text-[13px] font-semibold text-foreground">{project.title}</h3>
                        {project.description && (
                          <p className="line-clamp-3 text-[11px] text-muted-foreground">{project.description}</p>
                        )}
                        {project.external_url && (
                          <a
                            href={project.external_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-auto inline-flex items-center text-[11px] font-medium text-primary underline-offset-4 hover:underline"
                          >
                            Open project
                            <span aria-hidden="true" className="ml-1">
                              ↗
                            </span>
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>

            {/* Side image and reassurance */}
            <aside className="space-y-4 rounded-3xl border border-border/70 bg-card/90 p-4 shadow-[var(--shadow-soft)]">
              <div className="overflow-hidden rounded-2xl">
                <img
                  src={heroKidsCollab}
                  alt="Students collaborating around a laptop during the AI Innovators Program"
                  loading="lazy"
                  className="h-40 w-full object-cover"
                />
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent-foreground/80">
                  How it works
                </p>
                <ul className="space-y-1.5">
                  <li>
                    <span className="font-medium text-foreground">1. Enroll</span> – secure payment and onboarding for
                    your child or school.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">2. Build</span> – weekly guided challenges where kids
                    ship real projects.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">3. Showcase</span> – selected work appears in the
                    public gallery and certificates.
                  </li>
                </ul>
                <div className="flex items-center gap-2 rounded-2xl bg-muted/60 px-3 py-2 text-[11px]">
                  <Badge variant="outline" className="border-success/40 text-success">
                    Transparent progress
                  </Badge>
                  <span>Every project is timestamped and linked to your child’s profile.</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* TESTIMONIALS / SUCCESS STORIES */}
        <section className="mt-14 border-t border-dashed border-border/70 pt-8">
          <div className="mb-6 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent-foreground/80">
              Success Stories
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">What parents &amp; schools are noticing</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Behind every login is a family, a classroom and a child discovering what they can build. These are their
              words.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {testimonialPeople.map((person) => (
              <article
                key={person.name}
                className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-card/95 p-4 text-xs text-muted-foreground shadow-[var(--shadow-soft)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={person.image}
                    alt={`${person.name} portrait`}
                    loading="lazy"
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{person.name}</p>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-accent-foreground/80">{person.role}</p>
                  </div>
                </div>
                <p className="leading-relaxed text-[11px]">“{person.quote}”</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-background/80">
        <div className="container flex flex-col gap-4 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} AI Innovators Program. Building Africa’s next generation of confident, practical
            problem solvers.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/projects" className="hover:text-foreground">
              Public projects gallery
            </Link>
            <span className="hidden h-4 w-px bg-border/70 md:inline-block" />
            <span>Designed with privacy, safety and parent trust at the centre.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
