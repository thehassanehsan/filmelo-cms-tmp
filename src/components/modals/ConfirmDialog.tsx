import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-sm bg-[#112224] border border-white/10 rounded-2xl shadow-2xl p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <AlertTriangle size={48} className="mx-auto mb-4 text-[#FF4DA6]" />
            <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
            <p className="text-[#8DA8A9] text-sm mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" className="border-[#1A3A3D] text-[#8DA8A9] hover:bg-[#1A3A3D]" onClick={onCancel}>
                Cancel
              </Button>
              <Button className="bg-[#FF4DA6] text-white hover:bg-[#FF4DA6]/80" onClick={onConfirm}>
                Delete
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
