import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface DataGridColumn<T> {
  key: keyof T
  label: string
  /** Right-align the column (typical for figures). */
  align?: 'left' | 'right'
  /** Render cell values in the mono face with tabular numerals. */
  mono?: boolean
}

export interface DataGridProps<T> {
  columns: Array<DataGridColumn<T>>
  getRowId: (row: T, index: number) => string
  rows: T[]
}

export function DataGrid<T extends Record<string, unknown>>({
  columns,
  getRowId,
  rows,
}: DataGridProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((column) => (
            <TableHead
              className={cn(column.align === 'right' && 'text-right')}
              key={String(column.key)}
            >
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={getRowId(row, index)}>
            {columns.map((column) => (
              <TableCell
                className={cn(
                  column.align === 'right' && 'text-right',
                  column.mono && 'font-mono text-foreground tabular-nums',
                )}
                key={String(column.key)}
              >
                {String(row[column.key] ?? '')}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
