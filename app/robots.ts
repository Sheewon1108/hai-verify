// Copyright 2026 KARAM. All Rights Reserved.

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/rooms", "/rooms/", "/api/private-rooms"],
    },
    sitemap: undefined,
  };
}
