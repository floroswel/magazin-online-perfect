import { useParams, useNavigate } from "react-router-dom";
import AdminOrderDetail from "./AdminOrderDetail";

export default function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  if (!orderId) {
    return <div className="p-8 text-center text-muted-foreground">ID comandă lipsă.</div>;
  }

  return <AdminOrderDetail orderId={orderId} onBack={() => navigate("/admin/orders")} />;
}
