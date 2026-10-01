// app/admin/daily-manager/layout.jsx
import Shell from '@/components/daily-manager/Shell';

export const metadata = { title: 'Daily Manager | Anna Chinese Restaurant' };

export default function DailyManagerLayout({ children }) {
  return <Shell>{children}</Shell>;
}
