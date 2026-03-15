'use client';

import { useState } from 'react';
import { Search, Loader2, Shield, Server, Code, Layout, Database, Activity, Globe, AlertCircle, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ScanResult = {
  url: string;
  status: number;
  technologies: Record<string, { category: string; confidence: number }>;
};

export default function Page() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');

  const isValidUrl = (urlString: string) => {
    try {
      // If it doesn't start with http/https, prepend https:// for validation
      const urlToTest = new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
      // Basic check to ensure it has a valid hostname with a dot (e.g., example.com)
      return urlToTest.hostname.includes('.');
    } catch (e) {
      return false;
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    if (!isValidUrl(url)) {
      setError('Please enter a valid URL (e.g., example.com or https://example.com)');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to scan');

      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Group technologies by category
  const groupedTech = results ? Object.entries(results.technologies).reduce((acc, [name, info]) => {
    if (!acc[info.category]) acc[info.category] = [];
    acc[info.category].push({ name, confidence: info.confidence });
    return acc;
  }, {} as Record<string, { name: string; confidence: number }[]>) : {};

  const exportToMarkdown = () => {
    if (!results) return;

    let md = `# Tech Profile Report: ${results.url}\n\n`;
    md += `**Status Code:** ${results.status}\n`;
    md += `**Scan Date:** ${new Date().toLocaleString()}\n\n`;

    if (Object.keys(groupedTech).length === 0) {
      md += `*No specific technologies detected.*\n`;
    } else {
      Object.entries(groupedTech).forEach(([category, techs]) => {
        md += `## ${category}\n\n`;
        techs.forEach(tech => {
          md += `- **${tech.name}** (Confidence: ${tech.confidence}%)\n`;
        });
        md += `\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    
    try {
      const domain = new URL(results.url).hostname;
      a.download = `tech-profile-${domain}.md`;
    } catch {
      a.download = `tech-profile.md`;
    }
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Backend': return <Database className="w-5 h-5 text-blue-400" />;
      case 'Frontend': return <Layout className="w-5 h-5 text-pink-400" />;
      case 'CMS': return <Code className="w-5 h-5 text-emerald-400" />;
      case 'Server': return <Server className="w-5 h-5 text-purple-400" />;
      case 'CDN': return <Shield className="w-5 h-5 text-orange-400" />;
      case 'Analytics': return <Activity className="w-5 h-5 text-yellow-400" />;
      default: return <Code className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-blue-500/30">
      <div className="max-w-4xl mx-auto p-6 pt-20">
        
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-2xl mb-4 border border-blue-500/20">
            <Globe className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Tech Profiler
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto text-lg">
            Identify the technology stack of any website instantly. No paid APIs, just raw fingerprinting.
          </p>
        </div>

        <form onSubmit={handleScan} className="relative max-w-2xl mx-auto mb-16">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(''); // Clear error immediately on typing
              }}
              placeholder="Enter a URL (e.g., example.com)"
              className={`w-full bg-[#141414] border ${error ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:ring-blue-500/50'} rounded-2xl py-4 pl-12 pr-32 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 bg-white text-black font-medium px-6 py-2 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Scan'}
            </button>
          </div>
        </form>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 mb-8"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </motion.div>
          )}

          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-semibold text-white">Scan Results</h2>
                  <a href={results.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-sm mt-1 inline-block break-all">
                    {results.url}
                  </a>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Status</div>
                    <div className={`font-mono font-medium ${results.status >= 200 && results.status < 300 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                      {results.status}
                    </div>
                  </div>
                  <button
                    onClick={exportToMarkdown}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
                    title="Export to Markdown for LLM analysis"
                  >
                    <Download className="w-4 h-4" />
                    Export MD
                  </button>
                </div>
              </div>

              {Object.keys(groupedTech).length === 0 ? (
                <div className="text-center py-12 text-gray-500 border border-white/5 rounded-2xl bg-[#141414]">
                  No specific technologies detected from our fingerprint dictionary.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(groupedTech).map(([category, techs]) => (
                    <div key={category} className="bg-[#141414] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-white/5 rounded-lg">
                          {getCategoryIcon(category)}
                        </div>
                        <h3 className="text-lg font-medium text-white">{category}</h3>
                      </div>
                      
                      <div className="space-y-4">
                        {techs.map((tech) => (
                          <div key={tech.name} className="flex items-center justify-between group">
                            <span className="text-gray-300 font-medium">{tech.name}</span>
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                                  style={{ width: `${tech.confidence}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono text-gray-500 w-8 text-right">
                                {tech.confidence}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
