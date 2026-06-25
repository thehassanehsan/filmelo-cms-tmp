import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'number' | 'date' | 'datetime-local';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

interface CreateModalProps {
  title: string;
  fields: Field[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => void;
}

export default function CreateModal({ title, fields, isOpen, onClose, onSubmit }: CreateModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.required && !formData[f.key]) {
        newErrors[f.key] = `${f.label} is required`;
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit(formData);
    setFormData({});
    setErrors({});
  };

  const renderField = (field: Field) => {
    const baseClass = "w-full px-4 py-3 rounded-lg bg-[#09090B] border text-white placeholder:text-[#3F3F46] focus:outline-none focus:ring-2 focus:ring-[#CFFF4A] focus:border-transparent transition-all text-sm";
    const errorClass = errors[field.key] ? "border-[#FF4DA6] ring-1 ring-[#FF4DA6]" : "border-[#1A3A3D]";

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={formData[field.key] || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={`${baseClass} ${errorClass} resize-none`}
          />
        );
      case 'select':
        return (
          <select
            value={formData[field.key] || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            className={`${baseClass} ${errorClass}`}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type={field.type}
            value={formData[field.key] || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={`${baseClass} ${errorClass}`}
          />
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-[#112224] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <h3 className="text-white font-bold text-lg">{title}</h3>
              <Button variant="ghost" size="icon" className="text-[#8DA8A9] hover:text-white" onClick={onClose}>
                <X size={18} />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-bold text-[#8DA8A9] uppercase tracking-wider mb-2">
                    {field.label} {field.required && <span className="text-[#FF4DA6]">*</span>}
                  </label>
                  {renderField(field)}
                  {errors[field.key] && (
                    <p className="text-[#FF4DA6] text-xs mt-1">{errors[field.key]}</p>
                  )}
                </div>
              ))}
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" className="border-[#1A3A3D] text-[#8DA8A9] hover:bg-[#1A3A3D]" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#CFFF4A] text-[#08383A] hover:bg-white font-semibold">
                  Save
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
