import "dotenv/config";
import {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  InteractionType,
} from "discord.js";
import { formatFlagsKo } from "./risk-labels.mjs";

const token = process.env.DISCORD_TOKEN;
const apiUrl = (process.env.HAI_VERIFY_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

if (!token) {
  console.error("Set DISCORD_TOKEN in discord-bot/.env");
  process.exit(1);
}

async function runVerification(text) {
  const res = await fetch(`${apiUrl}/api/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: text }),
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? `API error ${res.status}`);
  }
  return data;
}

function trustColor(trustIndex) {
  if (trustIndex >= 70) return 0x34d399;
  if (trustIndex >= 45) return 0xfbbf24;
  return 0xfb923c;
}

function buildVerifyEmbed(result, preview) {
  const embed = new EmbedBuilder()
    .setColor(trustColor(result.trustIndex))
    .setTitle("HAI Verify · Karam Trust Report")
    .setDescription(preview.length > 200 ? `${preview.slice(0, 200)}…` : preview)
    .addFields(
      { name: "Trust Index", value: `**${result.trustIndex}** / 100`, inline: true },
      { name: "Hallucination risk", value: `**${result.hallucinationRisk}** / 100`, inline: true },
      {
        name: "Human review",
        value: result.humanReviewRequired ? "권장" : "불필요",
        inline: true,
      },
      { name: "Risk flags", value: formatFlagsKo(result.riskFlags) },
      { name: "Summary", value: result.summary.slice(0, 900) || "—" },
      { name: "Next step", value: result.recommendedNextStep.slice(0, 900) || "—" },
    )
    .setFooter({ text: "75-point baseline · POST /api/verify · Mock phase" })
    .setTimestamp();

  return embed;
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  console.log(`HAI Verify bot online as ${client.user.tag}`);
  console.log(`API: ${apiUrl}/api/verify`);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.type !== InteractionType.ApplicationCommand) return;

  if (interaction.commandName === "hai-verify-help") {
    await interaction.reply({
      ephemeral: true,
      content: [
        "**HAI Verify Discord (step 2+)**",
        "",
        "`/hai-verify text:<AI 출력>` — Trust Index 검증",
        "",
        "• Next.js가 켜져 있어야 해요: `npm run dev` (루트)",
        "• 봇: `cd discord-bot && npm start`",
        "• 명령 등록: `npm run register`",
        "",
        "웹: /verify (무료) · /order (Mock Money Entrance)",
      ].join("\n"),
    });
    return;
  }

  if (interaction.commandName !== "hai-verify") return;

  const text = interaction.options.getString("text", true).trim();
  if (!text) {
    await interaction.reply({ ephemeral: true, content: "검증할 텍스트를 입력해 주세요." });
    return;
  }

  await interaction.deferReply();

  try {
    const result = await runVerification(text);
    await interaction.editReply({ embeds: [buildVerifyEmbed(result, text)] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Verification failed";
    await interaction.editReply({
      content: `검증 API 연결 실패: ${msg}\n\n\`npm run dev\` 로 ${apiUrl} 이 켜져 있는지 확인해 주세요.`,
    });
  }
});

client.login(token);
