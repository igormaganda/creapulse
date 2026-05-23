export function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "CreaPulse V2",
    "description": "Bureau virtuel entrepreneurial pour la creation d'entreprise",
    "url": "https://creapulse.echo-entreprendre.fr",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" },
    "provider": {
      "@type": "Organization",
      "name": "Echo Entreprendre",
      "url": "https://echo-entreprendre.fr"
    },
    "inLanguage": "fr"
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}
