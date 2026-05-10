import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show after a small delay to not overwhelm the user immediately
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-blue-900 text-white p-4 rounded-2xl shadow-2xl z-[9999] border border-blue-700/50 flex flex-col gap-3"
        >
          <button 
            onClick={handleDismiss} 
            className="absolute top-2 right-2 p-1 text-blue-300 hover:text-white rounded-full hover:bg-blue-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-start gap-4 pt-1">
            <div className="bg-yellow-400 p-2 rounded-xl shrink-0">
              <Download className="h-6 w-6 text-blue-900" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Instalar Kiribamba App</h3>
              <p className="text-xs text-blue-200 mt-1">
                Adicione nosso sistema à sua tela inicial para acesso offline e navegação super rápida em campo.
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-1">
            <button 
              onClick={handleInstall}
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-blue-950 text-sm font-bold py-2 rounded-xl transition-colors shadow-lg shadow-yellow-400/20"
            >
              Instalar Agora
            </button>
            <button 
              onClick={handleDismiss}
              className="flex-1 bg-blue-800 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
            >
              Agora Não
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
