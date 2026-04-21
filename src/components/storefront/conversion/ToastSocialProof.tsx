import { useState, useEffect, useCallback, useRef } from "react";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";

/* ───── 200 Romanian names: 60 male + 140 female ───── */
const MALE_NAMES = [
  "Andrei","Alexandru","Adrian","Bogdan","Cristian","Daniel","Dragoș","Eduard","Emil","Florin",
  "Gabriel","George","Horia","Ilie","Ion","Iulian","Laurențiu","Liviu","Lucian","Marcel",
  "Marian","Mihai","Mircea","Nicolae","Ovidiu","Paul","Petru","Radu","Răzvan","Robert",
  "Sebastian","Sergiu","Silviu","Sorin","Ștefan","Teodor","Traian","Tudor","Valentin","Vasile",
  "Victor","Vlad","Viorel","Cosmin","Ciprian","Dan","Dorin","Felix","Ionuț","Marius",
  "Cătălin","Claudiu","Constantin","Darius","Denis","Eugen","Filip","Horațiu","Matei","Nicu"
];
const FEMALE_NAMES = [
  "Ana","Andreea","Alexandra","Alina","Amalia","Anca","Bianca","Camelia","Carmen","Carla",
  "Catalina","Cezara","Clara","Claudia","Corina","Cristina","Daciana","Dana","Daniela","Daria",
  "Delia","Denisa","Diana","Dora","Dorina","Ecaterina","Elena","Elisa","Emanuela","Emma",
  "Eva","Florentina","Gabriela","Georgiana","Ileana","Ioana","Ionela","Irina","Isabela","Iulia",
  "Jana","Larisa","Laura","Lavinia","Liana","Liliana","Livia","Loredana","Lucia","Luminița",
  "Madalina","Mara","Maria","Marina","Marta","Melania","Mihaela","Mirela","Monica","Nadia",
  "Natalia","Nicoleta","Oana","Olga","Otilia","Paula","Petronela","Raluca","Ramona","Rebeca",
  "Roberta","Rodica","Roxana","Ruxandra","Sabina","Sandra","Sara","Silvia","Simona","Sofia",
  "Sorina","Stefania","Tamara","Tatiana","Teodora","Valentina","Valerica","Vanessa","Vera","Veronica",
  "Victoria","Violeta","Virginia","Viviana","Adelina","Adriana","Antonia","Aurora","Beatrice","Carina",
  "Cerasela","Codruța","Cosmina","Damiana","Despina","Dumitra","Edith","Eleonora","Emilia","Erica",
  "Estera","Felicia","Flavia","Geanina","Gilda","Hortensia","Ina","Izabela","Jasmina","Lelia",
  "Leontina","Lidia","Lorena","Luciana","Magdalena","Marcela","Margareta","Melisa","Mirabela","Narcisa",
  "Noemi","Octavia","Patricia","Petruta","Riana","Romina","Sanda","Smaranda","Stela","Timeea"
];
const ALL_NAMES = [...MALE_NAMES, ...FEMALE_NAMES];

const CITIES = [
  "București","Cluj-Napoca","Timișoara","Iași","Constanța","Brașov","Craiova","Galați",
  "Oradea","Ploiești","Sibiu","Bacău","Arad","Pitești","Baia Mare","Buzău",
  "Botoșani","Suceava","Târgu Mureș","Focșani","Satu Mare","Râmnicu Vâlcea",
  "Drobeta-Turnu Severin","Piatra Neamț","Alba Iulia","Deva","Reșița","Bistrița",
  "Slobozia","Vaslui","Giurgiu","Tulcea","Zalău","Târgoviște","Mediaș","Hunedoara"
];

const PRODUCTS = [
  "Lumânare Vanilla & Santal","Lumânare Lavandă","Set Cadou Trandafir","Diffuzor Aromat",
  "Lumânare Pilar Cedru","Lumânare Caramel","Set Relaxare Spa","Lumânare Bumbac Proaspăt",
  "Diffuzor Bambus","Lumânare Scorțișoară","Set Premium 3 Lumânări","Lumânare Trandafir",
  "Ceară Topită Vanilie","Lumânare Iasomie","Lumânare Bergamotă","Set Cadou Deluxe",
  "Lumânare Mosc Alb","Lumânare Lemn de Santal","Diffuzor Eucalipt","Lumânare Miere"
];

interface ProofEntry {
  name: string;
  city: string;
  product: string;
  isReal: boolean;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ToastSocialProof() {
  const { settings } = useSettings();
  const [current, setCurrent] = useState<ProofEntry | null>(null);
  const [visible, setVisible] = useState(false);
  const queueRef = useRef<ProofEntry[]>([]);
  const lastShownRef = useRef<string>("");
  const realOrdersRef = useRef<ProofEntry[]>([]);

  const show = settings.social_proof_show === "true" || settings.social_proof_show === '"true"';
  const interval = parseInt((settings.social_proof_interval_seconds || "12").replace(/"/g, ""), 10) * 1000;

  // Load real orders once
  useEffect(() => {
    if (!show) return;
    (async () => {
      const { data } = await supabase.rpc("get_social_proof_messages", { limit_count: 30 });
      if (data?.length) {
        realOrdersRef.current = data.map((d: any) => {
          const msg = d.message as string;
          const m = msg.match(/^(.+?) din (.+?) a cumpărat (.+)$/);
          return {
            name: m?.[1] || "Client",
            city: m?.[2] || "România",
            product: (m?.[3] || "un produs").substring(0, 40),
            isReal: true,
          };
        });
      }
    })();
  }, [show]);

  // Build a shuffled queue, mixing real orders + fake entries
  const buildQueue = useCallback((): ProofEntry[] => {
    const realEntries = realOrdersRef.current;
    // Generate ~20 fake entries
    const fakeEntries: ProofEntry[] = Array.from({ length: 20 }, () => ({
      name: pick(ALL_NAMES),
      city: pick(CITIES),
      product: pick(PRODUCTS),
      isReal: false,
    }));
    // Merge real + fake, shuffle
    const merged = shuffleArray([...realEntries, ...fakeEntries]);
    // Deduplicate consecutive names
    const deduped: ProofEntry[] = [];
    for (const entry of merged) {
      if (deduped.length === 0 || deduped[deduped.length - 1].name !== entry.name) {
        deduped.push(entry);
      }
    }
    return deduped;
  }, []);

  const showNext = useCallback(() => {
    // Refill queue if empty
    if (queueRef.current.length === 0) {
      queueRef.current = buildQueue();
    }
    // Pick next, ensuring not same as last shown
    let entry = queueRef.current.shift()!;
    let attempts = 0;
    while (entry && entry.name === lastShownRef.current && queueRef.current.length > 0 && attempts < 5) {
      queueRef.current.push(entry);
      entry = queueRef.current.shift()!;
      attempts++;
    }
    if (!entry) return;
    lastShownRef.current = entry.name;
    setCurrent(entry);
    setVisible(true);
    setTimeout(() => setVisible(false), 6000);
  }, [buildQueue]);

  useEffect(() => {
    if (!show) return;
    const t1 = setTimeout(showNext, 6000);
    const t2 = setInterval(showNext, interval + 6000);
    return () => { clearTimeout(t1); clearInterval(t2); };
  }, [show, interval, showNext]);

  if (!show || !visible || !current) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[90]">
      <div className="bg-white border border-gray-200 rounded-sm shadow-2xl w-[320px] p-3 flex items-center gap-3 animate-toast">
        <div className="w-12 h-12 bg-gray-100 rounded-sm overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
          <span className="text-2xl">🕯️</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 truncate">Acum câteva minute</p>
          <p className="text-sm font-semibold text-gray-800 truncate">
            {current.name} din {current.city}
          </p>
          <p className="text-xs text-gray-500 truncate">
            a cumpărat: {current.product}
          </p>
        </div>
        <div className="text-green-500 text-xs font-bold shrink-0">✔ Verificat</div>
      </div>
    </div>
  );
}
