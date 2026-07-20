'use client'

import { Button } from '@micropreneur/ui/components/button'
import { Input } from '@micropreneur/ui/components/input'
import { NativeSelect, NativeSelectOption } from '@micropreneur/ui/components/native-select'
import { Skeleton } from '@micropreneur/ui/components/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@micropreneur/ui/components/table'
import { cn } from '@micropreneur/ui/lib/utils'
import { type ReactNode, useId, useMemo, useState } from 'react'

import { EmptyState } from './empty-state'

const loadingRowIds = ['loading-first', 'loading-second', 'loading-third'] as const

export interface FilterableDataTableColumn<T> {
  align?: 'left' | 'right'
  header: ReactNode
  id: string
  render: (row: T) => ReactNode
}

export interface FilterableDataTableOption {
  label: string
  value: string
}

export interface FilterableDataTableProps<T> {
  columns: readonly FilterableDataTableColumn<T>[]
  emptyDescription?: ReactNode
  emptyTitle?: ReactNode
  error?: ReactNode
  filterLabel?: string
  filterOptions?: readonly FilterableDataTableOption[]
  getFilterValue?: (row: T) => string
  getRowId: (row: T, index: number) => string
  getSearchText: (row: T) => string
  isLoading?: boolean
  rows: readonly T[]
  searchPlaceholder?: string
}

interface FilterRowsInput<T> {
  filter: string
  getFilterValue?: (row: T) => string
  getSearchText: (row: T) => string
  query: string
  rows: readonly T[]
}

export function filterDataTableRows<T>({
  filter,
  getFilterValue,
  getSearchText,
  query,
  rows,
}: FilterRowsInput<T>) {
  const normalizedQuery = query.trim().toLocaleLowerCase()

  return rows.filter((row) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      getSearchText(row).toLocaleLowerCase().includes(normalizedQuery)
    const matchesFilter =
      filter === 'all' || getFilterValue == null || getFilterValue(row) === filter
    return matchesQuery && matchesFilter
  })
}

export function FilterableDataTable<T>({
  columns,
  emptyDescription = 'Try a different search or clear the active filters.',
  emptyTitle = 'No matching records',
  error,
  filterLabel = 'Status',
  filterOptions = [],
  getFilterValue,
  getRowId,
  getSearchText,
  isLoading = false,
  rows,
  searchPlaceholder = 'Search records',
}: FilterableDataTableProps<T>) {
  const searchId = useId()
  const filterId = useId()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const visibleRows = useMemo(() => {
    return filterDataTableRows({ filter, getFilterValue, getSearchText, query, rows })
  }, [filter, getFilterValue, getSearchText, query, rows])

  const hasFilters = query.length > 0 || filter !== 'all'

  return (
    <div className="flex min-w-0 flex-col gap-3" data-slot="filterable-data-table">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor={searchId}>
            Search records
          </label>
          <Input
            id={searchId}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder={searchPlaceholder}
            type="search"
            value={query}
          />
        </div>
        {filterOptions.length > 0 && getFilterValue != null && (
          <div>
            <label className="sr-only" htmlFor={filterId}>
              {filterLabel}
            </label>
            <NativeSelect
              className="w-full sm:w-40"
              id={filterId}
              onChange={(event) => setFilter(event.currentTarget.value)}
              value={filter}
            >
              <NativeSelectOption value="all">{filterLabel}: All</NativeSelectOption>
              {filterOptions.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        )}
        <Button
          disabled={!hasFilters}
          onClick={() => {
            setQuery('')
            setFilter('all')
          }}
          type="button"
          variant="outline"
        >
          Clear filters
        </Button>
      </div>

      <p aria-live="polite" className="text-xs text-muted-foreground">
        {isLoading ? 'Loading records' : `${visibleRows.length} of ${rows.length} records`}
      </p>

      <div className="overflow-hidden rounded-xl border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead className={cn(column.align === 'right' && 'text-right')} key={column.id}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              loadingRowIds.map((rowId) => (
                <TableRow key={rowId}>
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      <Skeleton className="h-4 w-full max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && error != null && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyState
                    className="my-3 border-0 bg-transparent py-10"
                    description={error}
                    title="Unable to load records"
                  />
                </TableCell>
              </TableRow>
            )}
            {!isLoading && error == null && visibleRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyState
                    className="my-3 border-0 bg-transparent py-10"
                    description={emptyDescription}
                    title={emptyTitle}
                  />
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              error == null &&
              visibleRows.map((row, rowIndex) => (
                <TableRow key={getRowId(row, rowIndex)}>
                  {columns.map((column) => (
                    <TableCell
                      className={cn(column.align === 'right' && 'text-right')}
                      key={column.id}
                    >
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
