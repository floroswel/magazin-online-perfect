import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, ThumbsUp, ThumbsDown, Loader2, Sparkles, Shield, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface ChatProduct {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  slug: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  products?: ChatProduct[];
  quickReplies?: string[];
  showContactForm?: boolean;
}

interface ChatSettings {
  enabled: boolean;
  name: string;
  accent_color: string;
  welcome_message: string;
  offline_message: string;
  quick_replies: string;
  gdpr_disclaimer: boolean;
}

const DEFAULT_SETTINGS: ChatSettings = {
  enabled: true,
  name: "Lucia",
  accent_color: "#0066FF",
  welcome_message: "Bună! Sunt Lucia, asistenta ta de la Mama Lucica 🕯️ Cu ce te pot ajuta azi?",
  offline_message: "În acest moment nu sunt disponibilă, dar îți răspund în cel mult 1 zi lucrătoare!",
  quick_replies: "Unde este comanda mea?|Cum returnez un produs?|Ce lumânare recomandați cadou?|Care sunt metodele de plată?|Cât durează livrarea?",
  gdpr_disclaimer: true,
};

function formatTime(date: Date) {
  return date.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
}

export default function LiveChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [rated, setRated] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [showGdpr, setShowGdpr] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(crypto.randomUUID());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Load settings from app_settings chatbot_* keys
  useEffect(() => {
    supabase
      .from("app_settings")
      .select("key, value_json")
      .like("key", "chatbot_%")
      .then(({ data }) => {
        if (!data?.length) return;
        const map: Record<string, string> = {};
        for (const r of data) {
          const v = r.value_json;
          map[r.key] = typeof v === "string" ? v : JSON.stringify(v);
        }
        setSettings({
          enabled: map.chatbot_enabled !== "false",
          name: map.chatbot_name || DEFAULT_SETTINGS.name,
          accent_color: map.chatbot_accent_color || DEFAULT_SETTINGS.accent_color,
          welcome_message: map.chatbot_welcome_message || DEFAULT_SETTINGS.welcome_message,
          offline_message: map.chatbot_offline_message || DEFAULT_SETTINGS.offline_message,
          quick_replies: map.chatbot_quick_replies || DEFAULT_SETTINGS.quick_replies,
          gdpr_disclaimer: map.chatbot_gdpr_disclaimer !== "false",
        });
      });

    const consent = localStorage.getItem("chatbot_gdpr_consent");
    if (consent === "true") setGdprAccepted(true);
  }, []);

  const handleOpen = () => {
    if (settings.gdpr_disclaimer && !gdprAccepted) {
      setShowGdpr(true);
      return;
    }
    openChat();
  };

  const openChat = () => {
    setOpen(true);
    setShowGdpr(false);
    setShowPulse(false);
    setUnreadCount(0);

    if (messages.length === 0) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: settings.welcome_message,
        timestamp: new Date(),
        quickReplies: settings.quick_replies.split("|").map(s => s.trim()).filter(Boolean),
      }]);
    }
  };

  const acceptGdpr = () => {
    setGdprAccepted(true);
    localStorage.setItem("chatbot_gdpr_consent", "true");
    openChat();
  };

  // Create session on first open
  useEffect(() => {
    if (open && messages.length <= 1 && gdprAccepted) {
      supabase.from("chatbot_sessions" as any).insert({
        id: sessionId.current,
        customer_id: user?.id || null,
        customer_email: user?.email || null,
        status: "active",
      } as any).then(() => {});
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, user, gdprAccepted]);

  const sendMessage = useCallback(async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText || loading || sessionEnded) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: msgText, timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const historyMsgs = newMessages
        .filter(m => m.id !== "welcome")
        .map(m => ({ role: m.role, content: m.content }));

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot-ai`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          message: msgText,
          conversationHistory: historyMsgs,
          sessionId: sessionId.current,
          userEmail: user?.email || null,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        if (resp.status === 429) toast.warning("Chatbot-ul este momentan ocupat. Încearcă din nou.");
        throw new Error(errData.message || "Error");
      }

      const data = await resp.json();

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message || "Mulțumesc! 😊",
        timestamp: new Date(),
        products: data.products,
        quickReplies: data.quickReplies,
        showContactForm: data.showContactForm,
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (!open) {
        setUnreadCount(c => c + 1);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Echipa noastră va reveni cu un răspuns. Contactează-ne la contact@mamalucica.ro 🙏",
        timestamp: new Date(),
        showContactForm: true,
      }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [input, loading, sessionEnded, messages, open, user]);

  const rateSatisfaction = async (rating: number) => {
    setRated(true);
    await (supabase.from("chatbot_sessions" as any).update({
      satisfaction_rating: rating, status: "resolved", ended_at: new Date().toISOString(),
    } as any).eq("id", sessionId.current) as any);
  };

  if (!settings.enabled) return null;

  const color = settings.accent_color;

  // Get quick replies from last assistant message
  const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");
  const currentQuickReplies = lastAssistant?.quickReplies || [];

  return (
    <>
      {/* ═══ GDPR Modal ═══ */}
      {showGdpr && !gdprAccepted && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40 animate-in fade-in duration-200">
          <div className="bg-background rounded-t-2xl md:rounded-2xl w-full md:w-[400px] p-5 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
                <Shield className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Protecția datelor tale</h3>
                <p className="text-xs text-muted-foreground">GDPR & Confidențialitate</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              Prin utilizarea chat-ului, accepți ca mesajele tale să fie procesate pentru a-ți oferi asistență.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 mb-4 ml-1">
              <li>🔒 Conversațiile sunt stocate securizat și temporar</li>
              <li>🚫 Nu partajăm datele cu terți</li>
              <li>🗑️ Poți solicita ștergerea oricând la contact@mamalucica.ro</li>
            </ul>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowGdpr(false)}>Renunță</Button>
              <Button size="sm" className="flex-1 text-white" style={{ backgroundColor: color }} onClick={acceptGdpr}>Accept și deschid chat-ul</Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ FAB Button ═══ */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-20 md:bottom-6 right-4 z-[45] group"
          aria-label="Deschide chat"
        >
          <div
            className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-300 relative"
            style={{ backgroundColor: color }}
          >
            <MessageCircle className="w-6 h-6 text-white" />
            {/* Pulse ring */}
            {showPulse && (
              <span
                className="absolute inset-0 rounded-full animate-ping opacity-30"
                style={{ backgroundColor: color }}
              />
            )}
            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-scale-in">
                {unreadCount}
              </span>
            )}
          </div>
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-foreground text-background text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
              Chat cu {settings.name} 🕯️
            </div>
          </div>
        </button>
      )}

      {/* ═══ Chat Window ═══ */}
      {open && (
        <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-4 z-[55] md:w-[400px] md:max-w-[calc(100vw-2rem)] md:h-[600px] md:max-h-[calc(100vh-6rem)] bg-background md:border md:border-border md:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">

          {/* ── Header ── */}
          <div className="px-4 py-3 flex items-center justify-between shrink-0" style={{ backgroundColor: color }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <span className="text-lg">🕯️</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-white">{settings.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" />
                  <p className="text-xs text-white/80">Online · Răspund instant</p>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Messages ── */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
            {messages.map(m => (
              <div key={m.id}>
                {/* Message bubble */}
                <div className={cn("flex gap-2.5", m.role === "user" ? "justify-end" : "justify-start")}>
                  {m.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm" style={{ backgroundColor: color + "15" }}>
                      <span className="text-sm">🕯️</span>
                    </div>
                  )}
                  <div className="max-w-[78%] space-y-1">
                    <div
                      className={cn(
                        "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                        m.role === "user"
                          ? "text-white rounded-br-sm"
                          : "bg-background text-foreground rounded-bl-sm border border-border/50"
                      )}
                      style={m.role === "user" ? { backgroundColor: color } : undefined}
                    >
                      {m.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert [&>p]:m-0 [&>p:not(:last-child)]:mb-1.5 [&>ul]:my-1 [&>ol]:my-1 [&>li]:my-0 [&>a]:underline [&>strong]:font-semibold" style={{ ["--tw-prose-links" as any]: color }}>
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : m.content}
                    </div>
                    {/* Timestamp */}
                    <p className={cn("text-[10px] text-muted-foreground px-1", m.role === "user" ? "text-right" : "text-left")}>
                      {formatTime(m.timestamp)}
                    </p>
                  </div>
                  {m.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* ── Product Cards ── */}
                {m.products && m.products.length > 0 && (
                  <div className="ml-10 mt-2">
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {m.products.map(p => (
                        <a
                          key={p.id}
                          href={`/produs/${p.slug}`}
                          className="flex-shrink-0 w-[130px] bg-background border border-border/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                        >
                          <div className="w-full h-[100px] bg-muted overflow-hidden">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">🕯️</div>
                            )}
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium line-clamp-2 leading-tight mb-1">{p.name}</p>
                            <p className="text-xs font-bold" style={{ color }}>{p.price} lei</p>
                            <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium" style={{ color }}>
                              <span>Vezi produs</span>
                              <ExternalLink className="w-3 h-3" />
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Contact Form CTA ── */}
                {m.showContactForm && (
                  <div className="ml-10 mt-2">
                    <a
                      href="/contact"
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors shadow-sm"
                    >
                      📧 Contactează echipa
                    </a>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: color + "15" }}>
                  <span className="text-sm">🕯️</span>
                </div>
                <div className="bg-background border border-border/50 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: color, opacity: 0.6, animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: color, opacity: 0.6, animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: color, opacity: 0.6, animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Satisfaction rating */}
            {sessionEnded && !rated && (
              <div className="text-center py-3 space-y-2 border-t border-border mt-2 pt-4">
                <p className="text-sm text-muted-foreground">Cum evaluezi conversația?</p>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => rateSatisfaction(1)} className="gap-1.5">
                    <ThumbsUp className="w-4 h-4" /> Utilă
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => rateSatisfaction(-1)} className="gap-1.5">
                    <ThumbsDown className="w-4 h-4" /> De îmbunătățit
                  </Button>
                </div>
              </div>
            )}
            {rated && (
              <p className="text-center text-sm text-muted-foreground py-2">Mulțumim pentru feedback! 🙏</p>
            )}
          </div>

          {/* ── Quick Replies ── */}
          {currentQuickReplies.length > 0 && !loading && (
            <div className="px-3 py-2 flex flex-wrap gap-1.5 border-t border-border/50 bg-background">
              {currentQuickReplies.map(qr => (
                <button
                  key={qr}
                  onClick={() => sendMessage(qr)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-current transition-colors font-medium"
                  style={{ color }}
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* ── Input ── */}
          <div className="p-3 border-t border-border shrink-0 bg-background">
            <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={sessionEnded ? "Conversație închisă" : `Scrie un mesaj...`}
                className="flex-1 rounded-full text-base border-border/70 focus-visible:ring-1"
                style={{ ["--tw-ring-color" as any]: color }}
                disabled={sessionEnded}
                maxLength={500}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || loading || sessionEnded}
                className="rounded-full shrink-0 text-white shadow-md hover:shadow-lg transition-shadow"
                style={{ backgroundColor: color }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
            <div className="flex items-center justify-center gap-1 mt-1.5">
              <Shield className="w-3 h-3 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">Conversație securizată · GDPR</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
