import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import IntegratedAiChat from '@/components/integrated-ai-chat';
import { Button } from '@/components/ui/button';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200"
          size="icon"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
      </motion.div>

      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-40 w-[90vw] max-w-md h-[600px] bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="bg-primary text-primary-foreground px-6 py-4 border-b border-primary/20">
                <span className="text-lg font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Asesor NutraBlue
                </span>
                <p className="text-sm text-primary-foreground/80 mt-1">
                  Experto en biohacking y longevidad
                </p>
              </div>

              {/* Chat Content */}
              <div className="flex-1 overflow-hidden">
                <IntegratedAiChat />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotWidget;