import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty">
      <h2>Not available</h2>
      <p>That page is not here, or it is not shared with you.</p>
      <p>
        <Link href="/">Back to Atelier</Link>
      </p>
    </div>
  );
}
