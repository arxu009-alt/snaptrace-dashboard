import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ maxWidth: '600px', margin: '100px auto', textAlign: 'center', color: '#fff', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '12px' }}>Welcome to SnapTrace</h1>
      <p style={{ margin: '20px 0', color: '#aaa' }}>Application performance and crash monitoring platform.</p>
      
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px' }}>
        <Link
          href="/login"
          style={{ padding: '10px 20px', borderRadius: '6px', backgroundColor: '#10b981', color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}
        >
          Log In
        </Link>
        <Link
          href="/signup"
          style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#222', color: '#fff', textDecoration: 'none' }}
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}