import {
  AuthCard,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DashboardShell,
  DataGrid,
  EmptyState,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FilterableDataTable,
  type FilterableDataTableColumn,
  IndexLabel,
  Input,
  LedgerList,
  LedgerRow,
  MarginNote,
  MilestoneMarker,
  Milestones,
  SettingsLayout,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@micropreneur/elements'
import type { ReactNode } from 'react'

interface RecordRow {
  id: string
  name: string
  owner: string
  status: 'active' | 'review' | 'archived'
  updated: string
}

const records: RecordRow[] = [
  { id: '1', name: 'Project Apollo', owner: 'Sarah Chen', status: 'active', updated: 'May 12' },
  { id: '2', name: 'Project Zephyr', owner: 'James Park', status: 'review', updated: 'May 11' },
  { id: '3', name: 'Project Orion', owner: 'Maya Patel', status: 'archived', updated: 'May 10' },
]

const recordColumns: readonly FilterableDataTableColumn<RecordRow>[] = [
  { id: 'name', header: 'Name', render: (row) => <span className="font-medium">{row.name}</span> },
  { id: 'owner', header: 'Owner', render: (row) => row.owner },
  {
    id: 'status',
    header: 'Status',
    render: (row) => (
      <StatusBadge status={row.status === 'active' ? 'positive' : 'neutral'}>
        {row.status === 'review' ? 'Needs review' : row.status}
      </StatusBadge>
    ),
  },
  { id: 'updated', header: 'Updated', render: (row) => row.updated },
]

function ButtonPreview() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="destructive">Delete</Button>
    </div>
  )
}

function CardPreview() {
  return (
    <Card className="w-full max-w-md gap-0 py-0" size="sm">
      <CardHeader className="pt-4">
        <CardTitle>Project Apollo</CardTitle>
        <CardDescription>Build the future. Ship with confidence.</CardDescription>
        <CardAction>
          <StatusBadge status="positive">Active</StatusBadge>
        </CardAction>
      </CardHeader>
      <CardContent className="py-4">
        <p className="text-sm text-muted-foreground">Updated two hours ago by Sarah Chen.</p>
      </CardContent>
      <CardFooter className="justify-between text-xs text-muted-foreground">
        <span>Operations</span>
        <span className="font-mono">AP-104</span>
      </CardFooter>
    </Card>
  )
}

function BadgePreview() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
    </div>
  )
}

function TablePreview() {
  return (
    <div className="w-full max-w-lg overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Object</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Project Apollo</TableCell>
            <TableCell>Active</TableCell>
            <TableCell className="text-right font-mono">$12,450</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Project Zephyr</TableCell>
            <TableCell>Review</TableCell>
            <TableCell className="text-right font-mono">$8,230</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

function StatusBadgePreview() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <StatusBadge status="positive">Active</StatusBadge>
      <StatusBadge status="warning">Needs review</StatusBadge>
      <StatusBadge status="destructive">Blocked</StatusBadge>
      <StatusBadge>Archived</StatusBadge>
    </div>
  )
}

function DataGridPreview() {
  const rows: Array<Record<string, unknown>> = [
    { name: 'Project Apollo', owner: 'Sarah Chen', value: '$12,450' },
    { name: 'Project Zephyr', owner: 'James Park', value: '$8,230' },
  ]

  return (
    <div className="w-full max-w-lg overflow-hidden rounded-lg border bg-card">
      <DataGrid
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'owner', label: 'Owner' },
          { key: 'value', label: 'Value', align: 'right', mono: true },
        ]}
        getRowId={(row) => String(row.name)}
        rows={rows}
      />
    </div>
  )
}

function LedgerListPreview() {
  return (
    <LedgerList className="w-full max-w-md rounded-lg border bg-card">
      <LedgerRow
        figure="$12.4k"
        index={<IndexLabel value={1} />}
        meta="Sarah Chen"
        name="Project Apollo"
        selected
        status={<StatusBadge status="positive">Active</StatusBadge>}
      />
      <LedgerRow
        figure="$8.2k"
        index={<IndexLabel value={2} />}
        meta="James Park"
        name="Project Zephyr"
        status={<StatusBadge status="warning">Review</StatusBadge>}
      />
    </LedgerList>
  )
}

function MarginNotePreview() {
  return (
    <MarginNote>
      Keep provider SDKs at the edge. Application code should depend on the port.
    </MarginNote>
  )
}

function IndexLabelPreview() {
  return (
    <div className="flex items-center gap-5">
      <IndexLabel value={1} />
      <IndexLabel value={8} />
      <IndexLabel value={24} />
    </div>
  )
}

function MilestoneMarkerPreview() {
  return (
    <Milestones className="w-full max-w-sm">
      <MilestoneMarker meta="Complete" status="done" title="Foundation" />
      <MilestoneMarker meta="In progress" status="current" title="Registry" />
      <MilestoneMarker meta="Next" title="Launch" />
    </Milestones>
  )
}

function EmptyStatePreview() {
  return (
    <EmptyState
      action={<Button size="sm">Create record</Button>}
      className="w-full max-w-lg py-8"
      description="Create your first object to begin shaping this workspace."
      title="Nothing here yet"
    />
  )
}

function DashboardShellPreview() {
  return (
    <DashboardShell
      brand="Acme"
      className="min-h-0 w-full max-w-2xl md:grid-cols-[9rem_minmax(0,1fr)]"
      header={<span className="text-sm font-medium">Overview</span>}
      metrics={[
        { label: 'Revenue', value: '$24.1k', detail: '+12.5%' },
        { label: 'Orders', value: '1,429', detail: '+8.1%' },
        { label: 'Customers', value: '892', detail: '+6.3%' },
      ]}
      navItems={[
        { label: 'Overview', href: '#preview', active: true },
        { label: 'Analytics', href: '#preview' },
        { label: 'Customers', href: '#preview' },
      ]}
    >
      <div className="h-20 rounded-lg border bg-card p-3 text-xs text-muted-foreground">
        Your product content starts here.
      </div>
    </DashboardShell>
  )
}

function AuthCardPreview() {
  return (
    <AuthCard
      forgotPasswordHref="#preview"
      onSubmit={(event) => event.preventDefault()}
      socialAction={
        <Button className="w-full" type="button" variant="outline">
          Continue with Google
        </Button>
      }
    />
  )
}

function SettingsLayoutPreview() {
  return (
    <SettingsLayout
      className="w-full max-w-2xl"
      description="Manage your personal account."
      heading="Settings"
      items={[
        {
          label: 'Profile',
          description: 'Your personal information',
          href: '#preview',
          active: true,
        },
        { label: 'Account', description: 'Authentication and security', href: '#preview' },
      ]}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="preview-name">Full name</FieldLabel>
          <Input defaultValue="Sarah Chen" id="preview-name" />
          <FieldDescription>Shown across your workspace.</FieldDescription>
        </Field>
        <Button className="self-start">Save changes</Button>
      </FieldGroup>
    </SettingsLayout>
  )
}

function FilterableDataTablePreview() {
  return (
    <div className="w-full max-w-2xl">
      <FilterableDataTable
        columns={recordColumns}
        filterOptions={[
          { label: 'Active', value: 'active' },
          { label: 'Needs review', value: 'review' },
          { label: 'Archived', value: 'archived' },
        ]}
        getFilterValue={(row) => row.status}
        getRowId={(row) => row.id}
        getSearchText={(row) => `${row.name} ${row.owner}`}
        rows={records}
      />
    </div>
  )
}

const previews = {
  'auth-card': AuthCardPreview,
  badge: BadgePreview,
  button: ButtonPreview,
  card: CardPreview,
  'dashboard-shell': DashboardShellPreview,
  'data-grid': DataGridPreview,
  'empty-state': EmptyStatePreview,
  'filterable-data-table': FilterableDataTablePreview,
  'index-label': IndexLabelPreview,
  'ledger-list': LedgerListPreview,
  'margin-note': MarginNotePreview,
  'milestone-marker': MilestoneMarkerPreview,
  'settings-layout': SettingsLayoutPreview,
  'status-badge': StatusBadgePreview,
  table: TablePreview,
} satisfies Record<string, () => ReactNode>

export const previewNames = Object.keys(previews)

export function ElementPreview({ name }: { name: string }) {
  const Preview = previews[name as keyof typeof previews]

  if (Preview == null) {
    return <p className="text-sm text-muted-foreground">Preview unavailable.</p>
  }

  return <Preview />
}
