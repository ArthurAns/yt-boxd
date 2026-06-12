import type { Metadata } from "next";
import FollowList from "../FollowList";

export const metadata: Metadata = { title: "Followers" };

export default async function FollowersPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <FollowList username={username} mode="followers" />;
}
