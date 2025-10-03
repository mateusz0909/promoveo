import { Metadata } from "next";

export const SITE_CONFIG: Metadata = {
    title: {
        default: "Lemmi Studio - From Code to 'Ready for Sale'",
        template: `%s | Lemmi Studio`
    },
    description: "You built the app. Let AI handle the launch. Go from final code to App Store-ready with an AI-powered go-live kit that creates your screenshots, copy, and landing page in minutes.",
    icons: {
        icon: [
            {
                url: "/icons/favicon-32x32.png",
                sizes: "32x32",
                type: "image/png",
            },
            {
                url: "/icons/favicon-16x16.png",
                sizes: "16x16",
                type: "image/png",
            },
            {
                url: "/icons/favicon.png",
                type: "image/png",
            }
        ],
        apple: [
            {
                url: "/icons/favicon.png",
                type: "image/png",
            }
        ]
    },
    openGraph: {
        title: "Lemmi Studio - From Code to 'Ready for Sale'",
        description: "You built the app. Let AI handle the launch. Go from final code to App Store-ready with an AI-powered go-live kit that creates your screenshots, copy, and landing page in minutes.",
        images: [
            {
                url: "/assets/og-image.png",
            }
        ]
    },
    twitter: {
        card: "summary_large_image",
        creator: "@lemmistudio",
        title: "Lemmi Studio - From Code to 'Ready for Sale'",
        description: "You built the app. Let AI handle the launch. Go from final code to App Store-ready with an AI-powered go-live kit that creates your screenshots, copy, and landing page in minutes.",
        images: [
            {
                url: "/assets/og-image.png",
            }
        ]
    },
    metadataBase: new URL("https://lemmistudio.com"),
};
