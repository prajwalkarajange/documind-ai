import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileUp, MessageSquareQuote, ShieldCheck, Sparkles, Zap, Github, Linkedin, Mail } from "lucide-react";
import { Brand } from "@/components/common/Brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DocuMind AI — Chat with your PDFs, cited answers" },
      {
        name: "description",
        content:
          "Upload PDFs and ask questions. DocuMind AI retrieves the exact passages and answers with page-level citations.",
      },
      { property: "og:title", content: "DocuMind AI — Chat with your PDFs" },
      {
        property: "og:description",
        content: "Retrieval-augmented answers from your own documents, with citations.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: FileUp,
    title: "Upload & process",
    body: "PDFs are extracted, chunked, embedded and indexed into a vector store with live status.",
  },
  {
    icon: MessageSquareQuote,
    title: "Answers with citations",
    body: "Every answer links back to the file name and page number it came from.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    body: "Separate user workspaces and a secure admin panel for oversight.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Brand />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" /> Retrieval-augmented document intelligence
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Turn your documents into a <span className="text-brand-gradient">knowledge engine</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              DocuMind AI ingests your PDFs, embeds them into a vector index, and answers your
              questions with the exact passages it used — no guessing, no hallucinated sources.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/register">
                  Start free <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">I already have an account</Link>
              </Button>
            </div>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="rounded-2xl border-border/70 shadow-soft">
                <CardContent className="p-6">
                  <span className="bg-brand-gradient flex size-10 items-center justify-center rounded-xl shadow-soft">
                    <feature.icon className="size-5 text-primary-foreground" />
                  </span>
                  <h2 className="mt-4 text-base font-semibold text-foreground">{feature.title}</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">{feature.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="glass-panel mt-14 flex flex-col gap-4 rounded-3xl p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Built for teams that live in documents
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Contracts, research, manuals, reports — ask once, get grounded answers.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/register">
                <Zap className="size-4" /> Create your workspace
              </Link>
            </Button>
          </div>
        </section>

        <section className="border-t border-border/40 bg-muted/20 py-16">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                The Architecture & Tech Stack
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                DocuMind AI is built with modern, scalable technologies across the entire stack.
              </p>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Card className="border-border/50 bg-background/50 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Frontend</h3>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="font-medium text-foreground">React 19</li>
                    <li>TypeScript</li>
                    <li>Vite</li>
                    <li>TanStack Router</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-background/50 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Backend</h3>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="font-medium text-foreground">Java 21</li>
                    <li>Spring Boot 3.3</li>
                    <li>Spring Security</li>
                    <li>JPA / Hibernate</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-background/50 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Database</h3>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="font-medium text-foreground">PostgreSQL</li>
                    <li>pgvector</li>
                    <li>Flyway Migrations</li>
                    <li>Supabase Hosting</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-background/50 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Storage</h3>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="font-medium text-foreground">Supabase Storage</li>
                    <li>Private Bucket</li>
                    <li>service_role access</li>
                    <li>Secure URL generation</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-background/50 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">AI / RAG</h3>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="font-medium text-foreground">Gemini API</li>
                    <li>gemini-embedding-001</li>
                    <li>gemini-3.6-flash</li>
                    <li>Grounded Prompts</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="border-t border-border/40 py-16">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="grid gap-8 md:grid-cols-3 items-center">
              <div className="md:col-span-2 space-y-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  About the Developer
                </span>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Hi, I'm Prajwal Karajange
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed">
                  I'm a <strong className="text-foreground">Java Full Stack Developer</strong> focused on building scalable web applications, AI-powered solutions, and modern cloud-based applications.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This project demonstrates practical end-to-end experience with:
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Java & Spring Boot", "REST APIs", "React & TypeScript", "RAG Architecture", "Gemini AI", "Vector Embeddings", "pgvector", "Supabase Storage", "PostgreSQL", "Cloud Deployment"].map((tag) => (
                    <span key={tag} className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border/40">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col gap-3 justify-center bg-muted/15 border border-border/40 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-foreground text-sm mb-1 text-center">Prajwal Karajange</h3>
                <p className="text-xs text-muted-foreground text-center mb-3">Java Full Stack Developer</p>
                <Button asChild variant="default" size="sm" className="w-full justify-center gap-2 cursor-pointer">
                  <a href="https://linkedin.com/in/prajwal-karajange" target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-4 w-4" /> LinkedIn Profile
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-center gap-2 cursor-pointer">
                  <a href="https://github.com/prajwalkarajange" target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" /> GitHub Profile
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-muted/30 py-12">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3 text-sm">
            <div className="space-y-3">
              <Brand />
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                AI-powered document intelligence and Retrieval-Augmented Generation (RAG) platform.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Developed By</h4>
              <p className="text-muted-foreground font-medium">Prajwal Karajange</p>
              <p className="text-xs text-muted-foreground">Java Full Stack Developer</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Connect</h4>
              <div className="flex items-center gap-3">
                <a 
                  href="https://github.com/prajwalkarajange" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border/20"
                  aria-label="GitHub"
                >
                  <Github className="size-4" />
                </a>
                <a 
                  href="https://linkedin.com/in/prajwal-karajange" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border/20"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="size-4" />
                </a>
                <a 
                  href="mailto:prajwalkarajange0409@gmail.com"
                  className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border/20"
                  aria-label="Email"
                >
                  <Mail className="size-4" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border/40 mt-8 pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} DocuMind AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
