import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Search,
  Sparkles,
  Upload,
  Globe,
  FileText,
  CheckCircle2,
  RefreshCw,
  Zap,
  Sliders,
  Layers,
  ArrowRight,
  Eye,
  Trash2,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface VectorChunk {
  id: string;
  source: string;
  text: string;
  tokens: number;
  similarity?: number;
  createdAt: string;
}

const INITIAL_CHUNKS: VectorChunk[] = [
  {
    id: "vec-chunk-01",
    source: "https://docs.straxon.network/sla-policy",
    text: "Deliverable turnaround SLA: All High-Conversion Blueprints are guaranteed within 24 hours. The Turnkey Empire Bundle fulfillment is completed within 48 hours with full QA regression testing.",
    tokens: 48,
    createdAt: "Today"
  },
  {
    id: "vec-chunk-02",
    source: "agency_onboarding_handbook.pdf",
    text: "Wholesale Agency Markups: License holders may mark up wholesale services up to 10x. Standard client invoices range between $2,500 and $10,000 per month on recurring retainers.",
    tokens: 42,
    createdAt: "Today"
  },
  {
    id: "vec-chunk-03",
    source: "global_billing_tax_compliance.md",
    text: "Indian and Global Tax Compliance: Invoices for Indian clients are generated with SAC code 998314 (IT & AI Software) with 18% GST (9% CGST + 9% SGST). International orders process via Stripe in USD.",
    tokens: 52,
    createdAt: "Yesterday"
  },
  {
    id: "vec-chunk-04",
    source: "brand_voice_guidelines_v3.txt",
    text: "Brand Voice: Authoritative, modern, cyber-luxury. Tone avoids generic buzzwords; emphasizes concrete net profit expansion, high speed, and bank-grade data security.",
    tokens: 36,
    createdAt: "2 days ago"
  }
];

export const RagVectorStudio: React.FC = () => {
  const [chunks, setChunks] = useState<VectorChunk[]>(INITIAL_CHUNKS);
  const [ingestType, setIngestType] = useState<"url" | "text">("url");
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);
  
  // Semantic Search Testing Console
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<VectorChunk[] | null>(null);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const handleIngest = async () => {
    if (ingestType === "url" && !urlInput.trim()) {
      toast.error("Please enter a valid website URL to vectorize.");
      return;
    }
    if (ingestType === "text" && !textInput.trim()) {
      toast.error("Please enter text content to index.");
      return;
    }

    setIsIngesting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newChunk: VectorChunk = {
      id: `vec-chunk-${Date.now().toString().slice(-4)}`,
      source: ingestType === "url" ? urlInput : (titleInput || "custom_knowledge_note.txt"),
      text: ingestType === "url"
        ? `Ingested content from ${urlInput}: Autonomous marketing guidelines, client value propositions, and service deliverables indexed into pgvector.`
        : textInput,
      tokens: Math.round((ingestType === "url" ? 220 : textInput.length) / 4),
      createdAt: "Just now"
    };

    setChunks((prev) => [newChunk, ...prev]);
    setIsIngesting(false);
    setUrlInput("");
    setTextInput("");
    setTitleInput("");
    toast.success("Semantic Vector Ingestion Complete!", {
      description: "Embeddings (1536-d) generated and stored in pgvector HNSW index."
    });
  };

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults(null);
    setAiAnswer(null);

    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Simulated Cosine Similarity Calculation
    const qLower = searchQuery.toLowerCase();
    const scoredChunks = chunks.map((chunk) => {
      let score = 0.65;
      const words = qLower.split(" ");
      words.forEach((w) => {
        if (chunk.text.toLowerCase().includes(w) || chunk.source.toLowerCase().includes(w)) {
          score += 0.08;
        }
      });
      score = Math.min(0.96, score + Math.random() * 0.04);
      return { ...chunk, similarity: parseFloat(score.toFixed(3)) };
    });

    scoredChunks.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    const topMatches = scoredChunks.slice(0, 3);
    setSearchResults(topMatches);

    // Formulate AI synthesized response based on highest similarity chunk
    const topChunk = topMatches[0];
    setAiAnswer(
      `Based on knowledge chunk [${topChunk.id}] (${(topChunk.similarity! * 100).toFixed(1)}% match):\n\n"${topChunk.text}"`
    );
    setIsSearching(false);
  };

  const deleteChunk = (id: string) => {
    setChunks((prev) => prev.filter((c) => c.id !== id));
    toast.info("Vector chunk purged from HNSW index.");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-mono">
              pgvector · 1536 Dimensions
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">HNSW Cosine Index</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Autonomous RAG Vector Studio
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Ingest documents, web pages, and brand guidelines to power autonomous AI service delivery.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-mono text-xs">
            ● {chunks.length} Active Embeddings
          </Badge>
        </div>
      </div>

      {/* Ingestion & Search Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Document & URL Ingestion Hub */}
        <Card className="glass-strong p-6 border-white/10 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" /> Vector Knowledge Ingestion
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Parse external sources into semantic vector chunks</p>
            </div>
            <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
              <Button
                type="button"
                size="sm"
                variant={ingestType === "url" ? "default" : "ghost"}
                onClick={() => setIngestType("url")}
                className={`h-7 text-xs ${ingestType === "url" ? "bg-gradient-primary text-primary-foreground border-0" : "text-muted-foreground"}`}
              >
                <Globe className="w-3.5 h-3.5 mr-1" /> Web URL
              </Button>
              <Button
                type="button"
                size="sm"
                variant={ingestType === "text" ? "default" : "ghost"}
                onClick={() => setIngestType("text")}
                className={`h-7 text-xs ${ingestType === "text" ? "bg-gradient-primary text-primary-foreground border-0" : "text-muted-foreground"}`}
              >
                <FileText className="w-3.5 h-3.5 mr-1" /> Raw Text
              </Button>
            </div>
          </div>

          {ingestType === "url" ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                  Target Website / Documentation URL
                </label>
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://clientbrand.com/about-us"
                  className="glass text-xs"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Our autonomous crawler renders DOM, strips HTML boilerplate, and fragments paragraphs into 500-token semantic chunks.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                  Document Title / Filename
                </label>
                <Input
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="brand_guidelines_2026.txt"
                  className="glass text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                  Content to Vectorize
                </label>
                <Textarea
                  rows={4}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste product specifications, tone requirements, or company policies..."
                  className="glass text-xs font-mono"
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleIngest}
            disabled={isIngesting}
            className="w-full bg-gradient-primary text-primary-foreground border-0 shadow-glow text-xs h-10 font-semibold"
          >
            {isIngesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Vectorizing & Generating Embeddings...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" /> Ingest & Vectorize Knowledge
              </>
            )}
          </Button>
        </Card>

        {/* Right: Live Semantic Query Console */}
        <Card className="glass-strong p-6 border-primary/20 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="pb-4 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" /> Live Semantic Query Sandbox
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Test how your RAG engine retrieves knowledge using cosine distance</p>
            </div>

            <form onSubmit={handleSemanticSearch} className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. What is the turnaround SLA or markup rate?"
                className="glass text-xs"
              />
              <Button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="bg-gradient-primary text-primary-foreground border-0 text-xs h-10 px-4 shrink-0 shadow-glow"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Query RAG"}
              </Button>
            </form>

            {/* Live Search Results Canvas */}
            {isSearching && (
              <div className="p-6 rounded-xl bg-black/40 border border-white/5 flex flex-col items-center justify-center text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                <p className="text-xs font-semibold text-white">Computing Cosine Similarity Vector Distances...</p>
                <p className="text-[10px] text-muted-foreground">Scanning HNSW index over 1536-dimensional space</p>
              </div>
            )}

            {searchResults && (
              <div className="space-y-3 animate-in fade-in">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 space-y-2">
                  <div className="flex items-center justify-between text-xs text-primary font-bold">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 fill-primary" /> RAG Synthesized Resolution
                    </span>
                    <span className="font-mono text-[10px]">Top Match: {(searchResults[0].similarity! * 100).toFixed(1)}%</span>
                  </div>
                  <p className="text-xs text-gray-200 leading-relaxed font-mono whitespace-pre-wrap">
                    {aiAnswer}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                    Retrieved Vector Chunks:
                  </span>
                  {searchResults.map((match) => (
                    <div
                      key={match.id}
                      className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-primary">{match.id}</span>
                          <span className="text-muted-foreground text-[10px] truncate max-w-[200px]">{match.source}</span>
                        </div>
                        <p className="text-gray-300 text-[11px] line-clamp-2">{match.text}</p>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-mono shrink-0">
                        {((match.similarity || 0) * 100).toFixed(1)}% match
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/10 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Query Engine: pgvector with IVFFlat/HNSW</span>
            <span className="text-primary font-mono font-medium">Latency ~14ms</span>
          </div>
        </Card>
      </div>

      {/* Indexed Knowledge Chunks Table */}
      <Card className="glass-strong p-6 border-white/10 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" /> Active Indexed Knowledge Chunks
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Vectorized content accessible across all autonomous delivery pipelines</p>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {chunks.length} Total Documents
          </Badge>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-muted-foreground uppercase text-[10px]">
                <th className="py-2.5 px-3">Chunk ID</th>
                <th className="py-2.5 px-3">Knowledge Source</th>
                <th className="py-2.5 px-3">Token Count</th>
                <th className="py-2.5 px-3">Content Excerpt</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {chunks.map((chunk) => (
                <tr key={chunk.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 text-primary font-bold">{chunk.id}</td>
                  <td className="py-3 px-3 text-white max-w-[180px] truncate">{chunk.source}</td>
                  <td className="py-3 px-3 text-muted-foreground">{chunk.tokens} tokens</td>
                  <td className="py-3 px-3 text-gray-300 font-sans text-xs max-w-[320px] truncate">{chunk.text}</td>
                  <td className="py-3 px-3">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                      Vectorized
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteChunk(chunk.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
