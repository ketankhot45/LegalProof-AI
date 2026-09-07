import React from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  return (
    <nav className={cn('flex items-center space-x-1.5 text-xs text-zinc-500', className)} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            {isLast ? (
              <span className="text-zinc-300 font-medium truncate max-w-[200px] sm:max-w-[300px]" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href || '#'}
                className="hover:text-indigo-400 transition-colors truncate max-w-[150px] sm:max-w-[200px]"
              >
                {item.label}
              </Link>
            )}
            {!isLast && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-50" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
