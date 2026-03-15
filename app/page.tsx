'use client';

import { useState } from 'react';
import { Search, Loader2, Shield, Server, Code, Layout, Database, Activity, AlertCircle, Eye, FileText, Cpu, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ScanResult = {
  url: string;
  status: number;
  technologies: Record<string, { category: string; confidence: number }>;
  ogImage: string | null;
  inputs: { tag: string; name: string | null; id: string | null }[];
  foundVariables: string[];
  foundEnterprise: string[];
  hasGenericInputs: boolean;
  isModern: boolean;
};

export default function Page() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');

  const isValidUrl = (urlString: string) => {
    try {
      const urlToTest = new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
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

  const groupedTech = results ? Object.entries(results.technologies).reduce((acc, [name, info]) => {
    if (!acc[info.category]) acc[info.category] = [];
    acc[info.category].push({ name, confidence: info.confidence });
    return acc;
  }, {} as Record<string, { name: string; confidence: number }[]>) : {};

  const exportToMarkdown = () => {
    if (!results) return;

    let md = `# Forensic Report: Systemic Evidence Finder\n\n`;
    md += `**Target URL:** ${results.url}\n\n`;
    md += `**HTTP Status:** ${results.status}\n\n`;
    md += `**Scan Date:** ${new Date().toLocaleString()}\n\n`;

    md += `## Technical Capability Score\n\n`;
    if (results.isModern) {
      md += `**Score:** HIGH / DYNAMIC\n\n`;
      md += `Case Expansion is a Configuration Task, not a Codebase Limitation.\n\n`;
    } else {
      md += `**Score:** MODERATE / STATIC\n\n`;
      md += `System relies on traditional server-rendered views. Expansion may require codebase modifications.\n\n`;
    }

    if (results.foundEnterprise.length > 0) {
      md += `## System Architecture\n\n`;
      md += `**Enterprise Signatures Detected:** ${results.foundEnterprise.join(', ')}\n\n`;
      md += `These are multi-tenant platforms designed for modular case-handling. The architecture supports dynamic configuration of case types without core system rewrites.\n\n`;
    }

    md += `## Granular Data Discovery\n\n`;
    if (results.foundVariables.length > 0) {
      md += `The following global state variables were detected:\n\n`;
      results.foundVariables.forEach(v => {
        md += `* ${v}\n`;
      });
      md += `\n`;
    } else {
      md += `No global state variables detected.\n\n`;
    }

    md += `## Input Field Audit\n\n`;
    if (results.hasGenericInputs) {
      md += `**FLAG:** Generic naming conventions detected (e.g., caseType, partyRole). This is evidence that the UI is dynamically rendered and capable of supporting any case category (Domestic, Eviction, etc.).\n\n`;
    }
    if (results.inputs.length > 0) {
      md += `Detected Fields:\n\n`;
      results.inputs.forEach(input => {
        md += `* <${input.tag} ${input.name ? `name="${input.name}"` : ''} ${input.id ? `id="${input.id}"` : ''} />\n`;
      });
      md += `\n`;
    } else {
      md += `No relevant input fields detected.\n\n`;
    }

    md += `## Technology Stack\n\n`;
    if (Object.keys(groupedTech).length === 0) {
      md += `No specific technologies detected from our fingerprint dictionary.\n\n`;
    } else {
      Object.entries(groupedTech).forEach(([category, techs]) => {
        md += `### ${category}\n\n`;
        techs.forEach(tech => {
          md += `* ${tech.name} (Confidence: ${tech.confidence}%)\n`;
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
      a.download = `forensic-report-${domain}.md`;
    } catch {
      a.download = `forensic-report.md`;
    }
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Backend': return <Database className="w-4 h-4 text-blue-400" />;
      case 'Frontend': return <Layout className="w-4 h-4 text-pink-400" />;
      case 'CMS': return <Code className="w-4 h-4 text-emerald-400" />;
      case 'Server': return <Server className="w-4 h-4 text-purple-400" />;
      case 'CDN': return <Shield className="w-4 h-4 text-orange-400" />;
      case 'Analytics': return <Activity className="w-4 h-4 text-yellow-400" />;
      default: return <Code className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-[#00FF41]/30">
      <div className="max-w-5xl mx-auto p-6 pt-16">
        
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-[#111] rounded-2xl mb-4 border border-[#333]">
            <Eye className="w-8 h-8 text-[#00FF41]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Systemic Evidence Finder
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Legal-Forensic Website Technology Profiler. Identify dynamic rendering capabilities, enterprise signatures, and global state configurations.
          </p>
        </div>

        <form onSubmit={handleScan} className="relative max-w-3xl mx-auto mb-12">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter target URL (e.g., courts.example.gov)"
              className={`w-full bg-[#111] border ${error ? 'border-red-500/50 focus:ring-red-500/50' : 'border-[#333] focus:ring-[#00FF41]/50'} rounded-xl py-4 pl-12 pr-36 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:border-transparent transition-all font-mono text-sm`}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 bg-[#00FF41] text-black font-bold px-6 py-2 rounded-lg hover:bg-[#00cc33] focus:outline-none focus:ring-2 focus:ring-[#00FF41]/50 disabled:opacity-50 transition-all flex items-center gap-2 text-sm uppercase tracking-wider"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Initiate'}
            </button>
          </div>
        </form>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-3xl mx-auto p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 mb-8 font-mono text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </motion.div>
          )}

          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#333]">
                <div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-widest">Forensic Report</h2>
                  <a href={results.url} target="_blank" rel="noreferrer" className="text-[#00FF41] hover:underline text-sm mt-1 inline-block break-all font-mono">
                    {results.url}
                  </a>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase tracking-widest">HTTP Status</div>
                    <div className={`font-mono font-bold text-lg ${results.status >= 200 && results.status < 300 ? 'text-[#00FF41]' : 'text-yellow-400'}`}>
                      {results.status}
                    </div>
                  </div>
                  <button
                    onClick={exportToMarkdown}
                    className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-[#333] hover:bg-[#222] text-white rounded-lg transition-colors text-sm font-medium uppercase tracking-wider"
                    title="Export to Markdown for LLM analysis"
                  >
                    <FileText className="w-4 h-4 text-[#00FF41]" />
                    Export
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Thumbnail & Score */}
                <div className="space-y-6 lg:col-span-1">
                  
                  {/* Evidence Thumbnail */}
                  <div className="w-full h-48 bg-[#111] border border-[#333] rounded-xl overflow-hidden relative flex items-center justify-center">
                    {results.ogImage ? (
                      <img src={results.ogImage} alt="Open Graph" className="object-cover w-full h-full opacity-40" />
                    ) : (
                      <div className="text-center font-mono text-xs text-gray-500">
                        <div className="animate-pulse mb-2 text-[#00FF41]">SCANNING TARGET...</div>
                        <div className="break-all px-4">{results.url}</div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 font-mono text-xs text-[#00FF41] flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3" /> TARGET ACQUIRED
                    </div>
                  </div>

                  {/* Technical Capability Score */}
                  <div className="p-5 bg-[#111] border border-[#333] rounded-xl">
                    <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                      <Cpu className="w-4 h-4" /> Technical Capability Score
                    </h3>
                    {results.isModern ? (
                      <div className="font-mono">
                        <div className="text-xl font-bold text-[#00FF41] mb-2">HIGH / DYNAMIC</div>
                        <p className="text-xs text-gray-400 leading-relaxed">Case Expansion is a Configuration Task, not a Codebase Limitation.</p>
                      </div>
                    ) : (
                      <div className="font-mono">
                        <div className="text-xl font-bold text-yellow-400 mb-2">MODERATE / STATIC</div>
                        <p className="text-xs text-gray-400 leading-relaxed">System relies on traditional server-rendered views. Expansion may require codebase modifications.</p>
                      </div>
                    )}
                  </div>

                  {/* System Architecture */}
                  {results.foundEnterprise.length > 0 && (
                    <div className="p-5 bg-[#0a1526] border border-blue-500/30 rounded-xl">
                      <h3 className="text-xs uppercase tracking-widest text-blue-400 mb-3 flex items-center gap-2">
                        <Server className="w-4 h-4" /> System Architecture
                      </h3>
                      <div className="font-mono text-xs text-gray-300 space-y-3">
                        <p>Enterprise Signature Detected:<br/><span className="text-white font-bold text-sm">{results.foundEnterprise.join(', ')}</span></p>
                        <p className="text-blue-200/70 leading-relaxed">These are multi-tenant platforms designed for modular case-handling. The architecture supports dynamic configuration of case types without core system rewrites.</p>
                      </div>
                    </div>
                  )}

                </div>

                {/* Right Column: Audits & Tech */}
                <div className="space-y-6 lg:col-span-2">
                  
                  {/* Granular Data Discovery */}
                  <div className="p-5 bg-[#111] border border-[#333] rounded-xl">
                    <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                      <Database className="w-4 h-4" /> Granular Data Discovery
                    </h3>
                    <div className="font-mono text-sm space-y-2">
                      {results.foundVariables.length > 0 ? (
                        results.foundVariables.map((v, i) => (
                          <div key={i} className="flex items-center gap-3 bg-[#050505] p-2 rounded border border-[#222]">
                            <span className="text-[#00FF41] font-bold">[+]</span> <span className="text-gray-200">{v}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-600 text-xs">No global state variables detected.</div>
                      )}
                    </div>
                  </div>

                  {/* Input Field Audit */}
                  <div className="p-5 bg-[#111] border border-[#333] rounded-xl">
                    <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                      <Layout className="w-4 h-4" /> Input Field Audit
                    </h3>
                    {results.hasGenericInputs && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 font-mono text-xs leading-relaxed">
                        <strong>FLAG:</strong> Generic naming conventions detected (e.g., caseType, partyRole). This is evidence that the UI is dynamically rendered and capable of supporting any case category (Domestic, Eviction, etc.).
                      </div>
                    )}
                    <div className="max-h-48 overflow-y-auto font-mono text-xs text-gray-400 space-y-1.5 pr-2">
                      {results.inputs.length > 0 ? (
                        results.inputs.map((input, i) => (
                          <div key={i} className="bg-[#050505] p-2 rounded border border-[#222] truncate">
                            <span className="text-pink-400">&lt;{input.tag}</span>
                            {input.name && <span> <span className="text-blue-300">name</span>=<span className="text-yellow-300">"{input.name}"</span></span>}
                            {input.id && <span> <span className="text-blue-300">id</span>=<span className="text-yellow-300">"{input.id}"</span></span>}
                            <span className="text-pink-400"> /&gt;</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-600">No relevant input fields detected.</div>
                      )}
                    </div>
                  </div>

                  {/* Technology Stack */}
                  <div className="p-5 bg-[#111] border border-[#333] rounded-xl">
                    <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                      <Code className="w-4 h-4" /> Technology Stack
                    </h3>
                    {Object.keys(groupedTech).length === 0 ? (
                      <div className="text-center py-8 text-gray-600 font-mono text-xs">
                        No specific technologies detected from our fingerprint dictionary.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(groupedTech).map(([category, techs]) => (
                          <div key={category} className="bg-[#050505] border border-[#222] rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              {getCategoryIcon(category)}
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{category}</h4>
                            </div>
                            <div className="space-y-3">
                              {techs.map((tech) => (
                                <div key={tech.name} className="flex items-center justify-between">
                                  <span className="text-gray-200 font-mono text-xs">{tech.name}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-1 bg-[#222] rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-[#00FF41] rounded-full"
                                        style={{ width: `${tech.confidence}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] font-mono text-gray-500 w-6 text-right">
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
                  </div>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
