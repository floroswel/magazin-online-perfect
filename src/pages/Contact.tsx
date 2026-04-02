import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { MapPin, Phone, Mail, Send } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePageSeo } from "@/components/SeoHead";

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function Contact() {
  usePageSeo({
    title: "Contact — MamaLucica",
    description: "Contactează-ne pentru orice întrebare despre lumânări artizanale, comenzi sau colaborări.",
  });

  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [info, setInfo] = useState<{ email?: string; phone?: string; address?: string }>({});
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactForm>();

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("key, value_json")
      .in("key", ["contact_email", "contact_phone", "contact_address"])
      .then(({ data }) => {
        const map: any = {};
        (data || []).forEach((r: any) => { map[r.key] = typeof r.value_json === "string" ? r.value_json : JSON.stringify(r.value_json); });
        setInfo({ email: map.contact_email, phone: map.contact_phone, address: map.contact_address });
      });
  }, []);

  const onSubmit = async (form: ContactForm) => {
    setSending(true);
    const { error } = await (supabase as any).from("support_tickets").insert({
      customer_name: form.name,
      customer_email: form.email,
      subject: form.subject,
      message: form.message,
      status: "open",
    });
    setSending(false);
    if (error) {
      toast({ title: "Eroare", description: "Nu am putut trimite mesajul. Încearcă din nou.", variant: "destructive" });
    } else {
      toast({ title: "Mesaj trimis!", description: "Îți vom răspunde cât mai curând." });
      reset();
    }
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-10 px-4">
        <h1 className="text-3xl font-bold text-foreground mb-6">Contact</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Info */}
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Ne poți contacta oricând pentru întrebări despre produse, comenzi sau colaborări.
            </p>
            {info.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <a href={`mailto:${info.email}`} className="text-sm text-primary hover:underline">{info.email}</a>
                </div>
              </div>
            )}
            {info.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Telefon</p>
                  <a href={`tel:${info.phone}`} className="text-sm text-primary hover:underline">{info.phone}</a>
                </div>
              </div>
            )}
            {info.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Adresă</p>
                  <p className="text-sm text-muted-foreground">{info.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-card border border-border rounded-lg p-6">
            <div>
              <Label htmlFor="name">Nume</Label>
              <Input id="name" {...register("name", { required: "Numele este obligatoriu" })} />
              {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email", { required: "Email-ul este obligatoriu" })} />
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="subject">Subiect</Label>
              <Input id="subject" {...register("subject", { required: "Subiectul este obligatoriu" })} />
              {errors.subject && <p className="text-destructive text-xs mt-1">{errors.subject.message}</p>}
            </div>
            <div>
              <Label htmlFor="message">Mesaj</Label>
              <Textarea id="message" rows={4} {...register("message", { required: "Mesajul este obligatoriu" })} />
              {errors.message && <p className="text-destructive text-xs mt-1">{errors.message.message}</p>}
            </div>
            <Button type="submit" disabled={sending} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              {sending ? "Se trimite..." : "Trimite mesajul"}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
