import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollections, getCollection } from "@/lib/content";
import CollectionPage from "@/components/CollectionPage";

interface Props {
  params: Promise<{ collection: string }>;
}

export async function generateStaticParams() {
  return getCollections().map((c) => ({ collection: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { collection: slug } = await params;
  const col = getCollection(slug);
  if (!col) return {};
  return {
    title: col.title,
    description: col.blurb,
  };
}

export default async function CollectionRoute({ params }: Props) {
  const { collection: slug } = await params;
  const col = getCollection(slug);
  if (!col) notFound();
  return <CollectionPage collection={col} />;
}
