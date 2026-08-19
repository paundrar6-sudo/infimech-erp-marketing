import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SeoHead({
  title,
  metaTitle,
  metaDescription,
  focusKeyword,
  metaRobots,
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogImage,
  ogType,
  schemaJson
}) {
  const displayTitle = metaTitle || title || "Infimech Marketing ERP & Digital Engineering Solutions";
  const displayDesc = metaDescription || "Platform Manajemen Marketing ERP, Analisis Leads, Campaign Tracking, dan Layanan Simulasi CFD & Analisis FEA Presisi Tinggi.";
  const displayKeyword = focusKeyword || "erp marketing, simulasi cfd, analisis fea, engineering software";
  const displayRobots = metaRobots || "index, follow";
  const displayOgTitle = ogTitle || displayTitle;
  const displayOgDesc = ogDescription || displayDesc;
  const displayOgImage = ogImage || "https://infimech.co.id/assets/images/cfd_aero.png";
  const displayOgType = ogType || "website";
  const displayCanonical = canonicalUrl || "https://infimech.co.id/";

  let parsedSchema = null;
  if (schemaJson) {
    if (typeof schemaJson === 'object') {
      parsedSchema = JSON.stringify(schemaJson);
    } else if (typeof schemaJson === 'string' && schemaJson.trim()) {
      try {
        JSON.parse(schemaJson);
        parsedSchema = schemaJson;
      } catch (e) {
        console.warn('Invalid schema JSON in SeoHead:', e);
      }
    }
  }

  if (!parsedSchema) {
    parsedSchema = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Infimech Engineering",
      "url": "https://infimech.co.id",
      "logo": "https://infimech.co.id/assets/images/logo.png",
      "description": displayDesc
    });
  }

  return (
    <Helmet>
      {/* Standard HTML Meta Tags */}
      <title>{displayTitle}</title>
      <meta name="description" content={displayDesc} />
      <meta name="keywords" content={displayKeyword} />
      <meta name="robots" content={displayRobots} />
      {displayCanonical && <link rel="canonical" href={displayCanonical} />}

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={displayOgTitle} />
      <meta property="og:description" content={displayOgDesc} />
      <meta property="og:image" content={displayOgImage} />
      <meta property="og:type" content={displayOgType} />
      <meta property="og:url" content={displayCanonical} />
      <meta property="og:site_name" content="Infimech ERP Marketing" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={displayOgTitle} />
      <meta name="twitter:description" content={displayOgDesc} />
      <meta name="twitter:image" content={displayOgImage} />

      {/* Schema JSON-LD */}
      {parsedSchema && (
        <script type="application/ld+json">
          {parsedSchema}
        </script>
      )}
    </Helmet>
  );
}
