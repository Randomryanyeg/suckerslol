
import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Mail } from 'lucide-react';
import { Mailer } from '../components/Mailer';

interface MailerViewProps {
  onBack: () => void;
  theme?: 'light' | 'dark';
}

export const MailerView: React.FC<MailerViewProps> = ({ onBack, theme = 'light' }) => {
  return (
    <div className={`h-full flex flex-col ${theme === 'dark' ? 'bg-[#1c1c1e] text-white' : 'bg-[#F4F4F4] text-gray-900'}`}>
      {/* Header */}
      <div className={`px-4 pt-12 pb-4 flex items-center justify-between ${theme === 'dark' ? 'bg-[#2c2c2e]' : 'bg-white'} border-b border-gray-200`}>
        <button onClick={onBack} className="p-2 -ml-2 text-[#ED0711]">
          <ChevronLeft size={28} strokeWidth={2.5} />
        </button>
        <h1 className="text-[17px] font-bold tracking-tight">Email Dispatcher</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6 text-center">
          <div className="w-16 h-16 bg-[#ED0711]/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Mail size={32} className="text-[#ED0711]" />
          </div>
          <h2 className="text-xl font-bold">Manual Dispatch</h2>
          <p className="text-gray-500 text-sm px-8">
            Send custom INTERAC e-Transfer notifications directly to recipients.
          </p>
        </div>

        <Mailer />
        
        <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
          <h3 className="text-blue-800 font-bold text-sm mb-1">Pro Tip</h3>
          <p className="text-blue-600 text-xs leading-relaxed">
            This mailer uses the Node.js backend with an automatic PHP fallback. 
            Ensure your SMTP settings are configured in the Admin Panel for best delivery rates.
          </p>
        </div>
      </div>
    </div>
  );
};
