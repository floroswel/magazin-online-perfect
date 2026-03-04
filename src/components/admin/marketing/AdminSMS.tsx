import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageSquare, Send, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function AdminSMS() {
  const [message, setMessage] = useState("");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Campanii SMS</h1>
          <p className="text-sm text-muted-foreground">Notificări și promoții prin SMS.</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Campanie nouă</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">0</p><p className="text-xs text-muted-foreground">SMS-uri trimise</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">0</p><p className="text-xs text-muted-foreground">Campanii active</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">0 RON</p><p className="text-xs text-muted-foreground">Cost total</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-5 space-y-3">
          <Label>Mesaj SMS (max 160 caractere)</Label>
          <Textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={160} placeholder="Scrie mesajul SMS..." rows={3} />
          <p className="text-xs text-muted-foreground">{message.length}/160 caractere</p>
          <Button size="sm" onClick={() => toast({ title: "Configurează providerul SMS mai întâi (Twilio, Vonage etc.)" })}>
            <Send className="w-4 h-4 mr-1" /> Trimite test
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Campanie</TableHead><TableHead>Destinatari</TableHead><TableHead>Trimise</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody><TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nu au fost trimise campanii SMS.</TableCell></TableRow></TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
