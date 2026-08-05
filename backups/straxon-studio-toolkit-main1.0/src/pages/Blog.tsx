import { motion } from "framer-motion";
import { useState } from "react";
import { Calendar, Clock, ArrowRight, Tag, User, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const blogPosts = [
  {
    id: 1,
    title: "The Future of Web Development in 2026",
    excerpt: "Exploring emerging frameworks, AI-assisted coding, and the evolution of frontend architecture.",
    content: "The web development landscape continues to evolve at a rapid pace. From server components to edge computing, developers now have more powerful tools than ever. AI-assisted development is becoming mainstream, helping teams ship faster while maintaining code quality. In this article, we explore the key trends shaping the future of web development and how STRAXON LABS is staying ahead of the curve.",
    category: "Development",
    author: "STRAXON Team",
    date: "2026-02-15",
    readTime: "5 min read",
    featured: true,
  },
  {
    id: 2,
    title: "Why Cybersecurity Should Be Built-In, Not Bolted On",
    excerpt: "A deep dive into security-first development practices and why they matter more than ever.",
    content: "Too many organizations treat security as an afterthought, implementing it only after a breach or compliance requirement. At STRAXON Secure, we believe security should be woven into every layer of your digital infrastructure from day one. This approach not only reduces risk but also saves significant time and resources in the long run.",
    category: "Security",
    author: "STRAXON Secure",
    date: "2026-02-10",
    readTime: "7 min read",
    featured: false,
  },
  {
    id: 3,
    title: "Designing Brand Identities That Scale",
    excerpt: "How to create flexible visual systems that grow with your business across every touchpoint.",
    content: "A great brand identity isn't just a logo—it's a complete visual language that communicates your values, differentiates you from competitors, and creates lasting impressions. At STRAXON Creative, we design identity systems that are flexible enough to work across digital and print, yet consistent enough to build recognition.",
    category: "Design",
    author: "STRAXON Creative",
    date: "2026-02-05",
    readTime: "4 min read",
    featured: false,
  },
  {
    id: 4,
    title: "Automating Business Processes with AI",
    excerpt: "Real-world examples of how intelligent automation is transforming operations across industries.",
    content: "From invoice processing to customer support, AI-powered automation is revolutionizing how businesses operate. We share case studies and lessons learned from building custom automation solutions that have helped our clients reduce manual work by up to 70% while improving accuracy and employee satisfaction.",
    category: "Automation",
    author: "STRAXON Labs",
    date: "2026-01-28",
    readTime: "6 min read",
    featured: false,
  },
  {
    id: 5,
    title: "Building Secure APIs: Best Practices Guide",
    excerpt: "Essential security patterns for modern API development, from authentication to rate limiting.",
    content: "APIs are the backbone of modern applications, but they're also a common attack vector. This comprehensive guide covers authentication strategies, input validation, rate limiting, encryption, and monitoring—everything you need to build APIs that are both powerful and secure.",
    category: "Development",
    author: "STRAXON Develop",
    date: "2026-01-20",
    readTime: "8 min read",
    featured: false,
  },
  {
    id: 6,
    title: "UI/UX Trends That Actually Matter",
    excerpt: "Cutting through the noise to focus on design trends that improve user experience.",
    content: "Every year brings new design trends, but not all of them serve users. We examine which current trends genuinely improve usability and engagement, and which are just visual noise. From spatial design to adaptive interfaces, learn what's worth adopting in your next project.",
    category: "Design",
    author: "STRAXON Creative",
    date: "2026-01-15",
    readTime: "5 min read",
    featured: false,
  },
];

const categories = ["All", "Development", "Design", "Security", "Automation"];

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPost, setSelectedPost] = useState<typeof blogPosts[0] | null>(null);

  const filtered = selectedCategory === "All" ? blogPosts : blogPosts.filter((p) => p.category === selectedCategory);
  const featuredPost = blogPosts.find((p) => p.featured);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />

        <section className="pt-32 pb-28">
          <div className="container mx-auto px-6">
            {/* Header */}
            <motion.div {...fadeUp} className="text-center mb-16">
              <span className="text-sm font-mono text-primary tracking-widest uppercase">Insights</span>
              <h1 className="mt-4 text-4xl md:text-6xl font-black text-foreground">
                Our <span className="text-primary text-glow">Blog</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
                Thoughts, tutorials, and insights from the STRAXON LABS team on development, design, security, and automation.
              </p>
            </motion.div>

            {/* Featured Post */}
            {featuredPost && (
              <motion.div
                {...fadeUp}
                transition={{ delay: 0.1, duration: 0.6 }}
                onClick={() => setSelectedPost(featuredPost)}
                className="mb-16 rounded-2xl border border-border bg-card overflow-hidden cursor-pointer group transition-all hover:border-primary/40 hover:box-glow"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="h-64 lg:h-auto bg-gradient-to-br from-primary/20 to-glow-secondary/20 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(var(--primary)/0.15)_0%,transparent_60%)] group-hover:scale-150 transition-transform duration-700" />
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute w-40 h-40 border border-primary/10 rounded-full"
                    />
                    <span className="relative text-6xl font-black text-primary/20 group-hover:text-primary/40 transition-colors">FEATURED</span>
                  </div>
                  <div className="p-8 lg:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-mono text-primary tracking-wider uppercase bg-primary/10 px-2.5 py-1 rounded">{featuredPost.category}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{featuredPost.date}</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">{featuredPost.title}</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">{featuredPost.excerpt}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{featuredPost.author}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{featuredPost.readTime}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Category Filter */}
            <motion.div {...fadeUp} transition={{ delay: 0.15, duration: 0.6 }} className="flex flex-wrap gap-3 mb-10 justify-center">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </motion.div>

            {/* Blog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.filter((p) => !p.featured || selectedCategory !== "All").map((post, i) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  whileHover={{ y: -5 }}
                  onClick={() => setSelectedPost(post)}
                  className="group rounded-xl border border-border bg-card overflow-hidden cursor-pointer transition-all hover:border-primary/40 hover:box-glow"
                >
                  <div className="h-40 bg-gradient-to-br from-primary/10 to-glow-secondary/10 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.1)_0%,transparent_70%)] group-hover:scale-150 transition-transform duration-700" />
                    <Tag className="relative h-10 w-10 text-primary/30 group-hover:text-primary/60 transition-colors duration-300" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-mono text-primary tracking-wider uppercase bg-primary/10 px-2 py-0.5 rounded">{post.category}</span>
                      <span className="text-xs text-muted-foreground">{post.readTime}</span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{post.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.author}</span>
                      <span>{post.date}</span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Post Dialog */}
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-2xl border-border bg-card max-h-[80vh] overflow-y-auto">
            {selectedPost && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-mono text-primary tracking-wider uppercase bg-primary/10 px-2.5 py-1 rounded">{selectedPost.category}</span>
                    <span className="text-xs text-muted-foreground">{selectedPost.date}</span>
                    <span className="text-xs text-muted-foreground">{selectedPost.readTime}</span>
                  </div>
                  <DialogTitle className="text-2xl font-bold text-foreground">{selectedPost.title}</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">By {selectedPost.author}</DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                  <p className="text-muted-foreground leading-relaxed">{selectedPost.content}</p>
                  <p className="text-muted-foreground leading-relaxed italic">
                    This is a placeholder article. Update this content with your actual blog post. You can expand this section with rich formatting, images, and code snippets as needed.
                  </p>
                </div>
                <Link
                  to="/contact"
                  onClick={() => setSelectedPost(null)}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:box-glow-strong hover:scale-[1.02] w-full"
                >
                  Discuss This Topic <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </DialogContent>
        </Dialog>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Blog;
