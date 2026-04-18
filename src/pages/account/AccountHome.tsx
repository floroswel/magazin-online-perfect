import AccountLayout from "@/components/account/AccountLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Inbox } from "lucide-react";

export default function AccountHome() {
  return (
    <AccountLayout title="Comenzile mele">
      <Card>
        <CardContent className="p-12 text-center">
          <Inbox className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">Nu ai comenzi încă</p>
        </CardContent>
      </Card>
    </AccountLayout>
  );
}
