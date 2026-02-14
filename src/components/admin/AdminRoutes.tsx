import { Routes, Route } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import AdminProducts from "./AdminProducts";
import AdminCategories from "./AdminCategories";
import AdminOrders from "./AdminOrders";
import AdminCoupons from "./AdminCoupons";
import AdminNewsletter from "./AdminNewsletter";
import AdminReports from "./AdminReports";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="products" element={<AdminProducts />} />
      <Route path="categories" element={<AdminCategories />} />
      <Route path="orders" element={<AdminOrders />} />
      <Route path="coupons" element={<AdminCoupons />} />
      <Route path="newsletter" element={<AdminNewsletter />} />
      <Route path="reports" element={<AdminReports />} />
    </Routes>
  );
}
