"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { PageContainer } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mic,
  Send,
  Loader2,
  Bot,
  User,
  StopCircle,
  MessageSquare,
  Sparkles,
  BrainCircuit,
  ArrowRight,
} from "lucide-react";

/* ────────────────────────────── Types ────────────────────────────── */

interface ChatMessage {
  role: "interviewer" | "candidate";
  content: string;
  timestamp: string;
}

interface StartSessionResponse {
  sessionId: string;
  firstQuestion: string;
  role: string;
}

interface SendMessageResponse {
  aiReply: string;
  isCompleted: boolean;
}

/* ────────────────────────────── ThinkingDots ─────────────────────── */

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-teal-500/70 dark:bg-teal-400/70 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

/* ────────────────────────────── Page ─────────────────────────────── */

export default function MockInterviewPage() {
  const { accessToken } = useAuth();
  const router = useRouter();

  // Setup state
  const [setupRole, setSetupRole] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [role, setRole] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Focus input when session starts
  useEffect(() => {
    if (sessionId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [sessionId]);

  const startSession = useCallback(async () => {
    if (!setupRole.trim() || !accessToken) return;
    setIsStarting(true);
    setError(null);

    try {
      const data = await apiClient<StartSessionResponse>(
        "/api/student/interview-prep/sessions",
        {
          method: "POST",
          body: JSON.stringify({ role: setupRole.trim(), jobId: null }),
          token: accessToken,
        }
      );
      setSessionId(data.sessionId);
      setRole(data.role);
      setMessages([
        {
          role: "interviewer",
          content: data.firstQuestion,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start session."
      );
    } finally {
      setIsStarting(false);
    }
  }, [setupRole, accessToken]);

  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || !sessionId || !accessToken || isSending) return;

    const userMessage: ChatMessage = {
      role: "candidate",
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsSending(true);
    setError(null);

    try {
      const data = await apiClient<SendMessageResponse>(
        `/api/student/interview-prep/sessions/${sessionId}/message`,
        {
          method: "POST",
          body: JSON.stringify({ studentReply: userMessage.content }),
          token: accessToken,
        }
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "interviewer",
          content: data.aiReply,
          timestamp: new Date().toISOString(),
        },
      ]);

      if (data.isCompleted) {
        setIsCompleted(true);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send message."
      );
    } finally {
      setIsSending(false);
    }
  }, [inputText, sessionId, accessToken, isSending]);

  const endInterview = useCallback(async () => {
    if (!sessionId || !accessToken) return;
    setIsEnding(true);
    setError(null);

    try {
      await apiClient(`/api/student/interview-prep/sessions/${sessionId}/end`, {
        method: "POST",
        token: accessToken,
      });
      router.push(
        `/student/interview-prep/mock/${sessionId}/report`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to end interview."
      );
      setIsEnding(false);
    }
  }, [sessionId, accessToken, router]);

  // ── Setup View ────────────────────────────────────────────────────
  if (!sessionId) {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="text-center space-y-3 pt-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-600/10 border border-teal-500/20 flex items-center justify-center">
              <Mic className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">
              Mock Interview
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Practice with an AI interviewer that adapts to your role. Get
              real-time feedback and a coaching report when you&#39;re done.
            </p>
          </div>

          {/* Setup Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border rounded-xl shadow-xl p-8 space-y-6">
            <div>
              <label
                htmlFor="setup-role"
                className="block text-sm font-medium mb-2"
              >
                What role are you interviewing for?
              </label>
              <Input
                id="setup-role"
                placeholder="e.g. Frontend Engineer, Backend Developer, Data Scientist..."
                value={setupRole}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSetupRole(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter") startSession();
                }}
                className="text-base"
              />
            </div>

            <Button
              onClick={startSession}
              disabled={isStarting || !setupRole.trim()}
              className="w-full btn-gradient-animate gap-2 h-12 text-base"
            >
              {isStarting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              {isStarting ? "Setting up interview..." : "Start Interview"}
            </Button>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 text-center">
                {error}
              </p>
            )}

            {/* Quick link to question bank */}
            <div className="pt-2 border-t">
              <button
                onClick={() =>
                  router.push("/student/interview-prep/questions")
                }
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors w-full justify-center"
              >
                <BrainCircuit className="w-4 h-4" />
                Or browse AI-generated question bank
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: <MessageSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
                title: "Turn-by-Turn",
                desc: "Natural conversation flow with follow-up questions",
              },
              {
                icon: <Bot className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
                title: "Adaptive AI",
                desc: "Questions tailored to your role and responses",
              },
              {
                icon: <Sparkles className="w-5 h-5 text-amber-500" />,
                title: "Coaching Report",
                desc: "Get detailed feedback on logic, accuracy & more",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border rounded-lg p-4 text-center space-y-2"
              >
                <div className="mx-auto w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-sm font-semibold">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  // ── Chat View ─────────────────────────────────────────────────────
  return (
    <PageContainer>
      <div className="flex flex-col h-[calc(100vh-12rem)] max-w-3xl mx-auto animate-in fade-in duration-300">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">AI Interviewer</h2>
              <p className="text-xs text-muted-foreground">
                Mock interview for{" "}
                <span className="font-medium text-teal-600 dark:text-teal-400">
                  {role}
                </span>
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={endInterview}
            disabled={isEnding || messages.length < 2}
            className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 border-red-200 dark:border-red-800"
          >
            {isEnding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <StopCircle className="w-3.5 h-3.5" />
            )}
            {isEnding ? "Generating Report..." : "End & Get Report"}
          </Button>
        </div>

        {/* Auto-end suggestion */}
        {isCompleted && (
          <div className="mx-4 mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              The interview has covered enough ground. Click{" "}
              <strong>&quot;End &amp; Get Report&quot;</strong> to receive your
              coaching feedback.
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                msg.role === "candidate" ? "flex-row-reverse" : ""
              }`}
              style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}
            >
              {/* Avatar */}
              <div
                className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  msg.role === "interviewer"
                    ? "bg-gradient-to-br from-teal-500 to-teal-600"
                    : "bg-gradient-to-br from-slate-500 to-slate-600"
                }`}
              >
                {msg.role === "interviewer" ? (
                  <Bot className="w-4 h-4 text-white" />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "interviewer"
                    ? "bg-white dark:bg-slate-800 border shadow-sm"
                    : "bg-teal-600 text-white"
                }`}
              >
                {msg.role === "interviewer" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-600 dark:text-teal-400 mb-1.5 uppercase tracking-wider">
                    <Bot className="w-3 h-3" /> AI Interviewer
                  </span>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Thinking animation */}
          {isSending && (
            <div className="flex gap-3 animate-in fade-in duration-200">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white dark:bg-slate-800 border shadow-sm rounded-xl">
                <ThinkingDots />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="px-4 py-3 border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-b-xl">
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 mb-2">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              id="chat-input"
              placeholder={
                isCompleted
                  ? "Interview completed — end session for your report"
                  : "Type your answer..."
              }
              value={inputText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setInputText(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={isSending || isEnding}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={isSending || isEnding || !inputText.trim()}
              size="icon"
              className="btn-gradient-animate h-10 w-10"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
