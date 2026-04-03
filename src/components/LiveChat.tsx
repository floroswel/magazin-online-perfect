import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, ThumbsUp, ThumbsDown, Loader2, Sparkles, Shield } from "lucide-react";
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

const QUICK_REPLIES_GUEST = [
  "🕯️ Ce lumânări aveți?",
  "🚚 Cât costă livrarea?",
  "💳 Ce metode de plată acceptați?",
  "🎁 Caut un cadou special",
  "↩️ Politica de retur",
  "🏷️ Aveți reduceri?",
];

const QUICK_REPLIES_LOGGED = [
  "📦 Unde e comanda mea?",
  "🕯️ Recomandă-mi o lumânare",
  "↩️ Vreau să returnez un produs",
  "🚚 Cât costă livrarea?",
  "🏷️ Aveți cupoane active?",
  "🎁 Vreau un cadou personalizat",
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
  const [showPulse, setShowPulse] = useState(true);
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [showGdpr, setShowGdpr] = useState(false);
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
        } else {
          setSettings({
            enabled: true,
            assistant_name: "Lucica",
            widget_color: "#6366f1",
            welcome_message: "Bună! 👋 Sunt Lucica, asistentul tău virtual. Cu ce te pot ajuta azi?",
            offline_message: "",
          });
        }
      });

    // Check stored GDPR consent
    const consent = localStorage.getItem("chatbot_gdpr_consent");
    if (consent === "true") setGdprAccepted(true);
  }, []);

  // Open chat handler
  const handleOpen = () => {
    if (!gdprAccepted) {
      setShowGdpr(true);
      return;
    }
    openChat();
  };

  const openChat = () => {
    setOpen(true);
    setShowGdpr(false);
    setShowPulse(false);

    // Set welcome message
    if (messages.length === 0 && settings) {
      const welcomeName = user ? ` Mă bucur să te văd!` : "";
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: (settings.welcome_message || "Bună! 👋 Sunt Lucica.") + welcomeName,
      }]);
    }
  };

  const acceptGdpr = () => {
    setGdprAccepted(true);
    localStorage.setItem("chatbot_gdpr_consent", "true");
    openChat();
  };

  // Create session
  useEffect(() => {
    if (open && messageCount.current === 0 && gdprAccepted) {
      (supabase.from("chatbot_sessions" as any).insert({
        id: sessionId.current,
        customer_id: user?.id || null,
        customer_email: user?.email || null,
        status: "active",
      } as any) as any).then(() => {});
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, user, gdprAccepted]);

  // Stream chat
  const streamChat = useCallback(async (msgText: string, allMessages: Message[]) => {
    const historyMsgs = allMessages
      .filter(m => m.id !== "welcome")
      .map(m => ({ role: m.role, content: m.content }));

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        message: msgText,
        sessionId: sessionId.current,
        userId: user?.id || null,
        history: historyMsgs,
        gdprConsent: gdprAccepted,
      }),
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      if (resp.status === 429) toast.warning("Chatbot-ul este momentan ocupat. Încearcă din nou.");
      return errData.reply || "Mulțumesc! Echipa noastră va reveni cu un răspuns. 🙏";
    }

    const contentType = resp.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await resp.json();
      if (data.escalated) {
        setSessionEnded(true);
        toast.info("Conversația a fost transferată către echipa de suport.");
      }
      if (data.requiresConsent) {
        setGdprAccepted(false);
        localStorage.removeItem("chatbot_gdpr_consent");
      }
      return data.reply || "Mulțumesc! 😊";
    }

    if (!resp.body) return "Mulțumesc! 😊";

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let fullText = "";
    const assistantId = crypto.randomUUID();

    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    let streamDone = false;
    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { streamDone = true; break; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            fullText += content;
            const currentText = fullText;
            setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: currentText } : m));
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            fullText += content;
            const currentText = fullText;
            setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: currentText } : m));
          }
        } catch { /* ignore */ }
      }
    }

    return null;
  }, [user, gdprAccepted]);

  const sendMessage = async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText || loading || sessionEnded) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: msgText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    messageCount.current++;

    (supabase.from("chatbot_messages" as any).insert({
      session_id: sessionId.current, role: "user", content: userMsg.content,
    } as any) as any).then(() => {});

    try {
      const result = await streamChat(msgText, newMessages);
      if (result) {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: result }]);
        (supabase.from("chatbot_messages" as any).insert({
          session_id: sessionId.current, role: "assistant", content: result,
        } as any) as any).then(() => {});
      } else {
        // Save streamed message
        setTimeout(() => {
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.role === "assistant" && lastMsg.content) {
              (supabase.from("chatbot_messages" as any).insert({
                session_id: sessionId.current, role: "assistant", content: lastMsg.content,
              } as any) as any).then(() => {});
            }
            return prev;
          });
        }, 100);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Mulțumesc! Echipa noastră va reveni cu un răspuns. 🙏" }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const rateSatisfaction = async (rating: number) => {
    setRated(true);
    await (supabase.from("chatbot_sessions" as any).update({
      satisfaction_rating: rating, status: "resolved", ended_at: new Date().toISOString(),
    } as any).eq("id", sessionId.current) as any);
  };

  if (!settings?.enabled) return null;

  const widgetColor = settings.widget_color || "#6366f1";
  const quickReplies = user ? QUICK_REPLIES_LOGGED : QUICK_REPLIES_GUEST;

  return (
    <>
      {/* GDPR Consent Modal */}
      {showGdpr && !gdprAccepted && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40 animate-in fade-in duration-200">
          <div className="bg-background rounded-t-2xl md:rounded-2xl w-full md:w-[400px] p-5 shadow-2xl animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: widgetColor + "20" }}>
                <Shield className="w-5 h-5" style={{ color: widgetColor }} />
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
              <li>📋 Detalii complete în <a href="/politica-confidentialitate" target="_blank" className="underline text-primary">Politica de Confidențialitate</a></li>
            </ul>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowGdpr(false)}>
                Renunță
              </Button>
              <Button size="sm" className="flex-1" style={{ backgroundColor: widgetColor }} onClick={acceptGdpr}>
                Accept și deschid chat-ul
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FAB — above mobile nav */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-20 md:bottom-6 right-4 z-[45] w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform animate-in fade-in slide-in-from-bottom-2"
          style={{ backgroundColor: widgetColor, color: "#fff" }}
          aria-label="Deschide chat"
        >
          <MessageCircle className="w-6 h-6" />
          {showPulse && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full animate-pulse" />
          )}
        </button>
      )}

      {/* Chat window — fullscreen mobile, floating desktop */}
      {open && (
        <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-4 z-[55] md:w-[400px] md:max-w-[calc(100vw-2rem)] md:h-[580px] md:max-h-[calc(100vh-6rem)] bg-background md:border md:border-border md:rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between shrink-0 shadow-sm" style={{ backgroundColor: widgetColor, color: "#fff" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">{settings.assistant_name}</p>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                  <p className="text-xs opacity-90">Online · Răspund instant</p>
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
                    "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "text-white rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}
                  style={m.role === "user" ? { backgroundColor: widgetColor } : undefined}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert [&>p]:m-0 [&>p:not(:last-child)]:mb-1.5 [&>ul]:my-1 [&>ol]:my-1 [&>li]:my-0 [&>a]:text-primary [&>a]:underline [&>strong]:font-semibold">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : m.content}
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
              {quickReplies.map(qr => (
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
                className="flex-1 rounded-full text-base"
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
            <div className="flex items-center justify-center gap-1 mt-1.5">
              <Shield className="w-3 h-3 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">Conversație securizată · Date protejate GDPR</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
