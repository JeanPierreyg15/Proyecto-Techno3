import { Instagram, Facebook, Twitter, Youtube, Link2, ExternalLink } from "lucide-react";

export type SocialPlatform =
    | "instagram"
    | "facebook"
    | "twitter"
    | "tiktok"
    | "youtube"
    | "other";

interface SocialProfilePreviewProps {
    platform: SocialPlatform;
    accountName: string;
    url: string;
}

const platformStyles: Record<SocialPlatform, { label: string; color: string }> = {
    instagram: { label: "Instagram", color: "#C13584" },
    facebook: { label: "Facebook", color: "#1877F2" },
    twitter: { label: "X / Twitter", color: "#000000" },
    tiktok: { label: "TikTok", color: "#111827" },
    youtube: { label: "YouTube", color: "#FF0033" },
    other: { label: "Red social", color: "#07625B" },
};

const platformIcons: Record<SocialPlatform, typeof Link2> = {
    instagram: Instagram,
    facebook: Facebook,
    twitter: Twitter,
    tiktok: Link2,
    youtube: Youtube,
    other: Link2,
};

function getUsername(url: string): string {
    try {
        const last = new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
        return last.includes(".php") ? "" : last.replace(/^@/, "");
    } catch {
        return "";
    }
}

export default function SocialProfilePreview({
    platform,
    accountName,
    url,
}: SocialProfilePreviewProps) {
    const style = platformStyles[platform];
    const Icon = platformIcons[platform];
    const username = getUsername(url);

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950">
            <div
                className="flex h-8 items-center gap-1.5 px-3 text-white"
                style={{ backgroundColor: style.color }}
            >
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">{style.label}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-2">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {accountName}
                    </p>

                    {username && (
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            @{username}
                        </p>
                    )}
                </div>

                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-md p-1.5 text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-gray-800"
                    title="Abrir perfil"
                    aria-label={`Abrir perfil de ${accountName}`}
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                </a>
            </div>
        </div>
    );
}