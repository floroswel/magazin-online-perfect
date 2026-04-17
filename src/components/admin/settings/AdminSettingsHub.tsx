import { useNavigate } from "react-router-dom";
import { Settings, Globe, Users, CreditCard, Mail, Package, Truck, Newspaper, Lock, BarChart3 } from "lucide-react";

const cards = [
  { icon: Settings, title: "General", desc: "Date firma, identitate, acces magazin", path: "/admin/settings/general", color: "text-red-500 bg-red-50" },
  { icon: Globe, title: "Domenii", desc: "Configureaza domeniile magazinului", path: "/admin/settings/domains", color: "text-blue-500 bg-blue-50" },
  { icon: Users, title: "Conturi", desc: "Administratori si drepturi de acces", path: "/admin/users", color: "text-purple-500 bg-purple-50" },
  { icon: CreditCard, title: "Plata", desc: "Metode de plata disponibile", path: "/admin/payments/methods", color: "text-green-500 bg-green-50" },
  { icon: Mail, title: "Mail", desc: "Email pentru notificari", path: "/admin/settings/email", color: "text-amber-500 bg-amber-50" },
  { icon: Package, title: "Abonament", desc: "Informatii abonament", path: "/admin/settings/store", color: "text-indigo-500 bg-indigo-50" },
  { icon: Truck, title: "Livrare", desc: "Costuri si curieri", path: "/admin/shipping/rates", color: "text-orange-500 bg-orange-50" },
  { icon: Newspaper, title: "Newsletter", desc: "Activeaza si configureaza", path: "/admin/newsletter", color: "text-teal-500 bg-teal-50" },
  { icon: Lock, title: "Confidentialitate", desc: "GDPR si cookies", path: "/admin/settings/gdpr", color: "text-red-600 bg-red-50" },
  { icon: BarChart3, title: "Analytics", desc: "Google Analytics 4", path: "/admin/settings/seo", color: "text-sky-500 bg-sky-50" },
];

export default function AdminSettingsHub() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Setări</h1>
        <p className="text-sm text-muted-foreground">Configurează toate aspectele magazinului tău</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            className="bg-card border border-border rounded-xl p-5 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{card.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{card.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
