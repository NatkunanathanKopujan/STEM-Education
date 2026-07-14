import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/super-admin/PageHeader';
import { StatusBadge } from '../../components/super-admin/StatusBadge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { SearchBar } from '../../components/ui/SearchBar';
import { SelectBox } from '../../components/ui/FormControls';
import { dashboardService } from '../../services/dashboardService';

export function UserOverviewPage() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    dashboardService
      .users()
      .then((response) => {
        if (mounted) setUsers(response.users || []);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const totals = ['Admin', 'Teacher', 'Student'].map((role) => ({
    role,
    count: users.filter((user) => user.role === role).length,
  }));

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery = Object.values(user).join(' ').toLowerCase().includes(normalized);
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [query, roleFilter, statusFilter, users]);

  if (isLoading) {
    return <Loader label="Loading users" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="User Overview" description="Search, filter, and review real admins, teachers, and students from the database." />
      <div className="grid gap-4 md:grid-cols-3">
        {totals.map((item) => (
          <Card key={item.role} className="p-5">
            <p className="text-sm font-semibold text-muted">All {item.role}s</p>
            <p className="mt-3 text-3xl font-bold text-primary">{item.count}</p>
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <SearchBar value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" />
          <SelectBox value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} options={[{ label: 'All Roles', value: 'All' }, { label: 'Admin', value: 'Admin' }, { label: 'Teacher', value: 'Teacher' }, { label: 'Student', value: 'Student' }]} />
          <SelectBox value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} options={[{ label: 'All Status', value: 'All' }, { label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]} />
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>{['Name', 'Username', 'Email', 'Role', 'Status'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {filteredUsers.map((user) => (
                <tr key={`${user.role}-${user.id}`} className="hover:bg-orange-50/40">
                  <td className="px-4 py-3 font-semibold text-ink">{user.fullName}</td>
                  <td className="px-4 py-3 text-muted">{user.username}</td>
                  <td className="px-4 py-3 text-muted">{user.email}</td>
                  <td className="px-4 py-3 text-muted">{user.role}</td>
                  <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filteredUsers.length ? (
          <div className="p-4">
            <EmptyState title="No users found" description="Only users created in the database will appear here." />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
