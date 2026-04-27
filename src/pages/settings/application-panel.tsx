import { Avatar, Card } from "@heroui/react";
import { useTranslation } from "react-i18next";

const openUrl = (url: string) => window.open(url, "_blank");

export default function ApplicationPanel() {
	const { t } = useTranslation();

	const appInfo = { name: "aghub", version: "0.1.0" };

	const teamMembers = [
		{
			name: "AkaraChen",
			role: t("headDev"),
			avatar: "https://avatars.githubusercontent.com/u/85140972?v=4",
			githubUrl: "https://github.com/AkaraChen",
		},
		{
			name: "Flacier",
			role: t("developer"),
			avatar: "https://avatars.githubusercontent.com/u/48170241?v=4",
			githubUrl: "https://github.com/Fldicoahkiin",
		},
		{
			name: "danielchim",
			role: t("designer"),
			avatar: "https://avatars.githubusercontent.com/u/12156547?v=4",
			githubUrl: "https://github.com/danielchim",
		},
	];

	return (
		<div className="space-y-4">
			<Card className="p-0">
				<Card.Content className="space-y-4 p-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<span className="text-sm font-medium text-(--foreground)">
								{t("appName")}
							</span>
							<span className="block text-xs text-muted">
								{appInfo.name}
							</span>
						</div>
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<span className="text-sm font-medium text-(--foreground)">
								{t("version")}
							</span>
							<span className="block text-xs text-muted">
								{appInfo.version}
							</span>
						</div>
					</div>

					</Card.Content>
			</Card>

			<Card className="p-0">
				<Card.Content className="p-4">
					<span className="text-sm font-medium text-(--foreground)">
						{t("team")}
					</span>
					<div className="mt-4 grid grid-cols-3 gap-4">
						{teamMembers.map((member) => (
							<button
								key={member.name}
								type="button"
								className="flex flex-col items-center text-center cursor-pointer"
								onClick={() => openUrl(member.githubUrl)}
							>
								<Avatar size="lg">
									<Avatar.Image
										src={member.avatar}
										alt={member.name}
									/>
								</Avatar>
								<span className="mt-2 text-sm font-medium">
									{member.name}
								</span>
								<span className="text-xs text-muted">
									{member.role}
								</span>
							</button>
						))}
					</div>
				</Card.Content>
			</Card>
		</div>
	);
}
