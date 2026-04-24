import { redirect } from 'next/navigation';

export default function Home() {
  // With our AppLayout, we can just redirect to the dashboard.
  // The layout will catch unauthorized users and send them to /login
  redirect('/dashboard');
}
