import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1f1f38] border border-slate-200/80 dark:border-white/10 p-5 shadow-sm hover:shadow-md transition-all group">
      {/* Decorative gradient corner */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#FF6B0B]/5 dark:bg-[#FF6B0B]/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
              {subtitle}
            </p>
          )}
          {trend && (
            <span className="inline-block mt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              {trend}
            </span>
          )}
        </div>

        <div className="size-11 rounded-xl bg-[#FF6B0B]/10 dark:bg-[#FF6B0B]/15 border border-[#FF6B0B]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Icon className="size-5 text-[#FF6B0B]" />
        </div>
      </div>
    </div>
  );
};
