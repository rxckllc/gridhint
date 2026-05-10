export function softwareAppJsonLd(opts: {
  name: string;
  description: string;
  breadcrumbs: Array<{ name: string; url: string }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: opts.name,
        applicationCategory: 'GameApplication',
        operatingSystem: 'Web',
        description: opts.description,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: opts.breadcrumbs.map((b, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: b.name,
          item: b.url,
        })),
      },
    ],
  };
}
