import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { inr, number, dateTime } from '../../lib/format';
import { PageHeader, DataTable, Td } from '../../components/admin/AdminBits';
import { Spinner, EmptyState } from '../../components/ui';

export default function CustomersAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<any[]>('/admin/customers')
      .then((data) => setItems((data as any[]).map((item) => ({ ...item, id: item.id || item._id }))))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Customers" description="People who’ve ordered from Hungry Hut (tracked by mobile number)." />
      {loading ? <Spinner /> : items.length ? (
        <DataTable head={['Customer', 'Phone', 'Orders', 'Total spent', 'Last order']}>
          {items.map((item) => (
            <tr key={item.id || item.phone}>
              <Td><div className="font-semibold text-cream">{item.name || 'Guest'}</div><div className="text-xs text-smoke">{item.email || '—'}</div></Td>
              <Td className="text-muted">{item.phone}</Td>
              <Td>{number(item.orderCount || 0)}</Td>
              <Td className="font-semibold text-yellow">{inr(item.totalSpent || 0)}</Td>
              <Td className="text-smoke">{item.lastOrderAt ? dateTime(item.lastOrderAt) : '—'}</Td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="No customers yet" description="Customers will appear here once orders are placed." />
      )}
    </div>
  );
}
