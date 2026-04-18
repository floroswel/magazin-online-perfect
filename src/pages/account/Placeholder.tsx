import AccountLayout from "@/components/account/AccountLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function AccountPlaceholder({ title, message = "Această secțiune va fi disponibilă în curând." }: { title: string; message?: string }) {
  return (
    <AccountLayout title={title}>
      <Card>
        <CardContent className="p-12 text-center text-sm text-muted-foreground">{message}</CardContent>
      </Card>
    </AccountLayout>
  );
}
