import type { Metadata } from "next";
import FollowList from "../FollowList";

export const metadata: Metadata = { title: "Following" };

export default async function FollowingPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <FollowList username={username} mode="following" />;
}
