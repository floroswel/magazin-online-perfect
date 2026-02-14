import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-emag-dark text-card mt-auto">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4 text-emag-yellow">🛒 MegaShop</h3>
            <p className="text-sm text-muted-foreground">Cel mai mare magazin online din România cu mii de produse la prețuri imbatabile.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Informații</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-emag-yellow transition-colors">Despre noi</Link></li>
              <li><Link to="/" className="hover:text-emag-yellow transition-colors">Contact</Link></li>
              <li><Link to="/" className="hover:text-emag-yellow transition-colors">Termeni și condiții</Link></li>
              <li><Link to="/" className="hover:text-emag-yellow transition-colors">Politica de confidențialitate</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Ajutor</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-emag-yellow transition-colors">Livrare</Link></li>
              <li><Link to="/" className="hover:text-emag-yellow transition-colors">Returnare</Link></li>
              <li><Link to="/" className="hover:text-emag-yellow transition-colors">Garanție</Link></li>
              <li><Link to="/" className="hover:text-emag-yellow transition-colors">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>📞 0800 123 456</li>
              <li>✉️ contact@megashop.ro</li>
              <li>📍 București, România</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-muted mt-8 pt-6 text-center text-sm text-muted-foreground">
          © 2026 MegaShop. Toate drepturile rezervate.
        </div>
      </div>
    </footer>
  );
}
