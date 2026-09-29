import { FollowList } from "@/components/FollowList";

export default function Page({ params }: { params: Promise<{ handle: string }> }) {
  return <FollowList params={params} kind="following" />;
}
