import React from "react";
import { Helmet } from "react-helmet-async";

export const SeoHelmetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => children as React.ReactElement;

interface SeoProps {
  title: string;
  description: string;
  canonical?: string;
}

export const Seo: React.FC<SeoProps> = ({ title, description, canonical }) => {
  const fullTitle = `${title} | AI Innovators Portal`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
    </Helmet>
  );
};
