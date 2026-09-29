import Link from "next/link";

export default function StoryNotFound() {
  return (
    <div className="story-screen">
      <div className="empty" style={{ color: "#fff" }}>
        <h2 style={{ color: "#fff" }}>Story unavailable</h2>
        <p>It may have expired, or it is not shared with you.</p>
        <p>
          <Link href="/" style={{ color: "#fff" }}>
            Close
          </Link>
        </p>
      </div>
    </div>
  );
}
