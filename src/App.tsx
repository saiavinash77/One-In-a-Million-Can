import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Ticket, Sparkles, Trophy, History, Send, X, RefreshCw } from "lucide-react";
import Character from "./components/Character";

interface Stats {
  totalTickets: number;
  streak: number;
  history: Array<{ date: string; word: string; content: string }>;
}

export default function App() {
  const [input, setInput] = useState("");
  const [targetWord, setTargetWord] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [isCompletedToday, setIsCompletedToday] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  const fetchDailyTask = async () => {
    try {
      const res = await fetch("/api/daily-task");
      const data = await res.json();
      setTargetWord(data.word);
      setIsCompletedToday(data.isCompleted);
    } catch (e) {
      console.error("Failed to fetch daily task", e);
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset all your progress? This cannot be undone.")) return;
    try {
      await fetch("/api/reset", { method: "POST" });
      await fetchStats();
      await fetchDailyTask();
      setShowHistory(false);
    } catch (e) {
      console.error("Reset failed", e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error("Failed to fetch stats", e);
    }
  };

  useEffect(() => {
    fetchDailyTask();
    fetchStats();

    const timer = setInterval(() => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async () => {
    if (input.toUpperCase() !== targetWord || isSubmitting) {
      setError(true);
      setTimeout(() => setError(false), 500);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: input }),
      });
      
      if (res.ok) {
        await fetchStats();
        setIsCompletedToday(true);
        setInput("");
      } else {
        setError(true);
        setTimeout(() => setError(false), 500);
      }
    } catch (e) {
      console.error("Submission failed", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = targetWord ? Math.min(input.length / targetWord.length, 1) : 0;
  const isCorrectSoFar = targetWord.startsWith(input.toUpperCase());

  return (
    <div className="min-h-screen bg-pattern flex flex-col items-center p-6 relative overflow-hidden">
      {/* Marquee Header */}
      <div className="w-full bg-black text-primary py-2 overflow-hidden whitespace-nowrap brutal-border-sm mb-12">
        <div className="marquee-track flex gap-8">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="font-display text-xl uppercase tracking-tighter">
              One in a Million Can • Daily Word Challenge • Unlock Your Ticket • Stay Consistent •
            </span>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-12">
        <div className="flex flex-col">
          <h1 className="font-display text-5xl uppercase leading-none tracking-tighter">One in a Million</h1>
          <span className="text-xs font-mono font-bold bg-secondary px-2 py-0.5 mt-1 brutal-border-sm inline-block w-fit">
            STREAK: {stats?.streak ?? 0} DAYS
          </span>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => setShowHistory(true)}
            className="brutal-btn bg-white flex items-center gap-2"
          >
            <History size={20} />
            <span className="hidden sm:inline">History</span>
          </button>
          <div className="brutal-border-sm bg-primary px-4 py-2 flex items-center gap-2">
            <Ticket size={20} />
            <span className="font-display text-2xl">{stats?.totalTickets ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <main className="flex flex-col items-center gap-8 max-w-2xl w-full z-10">
        <Character 
          happiness={isCompletedToday ? 1 : (isCorrectSoFar ? progress : 0)} 
          isPuzzled={!isCorrectSoFar && input.length > 0} 
        />
        
        <div className="w-full space-y-8 text-center">
          <div className="space-y-2">
            <h2 className="font-display text-4xl uppercase tracking-tight">
              {isCompletedToday ? "Word Unlocked!" : "Decrypt the Word"}
            </h2>
            <p className="font-mono text-sm font-bold text-accent uppercase">
              {isCompletedToday 
                ? `Today's word was ${targetWord}` 
                : `Length: ${targetWord.length} characters`}
            </p>
          </div>

          {!isCompletedToday && (
            <div className="relative max-w-md mx-auto">
              <motion.div
                animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                className="relative"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                  placeholder="Type here..."
                  className={`w-full brutal-border p-6 text-3xl font-display uppercase text-center focus:outline-none transition-colors ${
                    !isCorrectSoFar && input.length > 0 ? "bg-red-100" : "bg-white"
                  }`}
                  disabled={isSubmitting}
                />
                <button
                  onClick={handleSubmit}
                  className="absolute -right-4 -bottom-4 brutal-btn bg-accent text-white"
                >
                  <Send size={24} />
                </button>
              </motion.div>
              
              {/* Word Hint Slots */}
              <div className="flex justify-center gap-2 mt-6">
                {targetWord.split("").map((char, i) => (
                  <div 
                    key={i}
                    className={`w-8 h-10 brutal-border-sm flex items-center justify-center font-display text-xl ${
                      input[i]?.toUpperCase() === char 
                        ? "bg-primary" 
                        : (input[i] ? "bg-red-200" : "bg-white")
                    }`}
                  >
                    {input[i]?.toUpperCase() === char ? char : ""}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isCompletedToday && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative py-12"
            >
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full -z-10" />
              <div className="brutal-border bg-white p-8 ticket-shape relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-accent" />
                <div className="absolute bottom-0 left-0 w-full h-2 bg-accent" />
                
                <div className="space-y-4">
                  <div className="flex justify-center text-accent">
                    <Sparkles size={48} />
                  </div>
                  <h3 className="font-display text-5xl uppercase italic">Ticket #{stats?.totalTickets}</h3>
                  <div className="font-mono text-sm font-black border-y-2 border-black py-2">
                    VALID FOR: ONE MOMENT OF PRIDE
                  </div>
                  <p className="font-mono text-xs uppercase opacity-60">
                    Unlocked on {new Date().toLocaleDateString()}
                  </p>
                  <div className="pt-4">
                    <p className="font-mono text-2xl font-black bg-black text-white px-6 py-2 inline-block brutal-border-sm">
                      SN: {btoa(new Date().toISOString().split('T')[0] + targetWord).slice(0, 16).toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-center gap-4">
                <div className="brutal-border-sm bg-secondary px-4 py-2 font-mono text-xs font-bold uppercase">
                  Next Word in: {timeLeft}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-40"
              onClick={() => setShowHistory(false)}
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 h-[80vh] bg-white brutal-border border-b-0 z-50 p-8 overflow-y-auto rounded-t-[3rem]"
            >
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-12">
                  <div className="flex flex-col">
                    <h3 className="font-display text-6xl uppercase">Collection</h3>
                    <button 
                      onClick={handleReset}
                      className="text-xs font-mono font-bold text-red-500 uppercase hover:underline mt-2 text-left"
                    >
                      Reset All Progress
                    </button>
                  </div>
                  <button onClick={() => setShowHistory(false)} className="brutal-btn bg-red-400 p-2">
                    <X size={32} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {stats?.history.map((ticket, i) => (
                    <div key={i} className="brutal-border-sm p-6 bg-secondary/20 space-y-4 hover:rotate-1 transition-transform cursor-default">
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[10px] font-bold bg-black text-white px-2 py-0.5">{ticket.date}</span>
                        <Ticket size={16} />
                      </div>
                      <h4 className="font-display text-3xl uppercase leading-none">{ticket.word}</h4>
                      <div className="h-1 bg-black w-full" />
                      <p className="font-mono text-lg font-black bg-black text-white px-3 py-1 inline-block brutal-border-sm">
                        SN: {btoa(ticket.date + ticket.word).slice(0, 16).toUpperCase()}
                      </p>
                      <p className="font-mono text-[10px] uppercase opacity-60">Verified Authentic Ticket</p>
                    </div>
                  ))}
                  {stats?.history.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                      <p className="font-display text-2xl uppercase opacity-20">Your collection is empty</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Background Elements */}
      <div className="fixed -top-20 -left-20 w-64 h-64 bg-primary rounded-full blur-[100px] opacity-20 pointer-events-none" />
      <div className="fixed -bottom-20 -right-20 w-64 h-64 bg-secondary rounded-full blur-[100px] opacity-20 pointer-events-none" />
    </div>
  );
}
