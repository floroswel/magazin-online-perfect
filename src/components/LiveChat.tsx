import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatSettings {
  enabled: boolean;
  assistant_name: string;
  widget_color: string;
  welcome_message: string;
  offline_message: string;
}

const QUICK_REPLIES = [
  "Unde e comanda mea?",
  "Politica de retur",
  "Vreau să returnez un produs",
  "Ce metode de plată acceptați?",
  "Cât costă livrarea?",
];

export default function LiveChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<ChatSettings | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [rated, setRated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(crypto.randomUUID());
  const messageCount = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Load settings
  useEffect(() => {
    (supabase.from("chatbot_settings" as any).select("enabled, assistant_name, widget_color, welcome_message, offline_message").limit(1).maybeSingle() as any)
      .then(({ data }: any) => {
        if (data) {
          setSettings(data);
          if (data.enabled) {
            setMessages([{ id: "welcome", role: "assistant", content: data.welcome_message }]);
          }
        } else {
          const defaults = { enabled: true, assistant_name: "Asistent", widget_color: "#6366f1", welcome_message: "Bună! 👋 Cu ce te pot ajuta azi?", offline_message: "" };
          setSettings(defaults);
          setMessages([{ id: "welcome", role: "assistant", content: defaults.welcome_message }]);
        }
      });
  }, []);

  // Create session on first open
  useEffect(() => {
    if (open && messageCount.current === 0) {
      (supabase.from("chatbot_sessions" as any).insert({
        id: sessionId.current,
        customer_id: user?.id || null,
        customer_email: user?.email || null,
        status: "active",
      } as any) as any).then(() => {});
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, user]);

  const sendMessage = async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText || loading || sessionEnded) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: msgText };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    messageCount.current++;

    // Save user message
    (supabase.from("chatbot_messages" as any).insert({
      session_id: sessionId.current,
      role: "user",
      content: userMsg.content,
    } as any) as any).then(() => {});

    try {
      const { data, error } = await supabase.functions.invoke("chat-assistant", {
        body: {
          message: userMsg.content,
          sessionId: sessionId.current,
          userId: user?.id || null,
          history: messages.filter(m => m.id !== "welcome").map(m => ({ role: m.role, content: m.content })),
        },
      });

      if (error) {
        throw error;
      }

      const reply = data?.reply || "Mulțumesc pentru mesaj! Un operator va reveni în curând.";
      const aiMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: reply };
      setMessages(prev => [...prev, aiMsg]);

      // Save assistant message
      (supabase.from("chatbot_messages" as any).insert({
        session_id: sessionId.current,
        role: "assistant",
        content: reply,
      } as any) as any).then(() => {});

      // Check escalation
      if (data?.escalated) {
        setSessionEnded(true);
        toast.info("Conversația a fost transferată către echipa de suport.");
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      const fallback = "Mulțumesc! Echipa noastră va reveni cu un răspuns. 🙏";
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: fallback }]);
      if (err?.message?.includes("429")) {
        toast.warning("Chatbot-ul este momentan ocupat. Încearcă din nou în câteva secunde.");
      }
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const rateSatisfaction = async (rating: number) => {
    setRated(true);
    await (supabase.from("chatbot_sessions" as any).update({
      satisfaction_rating: rating,
      status: "resolved",
      ended_at: new Date().toISOString(),
    } as any).eq("id", sessionId.current) as any);
  };

  if (!settings?.enabled) return null;

  const widgetColor = settings.widget_color || "#6366f1";

  return (
    <>
      {/* Fab button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform animate-in fade-in slide-in-from-bottom-2"
          style={{ backgroundColor: widgetColor, color: "#fff" }}
          aria-label="Deschide chat"
        >
          <MessageCircle className="w-6 h-6" />
          {/* Pulse indicator */}
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full animate-pulse" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-6rem)] bg-background border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between shrink-0 shadow-sm" style={{ backgroundColor: widgetColor, color: "#fff" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">{settings.assistant_name}</p>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                  <p className="text-xs opacity-90">Online acum</p>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="hover:opacity-80 transition-opacity p-1 rounded-full hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map(m => (
              <div key={m.id} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: widgetColor + "20" }}>
                    <Bot className="w-4 h-4" style={{ color: widgetColor }} />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "text-white rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}
                  style={m.role === "user" ? { backgroundColor: widgetColor } : undefined}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert [&>p]:m-0 [&>p:not(:last-child)]:mb-1.5 [&>ul]:my-1 [&>ol]:my-1 [&>li]:my-0">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: widgetColor + "20" }}>
                  <Bot className="w-4 h-4" style={{ color: widgetColor }} />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
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
              <p className="text-center text-sm text-muted-foreground py-2 border-t border-border mt-2 pt-3">
                Mulțumim pentru feedback! 🙏
              </p>
            )}
          </div>

          {/* Quick replies */}
          {messages.length <= 1 && !loading && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map(qr => (
                <button
                  key={qr}
                  onClick={() => sendMessage(qr)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors font-medium"
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border shrink-0 bg-background">
            <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={sessionEnded ? "Conversație închisă" : "Scrie un mesaj..."}
                className="flex-1 rounded-full"
                disabled={sessionEnded}
                maxLength={500}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || loading || sessionEnded}
                className="rounded-full shrink-0"
                style={{ backgroundColor: widgetColor }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground text-center mt-1.5">Powered by AI · Răspunsuri automate</p>
          </div>
        </div>
      )}
    </>
  );
}
