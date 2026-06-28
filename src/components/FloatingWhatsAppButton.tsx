import { MessageCircle } from "lucide-react";

export const FloatingWhatsAppButton = () => {
  const phone = "08125650249";
  const message = encodeURIComponent("Hello, I would like to enroll in the AI Summer Holiday Program.");
  const whatsAppUrl = `https://wa.me/${phone}?text=${message}`;

  return (
    <a
      href={whatsAppUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Contact us on WhatsApp"
      className="fixed bottom-3 right-3 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 p-0 text-white shadow-lg shadow-emerald-600/30 transition-all duration-300 hover:scale-105 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 sm:h-14 sm:w-auto sm:min-w-[154px] sm:gap-2 sm:px-4 sm:py-3 sm:justify-start md:bottom-6 md:right-6 animate-pulse"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 sm:h-9 sm:w-9">
        <MessageCircle className="h-5 w-5" />
      </span>
      <span className="hidden text-sm font-semibold sm:inline">Chat on WhatsApp</span>
    </a>
  );
};
