// Iconițe SVG inline pentru metodele de plată — fără dependențe externe.
const Pill = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <span aria-label={label} title={label}
    className="inline-flex items-center justify-center h-8 px-2.5 rounded-md bg-white text-[10px] font-bold tracking-wider text-slate-800 shadow-sm">
    {children}
  </span>
);

export default function FooterPaymentIcons() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Pill label="Visa"><span className="text-[#1A1F71]">VISA</span></Pill>
      <Pill label="Mastercard">
        <span className="flex items-center gap-0.5">
          <span className="w-3 h-3 rounded-full bg-[#EB001B]" />
          <span className="w-3 h-3 rounded-full bg-[#F79E1B] -ml-1.5 mix-blend-multiply" />
        </span>
      </Pill>
      <Pill label="Maestro"><span className="text-[#0099DF]">MAESTRO</span></Pill>
      <Pill label="Apple Pay">Pay</Pill>
      <Pill label="Google Pay"><span className="text-[#4285F4]">G</span>Pay</Pill>
      <Pill label="Netopia"><span className="text-[#E10E0E]">netopia</span></Pill>
      <Pill label="Mokka"><span className="text-[#FF4F00]">mokka</span></Pill>
      <Pill label="Ramburs">RAMBURS</Pill>
    </div>
  );
}
