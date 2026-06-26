import { motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast = ({ message, type = 'info', onClose }: ToastProps) => {
  const icons = {
    success: <CheckCircle size={20} className="text-success" />,
    error: <AlertCircle size={20} className="text-danger" />,
    info: <Info size={20} className="text-accent" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, x: 100 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: 20, x: 100 }}
      className={cn(
        'fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-card border border-border bg-bg-surface px-4 py-3 shadow-subtle',
        type === 'success' && 'border-success/30',
        type === 'error' && 'border-danger/30',
        type === 'info' && 'border-accent/30'
      )}
    >
      {icons[type]}
      <span className="text-sm text-text-primary">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 rounded-input p-1 text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};

export default Toast;
