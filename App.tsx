/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";

const ROAST_SYSTEM = `You are a brutally honest, witty resume roaster AND career coach. 
When given a resume or job description text:
1. First ROAST it hard (3-4 savage but funny lines, like a comedy roast)
2. Then give a SCORE out of 10 with emoji
3. Then list 3 specific BRUTAL PROBLEMS (be specific and harsh)
4. Then give 3 PRO FIXES with exact rewritten examples
5. End with one HYPE LINE to motivate them

Format your response EXACTLY like this:
🔥 ROAST:
[roast lines here]

📊 SCORE: X/10 [emoji]

💀 BRUTAL PROBLEMS:
1. [problem]
2. [problem]  
3. [problem]

⚡ PRO FIXES:
1. [fix with example]
2. [fix with example]
3. [fix with example]

🚀 HYPE:
[one motivating line]`;

interface RoastResult {
  roast: string;
  score: string;
  problems: string[];
  fixes: string[];
  hype: string;
}

export default function App() {
  const [resume, setResume] = useState(() => localStorage.getItem("resume_roaster_resume") || "");
  const [jobDescription, setJobDescription] = useState(() => localStorage.getItem("resume_roaster_jd") || "");
  const [result, setResult] = useState<RoastResult | null>(null);

  useEffect(() => {
    localStorage.setItem("resume_roaster_resume", resume);
  }, [resume]);

  useEffect(() => {
    localStorage.setItem("resume_roaster_jd", jobDescription);
  }, [jobDescription]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [glitch, setGlitch] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const parseResult = (text: string): RoastResult => {
    const sections: RoastResult = {
      roast: "",
      score: "",
      problems: [],
      fixes: [],
      hype: "",
    };
    
    const roastMatch = text.match(/🔥 ROAST:\n([\s\S]*?)(?=📊 SCORE:)/);
    const scoreMatch = text.match(/📊 SCORE: (.+)/);
    const problemsMatch = text.match(/💀 BRUTAL PROBLEMS:\n([\s\S]*?)(?=⚡ PRO FIXES:)/);
    const fixesMatch = text.match(/⚡ PRO FIXES:\n([\s\S]*?)(?=🚀 HYPE:)/);
    const hypeMatch = text.match(/🚀 HYPE:\n([\s\S]*?)$/);

    if (roastMatch) sections.roast = roastMatch[1].trim();
    if (scoreMatch) sections.score = scoreMatch[1].trim();
    if (problemsMatch) {
      sections.problems = problemsMatch[1].trim().split("\n").filter(l => l.trim()).map(l => l.replace(/^\d+\.\s*/, ""));
    }
    if (fixesMatch) {
      sections.fixes = fixesMatch[1].trim().split("\n").filter(l => l.trim()).map(l => l.replace(/^\d+\.\s*/, ""));
    }
    if (hypeMatch) sections.hype = hypeMatch[1].trim();
    return sections;
  };

  const handleRoast = async () => {
    if (!resume.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setGlitch(true);
    setTimeout(() => setGlitch(false), 600);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = jobDescription.trim() 
        ? `Here is my resume/profile:\n\n${resume}\n\nAnd here is the job description I'm targeting:\n\n${jobDescription}\n\nPlease roast my resume specifically in the context of this job description.`
        : `Here is my resume/profile:\n\n${resume}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: ROAST_SYSTEM,
          temperature: 0.9,
        },
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");
      setResult(parseResult(text));
    } catch (e) {
      console.error(e);
      setError("AI failed to roast you. You're so bad even the AI gave up. (Or check your API key/connection)");
    } finally {
      setLoading(false);
    }
  };

  const scoreNum = result?.score ? parseInt(result.score) : null;
  const scoreColor = scoreNum !== null ? (scoreNum <= 4 ? "#FF3B3B" : scoreNum <= 6 ? "#FF9500" : "#00E676") : "#FF3B3B";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      color: "#fff",
      fontFamily: "'Courier New', monospace",
      padding: "0",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Share+Tech+Mono&display=swap');
        
        @keyframes flicker {
          0%, 95%, 100% { opacity: 1; }
          96% { opacity: 0.4; }
          97% { opacity: 1; }
          98% { opacity: 0.2; }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-3px, 2px); }
          40% { transform: translate(3px, -2px); }
          60% { transform: translate(-2px, 3px); }
          80% { transform: translate(2px, -1px); }
          100% { transform: translate(0); }
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(255,59,59,0.4); }
          70% { box-shadow: 0 0 0 20px rgba(255,59,59,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,59,59,0); }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .roast-btn:hover {
          background: #FF3B3B !important;
          transform: scale(1.03) !important;
          box-shadow: 0 0 40px rgba(255,59,59,0.6) !important;
        }
        .roast-btn:active { transform: scale(0.97) !important; }
        .section-card {
          animation: fadeSlide 0.4s ease forwards;
        }
        .glitch-text {
          animation: ${glitch ? 'glitch 0.1s steps(1) 5' : 'none'};
        }
        textarea::-webkit-scrollbar { width: 6px; }
        textarea::-webkit-scrollbar-track { background: #111; }
        textarea::-webkit-scrollbar-thumb { background: #FF3B3B55; border-radius: 3px; }
        .scanline {
          position: fixed; top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(transparent, rgba(255,59,59,0.15), transparent);
          animation: scanline 4s linear infinite;
          pointer-events: none; z-index: 100;
        }
      `}</style>

      <div className="scanline" />

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #FF3B3B33",
        padding: "24px 32px",
        background: "linear-gradient(180deg, #FF3B3B08 0%, transparent 100%)",
        display: "flex",
        alignItems: "center",
        gap: 16,
        animation: "flicker 8s infinite",
      }}>
        <div style={{
          width: 48, height: 48,
          border: "2px solid #FF3B3B",
          borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24,
          boxShadow: "0 0 20px #FF3B3B55",
          animation: "pulse-ring 2s infinite",
        }}>🔥</div>
        <div>
          <div style={{
            fontFamily: "'Black Ops One', cursive",
            fontSize: "clamp(22px, 4vw, 36px)",
            letterSpacing: 3,
            color: "#FF3B3B",
            textShadow: "0 0 20px #FF3B3B88",
            lineHeight: 1,
          }} className="glitch-text">
            RESUME ROASTER
          </div>
          <div style={{ fontSize: 11, color: "#666", letterSpacing: 2, marginTop: 4 }}>
            AI-POWERED • BRUTALLY HONEST • NO MERCY MODE
          </div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "#FF3B3B", letterSpacing: 2 }}>STATUS</div>
          <div style={{ fontSize: 12, color: "#00E676", letterSpacing: 1 }}>● ONLINE</div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {/* Warning Banner */}
        <div style={{
          border: "1px solid #FF3B3B44",
          borderLeft: "4px solid #FF3B3B",
          background: "#FF3B3B08",
          padding: "12px 16px",
          borderRadius: 4,
          marginBottom: 28,
          fontSize: 12,
          color: "#FF6B6B",
          letterSpacing: 1,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          ⚠️ WARNING: THIS AI HAS ZERO CHILL. YOUR EGO WILL NOT SURVIVE. RESULTS MAY CAUSE IMMEDIATE RESUME DELETION.
        </div>

        {/* Input Area */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24, marginBottom: 24 }}>
          {/* Resume Field */}
          <div>
            <div style={{ fontSize: 11, color: "#FF3B3B", letterSpacing: 3, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span>▶</span> PASTE YOUR RESUME / LINKEDIN BIO
              <span style={{ animation: "blink 1s infinite", color: "#FF3B3B" }}>_</span>
            </div>
            <textarea
              ref={textareaRef}
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder={`Paste your resume here...\n\nExample:\nJohn Doe | Frontend Developer | 2 years exp\n- Made websites\n- Used React sometimes...`}
              rows={8}
              style={{
                width: "100%",
                background: "#0D0D0D",
                border: "1px solid #FF3B3B33",
                borderRadius: 8,
                padding: "16px",
                color: "#ccc",
                fontSize: 13,
                fontFamily: "'Share Tech Mono', monospace",
                resize: "vertical",
                outline: "none",
                lineHeight: 1.7,
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "#FF3B3B88"}
              onBlur={e => e.target.style.borderColor = "#FF3B3B33"}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#444" }}>
              <span>{resume.length} characters</span>
              <span>{resume.split(/\s+/).filter(Boolean).length} words</span>
            </div>
          </div>

          {/* Job Description Field */}
          <div>
            <div style={{ fontSize: 11, color: "#00E676", letterSpacing: 3, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span>▶</span> TARGET JOB DESCRIPTION (OPTIONAL)
              <span style={{ animation: "blink 1s infinite", color: "#00E676" }}>_</span>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder={`Paste the job description you're applying for...\n\nExample:\nWe are looking for a Senior React Developer with 5+ years of experience in high-scale applications...`}
              rows={8}
              style={{
                width: "100%",
                background: "#0D0D0D",
                border: "1px solid #00E67633",
                borderRadius: 8,
                padding: "16px",
                color: "#ccc",
                fontSize: 13,
                fontFamily: "'Share Tech Mono', monospace",
                resize: "vertical",
                outline: "none",
                lineHeight: 1.7,
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "#00E67688"}
              onBlur={e => e.target.style.borderColor = "#00E67633"}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#444" }}>
              <span>{jobDescription.length} characters</span>
              <span>{jobDescription.split(/\s+/).filter(Boolean).length} words</span>
            </div>
          </div>
        </div>

        {/* Roast Button */}
        <button
          onClick={handleRoast}
          disabled={loading || !resume.trim()}
          className="roast-btn"
          style={{
            width: "100%",
            padding: "18px",
            background: loading ? "#1a0000" : "#CC0000",
            border: "2px solid #FF3B3B",
            borderRadius: 8,
            color: "#fff",
            fontSize: 16,
            fontFamily: "'Black Ops One', cursive",
            letterSpacing: 4,
            cursor: loading || !resume.trim() ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            boxShadow: "0 0 20px #FF3B3B44",
            opacity: !resume.trim() ? 0.5 : 1,
            marginBottom: 36,
          }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <span style={{ animation: "blink 0.5s infinite" }}>⚡</span>
              AI IS DESTROYING YOUR RESUME...
              <span style={{ animation: "blink 0.5s infinite 0.25s" }}>⚡</span>
            </span>
          ) : (
            "🔥 ROAST MY RESUME"
          )}
        </button>

        {error && (
          <div style={{ color: "#FF3B3B", background: "#FF3B3B11", border: "1px solid #FF3B3B44", borderRadius: 8, padding: 16, marginBottom: 24, fontSize: 13 }}>
            ❌ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Score Hero */}
            {result.score && (
              <div className="section-card" style={{ 
                background: `linear-gradient(135deg, ${scoreColor}11, #0D0D0D)`,
                border: `2px solid ${scoreColor}`,
                borderRadius: 12,
                padding: "24px",
                textAlign: "center",
                boxShadow: `0 0 40px ${scoreColor}22`,
              }}>
                <div style={{ fontSize: 11, color: "#666", letterSpacing: 3, marginBottom: 8 }}>RESUME SCORE</div>
                <div style={{ fontFamily: "'Black Ops One', cursive", fontSize: "clamp(48px, 10vw, 80px)", color: scoreColor, textShadow: `0 0 30px ${scoreColor}`, lineHeight: 1 }}>
                  {result.score}
                </div>
                <div style={{ fontSize: 13, color: "#666", marginTop: 8 }}>
                  {scoreNum !== null && scoreNum <= 3 ? "💀 CERTIFIED TRASH" : scoreNum !== null && scoreNum <= 5 ? "😬 NEEDS INTENSIVE CARE" : scoreNum !== null && scoreNum <= 7 ? "😐 MEH, FIXABLE" : "🔥 NOT BAD ACTUALLY"}
                </div>
              </div>
            )}

            {/* Roast */}
            {result.roast && (
              <div className="section-card" style={{ 
                background: "#0D0D0D",
                border: "1px solid #FF3B3B44",
                borderLeft: "4px solid #FF3B3B",
                borderRadius: 8,
                padding: "20px",
              }}>
                <div style={{ fontSize: 11, color: "#FF3B3B", letterSpacing: 3, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  🔥 THE ROAST
                </div>
                <div style={{ fontSize: 14, color: "#ddd", lineHeight: 1.8, fontFamily: "'Share Tech Mono', monospace", whiteSpace: "pre-line" }}>
                  {result.roast}
                </div>
              </div>
            )}

            {/* Problems */}
            {result.problems.length > 0 && (
              <div className="section-card" style={{ 
                background: "#0D0D0D",
                border: "1px solid #FF950044",
                borderLeft: "4px solid #FF9500",
                borderRadius: 8,
                padding: "20px",
              }}>
                <div style={{ fontSize: 11, color: "#FF9500", letterSpacing: 3, marginBottom: 14 }}>💀 BRUTAL PROBLEMS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {result.problems.map((p, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <span style={{ color: "#FF9500", fontFamily: "'Black Ops One', cursive", minWidth: 24, marginTop: 1 }}>0{i + 1}</span>
                      <span style={{ fontSize: 13, color: "#bbb", lineHeight: 1.6, fontFamily: "'Share Tech Mono', monospace" }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fixes */}
            {result.fixes.length > 0 && (
              <div className="section-card" style={{ 
                background: "#0D0D0D",
                border: "1px solid #00E67644",
                borderLeft: "4px solid #00E676",
                borderRadius: 8,
                padding: "20px",
              }}>
                <div style={{ fontSize: 11, color: "#00E676", letterSpacing: 3, marginBottom: 14 }}>⚡ PRO FIXES</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {result.fixes.map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <span style={{ color: "#00E676", fontFamily: "'Black Ops One', cursive", minWidth: 24, marginTop: 1 }}>0{i + 1}</span>
                      <span style={{ fontSize: 13, color: "#bbb", lineHeight: 1.6, fontFamily: "'Share Tech Mono', monospace" }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hype */}
            {result.hype && (
              <div className="section-card" style={{ 
                background: "linear-gradient(135deg, #7C3AED22, #0D0D0D)",
                border: "1px solid #7C3AED66",
                borderRadius: 12,
                padding: "20px 24px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 11, color: "#7C3AED", letterSpacing: 3, marginBottom: 10 }}>🚀 YOUR HYPE LINE</div>
                <div style={{ fontSize: 15, color: "#ddd", fontStyle: "italic", lineHeight: 1.6, fontFamily: "'Share Tech Mono', monospace" }}>
                  "{result.hype}"
                </div>
              </div>
            )}

            {/* Share nudge */}
            <div style={{
              border: "1px dashed #333",
              borderRadius: 8,
              padding: "16px",
              textAlign: "center",
              fontSize: 12,
              color: "#555",
            }}>
              Built with React + Gemini AI • Share your roast score on LinkedIn 🔥
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
