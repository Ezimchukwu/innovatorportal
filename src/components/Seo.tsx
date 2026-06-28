import React from "react";
import { Helmet } from "react-helmet-async";

export const SeoHelmetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => children as React.ReactElement;

interface SeoProps {
  title: string;
  description: string;
  canonical?: string;
  keywords?: string;
}

export const Seo: React.FC<SeoProps> = ({ title, description, canonical, keywords }) => {
  const fullTitle = `${title} | AI Innovators Portal`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {canonical && <link rel="canonical" href={canonical} />}
    </Helmet>
  );
};
