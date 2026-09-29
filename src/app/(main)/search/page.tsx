import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { getViewer } from "@/lib/auth";
import { searchPeople } from "@/lib/queries";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const viewer = await getViewer();
  const people = q.trim() ? await searchPeople(q, viewer) : [];
  return (
    <section className="view" aria-label="Search">
      <form className="search-bar" action="/search">
        <input className="input" type="search" name="q" defaultValue={q} placeholder="Search people" aria-label="Search people" />
      </form>
      {!q.trim() ? (
        <div className="empty">
          <h2>Search</h2>
          <p>Find someone by name or handle.</p>
        </div>
      ) : people.length === 0 ? (
        <div className="empty">
          <h2>No one named “{q.trim()}”</h2>
        </div>
      ) : (
        <ul className="people-list">
          {people.map((person) => (
            <li key={person.id}>
              <Link href={person.handle === "bart" ? "/" : `/u/${person.handle}`} className="person-row">
                <Avatar src={person.avatarUrl} name={person.displayName} size="md" />
                <span className="person-meta">
                  <span className="person-name">{person.displayName}</span>
                  <span className="person-sub">
                    @{person.handle}
                    {person.instagramHandle ? ` · Instagram @${person.instagramHandle}` : ""}
                    {person.instagramVerified ? "" : " · not verified"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
