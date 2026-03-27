import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  "Vreau să returnez",
  "Contactați-mă",
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

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

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
          setSettings({ enabled: true, assistant_name: "Asistent", widget_color: "#6366f1", welcome_message: "Bună! 👋 Cu ce te pot ajuta azi?", offline_message: "" });
          setMessages([{ id: "welcome", role: "assistant", content: "Bună! 👋 Cu ce te pot ajuta azi?" }]);
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
    }
  }, [open, user]);

  const sendMessage = async (text?: string) => {
    const msgText = text || input.trim();
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
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "Mulțumesc! Echipa noastră va reveni cu un răspuns." },
      ]);
    }
    setLoading(false);
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

  return (
    <>
      {/* Fab button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          style={{ backgroundColor: settings.widget_color, color: "#fff" }}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-6rem)] bg-background border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between shrink-0" style={{ backgroundColor: settings.widget_color, color: "#fff" }}>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <p className="font-semibold text-sm">{settings.assistant_name}</p>
                <p className="text-xs opacity-80">Online</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="hover:opacity-80"><X className="w-5 h-5" /></button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map(m => (
              <div key={m.id} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: settings.widget_color + "20" }}>
                    <Bot className="w-4 h-4" style={{ color: settings.widget_color }} />
                  </div>
                )}
                <div className={cn("max-w-[75%] rounded-lg px-3 py-2 text-sm", m.role === "user" ? "text-white" : "bg-muted text-foreground")}
                  style={m.role === "user" ? { backgroundColor: settings.widget_color } : undefined}>
                  {m.content}
                </div>
                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: settings.widget_color + "20" }}>
                  <Bot className="w-4 h-4" style={{ color: settings.widget_color }} />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Satisfaction rating */}
            {sessionEnded && !rated && (
              <div className="text-center py-3 space-y-2">
                <p className="text-sm text-muted-foreground">Evaluează conversația:</p>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => rateSatisfaction(1)}><ThumbsUp className="w-4 h-4 mr-1" /> Util</Button>
                  <Button variant="outline" size="sm" onClick={() => rateSatisfaction(-1)}><ThumbsDown className="w-4 h-4 mr-1" /> Neutil</Button>
                </div>
              </div>
            )}
            {rated && <p className="text-center text-sm text-muted-foreground py-2">Mulțumim pentru feedback! 🙏</p>}
          </div>

          {/* Quick replies */}
          {messages.length <= 1 && !loading && (
            <div className="px-3 pb-1 flex flex-wrap gap-1">
              {QUICK_REPLIES.map(qr => (
                <button key={qr} onClick={() => sendMessage(qr)}
                  className="text-xs px-2 py-1 rounded-full border border-border hover:bg-muted transition-colors">
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border shrink-0">
            <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Scrie un mesaj..."
                className="flex-1"
                disabled={sessionEnded}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || loading || sessionEnded}
                style={{ backgroundColor: settings.widget_color }}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
