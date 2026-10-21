import * as React from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FluxTableProps extends React.HTMLAttributes<HTMLTableElement> {
    bleed?: boolean;
    containerClassName?: string;
}

export function FluxTable({
    bleed = false,
    containerClassName,
    className,
    children,
    ...props
}: FluxTableProps) {
    return (
        <div
            data-flux-table-container
            className={cn(
                'w-full overflow-x-auto',
                bleed ? '-mx-6 w-[calc(100%+3rem)]' : 'rounded-lg border border-zinc-200 dark:border-white/10',
                containerClassName
            )}
        >
            <table
                data-flux-table
                className={cn('w-full border-collapse text-start text-sm', className)}
                {...props}
            >
                {children}
            </table>
        </div>
    );
}

export interface FluxTableColumnsProps
    extends React.HTMLAttributes<HTMLTableSectionElement> {
    sticky?: boolean;
}

export function FluxTableColumns({
    sticky = false,
    className,
    children,
    ...props
}: FluxTableColumnsProps) {
    return (
        <thead
            data-flux-table-columns
            className={cn(
                'border-b border-zinc-200 dark:border-white/10 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50/75 dark:bg-zinc-800/40',
                sticky && 'sticky top-0 z-10 backdrop-blur-md',
                className
            )}
            {...props}
        >
            <tr>{children}</tr>
        </thead>
    );
}

export interface FluxTableColumnProps
    extends Omit<React.ThHTMLAttributes<HTMLTableCellElement>, 'align'> {
    align?: 'start' | 'center' | 'end';
    sortable?: boolean;
    sorted?: boolean;
    direction?: 'asc' | 'desc';
    sticky?: boolean;
    onSort?: () => void;
}

export function FluxTableColumn({
    align = 'start',
    sortable = false,
    sorted = false,
    direction = 'asc',
    sticky = false,
    onSort,
    className,
    children,
    ...props
}: FluxTableColumnProps) {
    const alignClass =
        align === 'end'
            ? 'text-end justify-end'
            : align === 'center'
            ? 'text-center justify-center'
            : 'text-start justify-start';

    return (
        <th
            data-flux-table-column
            className={cn(
                'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 select-none whitespace-nowrap',
                alignClass,
                sticky && 'sticky left-0 z-10 bg-zinc-50 dark:bg-zinc-800',
                className
            )}
            {...props}
        >
            {sortable ? (
                <button
                    type="button"
                    onClick={onSort}
                    className={cn(
                        'group/sort inline-flex items-center gap-1.5 font-semibold transition-colors hover:text-zinc-900 dark:hover:text-white',
                        alignClass
                    )}
                >
                    <span>{children}</span>
                    <span className="text-zinc-400 dark:text-zinc-500 group-hover/sort:text-zinc-700 dark:group-hover/sort:text-zinc-300">
                        {sorted ? (
                            direction === 'asc' ? (
                                <ChevronUp className="size-3.5 stroke-[2.5]" />
                            ) : (
                                <ChevronDown className="size-3.5 stroke-[2.5]" />
                            )
                        ) : (
                            <ChevronsUpDown className="size-3.5 opacity-60" />
                        )}
                    </span>
                </button>
            ) : (
                children
            )}
        </th>
    );
}

export function FluxTableRows({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
    return (
        <tbody
            data-flux-table-rows
            className={cn('divide-y divide-zinc-200 dark:divide-white/10', className)}
            {...props}
        >
            {children}
        </tbody>
    );
}

export interface FluxTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    sticky?: boolean;
}

export function FluxTableRow({
    sticky = false,
    className,
    children,
    ...props
}: FluxTableRowProps) {
    return (
        <tr
            data-flux-table-row
            className={cn(
                'group transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40',
                sticky && 'sticky left-0 z-10',
                className
            )}
            {...props}
        >
            {children}
        </tr>
    );
}

export interface FluxTableCellProps
    extends Omit<React.TdHTMLAttributes<HTMLTableCellElement>, 'align'> {
    align?: 'start' | 'center' | 'end';
    variant?: 'default' | 'strong';
    sticky?: boolean;
}

export function FluxTableCell({
    align = 'start',
    variant = 'default',
    sticky = false,
    className,
    children,
    ...props
}: FluxTableCellProps) {
    return (
        <td
            data-flux-table-cell
            className={cn(
                'px-4 py-3.5 text-sm transition-colors',
                align === 'end'
                    ? 'text-end'
                    : align === 'center'
                    ? 'text-center'
                    : 'text-start',
                variant === 'strong'
                    ? 'font-medium text-zinc-900 dark:text-white'
                    : 'text-zinc-700 dark:text-zinc-300',
                sticky && 'sticky left-0 z-10 bg-white dark:bg-zinc-900',
                className
            )}
            {...props}
        >
            {children}
        </td>
    );
}

// Compound component pattern matching Flux UI Table
FluxTable.Columns = FluxTableColumns;
FluxTable.Column = FluxTableColumn;
FluxTable.Rows = FluxTableRows;
FluxTable.Row = FluxTableRow;
FluxTable.Cell = FluxTableCell;
