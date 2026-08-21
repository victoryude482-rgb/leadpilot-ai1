'use client';

export default function BusinessLink({ name, address, city, country, website }: { name: string; address?: string; city?: string; country?: string; website?: string }) {
  if (website) return <a href={website} target="_blank" rel="noreferrer">Website ↗</a>;
  const query = encodeURIComponent([name, address, city, country].filter(Boolean).join(' '));
  return <a href={`https://www.google.com/maps/search/${query}`} target="_blank" rel="noreferrer" aria-label={`Find ${name} on Google Maps`}>Find on Google Maps ↗</a>;
}
