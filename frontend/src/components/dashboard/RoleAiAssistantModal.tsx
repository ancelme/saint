import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Loader2,
  Copy,
  Check,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Building,
  GraduationCap,
  Wallet,
  CalendarCheck2
} from 'lucide-react';
import { askRoleAssistant } from '../../services/api';
import { Role } from '../../types';

interface RoleAiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: Role;
  userName: string;
}

export const RoleAiAssistantModal: React.FC<RoleAiAssistantModalProps> = ({
  isOpen,
  onClose,
  userRole,
  userName,
}) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: getWelcomeMessage(userRole, userName),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const roleTitle = getRoleTitle(userRole);
  const suggestedChips = getSuggestedChips(userRole);

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isLoading) return;

    const userMsg = {
      sender: 'user' as const,
      text: prompt,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const res = await askRoleAssistant(prompt);
      const aiMsg = {
        sender: 'ai' as const,
        text: res.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: 'Muraho. I encountered a momentary connection difficulty. Please try again or reach the school administration directly.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] z-10"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Authorized AI Assistant
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{roleTitle}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-normal">
                    {userName}
                  </span>
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
            <span className="text-slate-400 font-semibold shrink-0 text-[11px] flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Suggested:
            </span>
            {suggestedChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(chip)}
                disabled={isLoading}
                className="px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-300 shrink-0 text-[11px] font-medium transition-all shadow-2xs"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Message Thread */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[10px] opacity-70">
                    <span>{msg.time}</span>
                    {msg.sender === 'ai' && (
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.text, idx)}
                        className="inline-flex items-center gap-1 hover:opacity-100 transition-opacity"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 items-center text-xs text-slate-500 italic">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Synthesizing authorized response from school records...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Footer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={e => setInputPrompt(e.target.value)}
                placeholder={`Ask ${roleTitle}...`}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={isLoading || !inputPrompt.trim()}
                className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

function getRoleTitle(role: Role): string {
  switch (role) {
    case 'owner':
    case 'super_admin':
      return 'AI Executive School Assistant';
    case 'admin':
    case 'head_teacher':
      return 'AI Academic & Administrative Assistant';
    case 'teacher':
      return 'AI Educator & Lesson Planner';
    case 'accountant':
      return 'AI Bursar & Financial Assistant';
    case 'student':
      return 'AI Pupil Study Companion';
    case 'parent':
      return 'AI Parent & Progress Assistant';
    default:
      return 'AI School Assistant';
  }
}

function getWelcomeMessage(role: Role, userName: string): string {
  switch (role) {
    case 'owner':
    case 'super_admin':
      return `Welcome, School Owner ${userName}. I am your Executive AI School Assistant. I can summarize total enrollment across Nursery and Primary streams, analyze tuition collection rates via MTN MoMo, review teacher activity, and track our PLE excellence targets. What would you like to inspect today?`;
    case 'admin':
    case 'head_teacher':
      return `Muraho, Head Teacher ${userName}. I am ready to assist with daily school governance: tracking morning attendance in Kibondo, reviewing pending admissions applications, generating parent circular drafts, and monitoring CBC syllabus coverage.`;
    case 'teacher':
      return `Muraho Mwalimu ${userName}! I am here to help you draft REB Competence-Based Curriculum (CBC) lesson plans, formulate engaging science experiments, summarize class attendance trends, or generate quiz questions for your pupils.`;
    case 'accountant':
      return `Greetings, Bursar ${userName}. I assist with fee billing schedules, calculating collection percentages, analyzing outstanding termly balances, and preparing parent MTN Mobile Money payment reminders.`;
    case 'student':
      return `Hello ${userName}! 🎒 Welcome to your AI Study Companion! I can explain tricky math problems, practice English grammar, tell you about Rwandan history, or give you quick revision quizzes for your exams. What are you studying today?`;
    case 'parent':
      return `Muraho Umubyeyi ${userName}! As your AI Parent Assistant, I can explain the daily schedule, summarize your child's attendance and academic progress, explain fee contributions, or answer questions about school activities in Kibondo. How may I help you?`;
    default:
      return `Hello ${userName}! How can I assist you with St. Silas Private Primary School today?`;
  }
}

function getSuggestedChips(role: Role): string[] {
  switch (role) {
    case 'owner':
    case 'super_admin':
      return [
        'Summarize today school performance',
        'Analyze Term 2 fee collection rate',
        'Review teacher attendance & roster',
        'Identify students with unpaid balances',
      ];
    case 'admin':
    case 'head_teacher':
      return [
        'Draft an announcement for parents regarding mid-term',
        'Check pending pupil admissions status',
        'Summary of morning attendance rate',
        'Teacher timetable allocation check',
      ];
    case 'teacher':
      return [
        'Generate a P5 SET lesson plan on Water Cycle',
        'Create 5 practice questions for Primary 4 Math',
        'How to support a pupil who is late',
        'Interactive Kinyarwanda reading game idea',
      ];
    case 'accountant':
      return [
        'Summarize unpaid fees by grade level',
        'Explain payment procedure via MTN MoMo *182#',
        'Cost analysis of daily feeding program',
        'Draft payment reminder SMS for parents',
      ];
    case 'student':
      return [
        'Explain fractions with a simple example',
        'Give me 3 English vocabulary practice words',
        'What are the key facts about Volcanoes in Rwanda?',
        'Tips for scoring distinction in Primary 6 PLE',
      ];
    case 'parent':
      return [
        'What is included in the daily feeding program?',
        'How do I pay term fees via MTN MoMo?',
        'What time do classes end on Friday?',
        'How to help my child practice English reading at home',
      ];
    default:
      return ['School information', 'Fee structure', 'School calendar'];
  }
}
