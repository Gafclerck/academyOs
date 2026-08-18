import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface ColumnDef<T> {
  id?: string;
  header: React.ReactNode | (() => React.ReactNode);
  accessorKey?: keyof T;
  cell?: (info: { row: { original: T } }) => React.ReactNode;
  enableSorting?: boolean;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  searchPlaceholder?: string;
  filtersSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function DataTable<T extends object>({
  columns,
  data,
  searchPlaceholder = 'Rechercher...',
  filtersSlot,
  actionsSlot,
  emptyMessage = 'Aucune donnée disponible',
  isLoading = false,
}: DataTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 8;

  // ── 1. FILTRAGE GLOBAL ──
  const filteredData = useMemo(() => {
    if (!globalFilter.trim()) return data;
    const query = globalFilter.toLowerCase();
    return data.filter((item) => {
      return Object.values(item as Record<string, unknown>).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(query);
      });
    });
  }, [data, globalFilter]);

  // ── 2. TRI ──
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return sortDirection === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredData, sortKey, sortDirection]);

  // ── 3. PAGINATION ──
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = pageIndex * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pageIndex, pageSize]);

  const handleSort = (key?: keyof T) => {
    if (!key) return;
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* ── BARRE D'ACTION ET FILTRES ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative min-w-[240px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-slate-500" />
            <Input
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                setPageIndex(0);
              }}
              placeholder={searchPlaceholder}
              className="pl-9 h-10 rounded-xl bg-white dark:bg-[#1f1f38] border-slate-200 dark:border-white/10 text-sm focus-visible:ring-1 focus-visible:ring-[#FF6B0B]"
            />
          </div>
          {filtersSlot}
        </div>

        {actionsSlot && <div className="flex items-center gap-2">{actionsSlot}</div>}
      </div>

      {/* ── TABLEAU ───────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1f1f38] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                {columns.map((col, idx) => {
                  const isSortable = col.enableSorting !== false && !!col.accessorKey;
                  const isSorted = sortKey === col.accessorKey;

                  return (
                    <th
                      key={col.id || String(col.accessorKey) || idx}
                      className="px-5 py-3.5 whitespace-nowrap"
                    >
                      <div
                        className={`flex items-center gap-1.5 ${
                          isSortable ? 'cursor-pointer select-none hover:text-slate-900 dark:hover:text-white' : ''
                        }`}
                        onClick={() => isSortable && handleSort(col.accessorKey)}
                      >
                        {typeof col.header === 'function' ? col.header() : col.header}
                        {isSortable && (
                          <span className="text-slate-400">
                            {isSorted && sortDirection === 'asc' ? (
                              <ArrowUp className="size-3.5 text-[#FF6B0B]" />
                            ) : isSorted && sortDirection === 'desc' ? (
                              <ArrowDown className="size-3.5 text-[#FF6B0B]" />
                            ) : (
                              <ArrowUpDown className="size-3.5 opacity-40" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={columns.length} className="px-5 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-3/4" />
                    </td>
                  </tr>
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item, rowIdx) => (
                  <tr
                    key={((item as { id?: React.Key }).id) ?? rowIdx}
                    className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {columns.map((col, colIdx) => (
                      <td
                        key={col.id || String(col.accessorKey) || colIdx}
                        className="px-5 py-4 text-slate-700 dark:text-slate-200"
                      >
                        {col.cell
                          ? col.cell({ row: { original: item } })
                          : col.accessorKey
                          ? String(item[col.accessorKey] ?? '—')
                          : null}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-5 py-12 text-center text-slate-500 dark:text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Layers className="size-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-medium">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION ────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] text-xs text-slate-500 dark:text-slate-400">
          <div>
            Affichage de{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {paginatedData.length}
            </span>{' '}
            sur{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {sortedData.length}
            </span>{' '}
            résultat(s)
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-lg"
              onClick={() => setPageIndex(0)}
              disabled={pageIndex === 0}
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-lg"
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={pageIndex === 0}
            >
              <ChevronLeft className="size-4" />
            </Button>

            <span className="px-2 font-medium">
              Page {pageIndex + 1} sur {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-lg"
              onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              disabled={pageIndex >= totalPages - 1}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-lg"
              onClick={() => setPageIndex(totalPages - 1)}
              disabled={pageIndex >= totalPages - 1}
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
