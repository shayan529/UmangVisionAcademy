import React from "react";
import { Helmet } from "react-helmet-async";

const SEO = ({
  title,
  description = "Umang Vision Academy - Elevating your skills and knowledge with top-notch coaching and guidance.",
  name = "Umang Vision Academy",
  type = "website",
  image = "/Logo.png",
  url = window.location.href,
  keywords = "Coaching, Education, Learning, Academy, Umang Vision Academy",
}) => {
  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{title ? `${title} | Umang Vision Academy` : "Umang Vision Academy"}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph tags for social media sharing */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title ? `${title} | Umang Vision Academy` : "Umang Vision Academy"} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />

      {/* Twitter tags */}
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title ? `${title} | Umang Vision Academy` : "Umang Vision Academy"} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;
