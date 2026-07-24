import Link from 'next/link';

export default function Home() {
  return (
    <div className="container">
      <div className="card">
        <h1 className="title">Link Shortener + WhatsApp Click Tracking</h1>
        <p className="subtitle">
          Use the <code>/api/create</code> endpoint to generate short links per mobile
          number, then view results on the <Link href="/dashboard">dashboard</Link>.
        </p>
      </div>
    </div>
  );
}
