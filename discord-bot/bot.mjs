import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const require = createRequire(import.meta.url);
require("../scripts/lib/load-vault-env.cjs").loadVaultIntoEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(process.env.USERPROFILE ?? "", "secrets", "discord-bot.env") });
dotenv.config({ path: path.join(__dirname, ".env") });
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  InteractionType,
} from "discord.js";

const token = process.env.DISCORD_TOKEN;
const apiUrl = (process.env.HAI_VERIFY_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
const siteUrl = (process.env.HAI_SITE_URL ?? apiUrl).replace(/\/$/, "");
const apiKey = process.env.HAI_INTERNAL_API_KEY ?? process.env.HAI_VERIFY_API_KEY ?? "";

if (!token) {
  console.error("Set DISCORD_TOKEN in discord-bot/.env");
  process.exit(1);
}

async function runVerification(text) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const res = await fetch(`${apiUrl}/api/verify`, {
    method: "POST",
    headers,
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

function buildScoreReply(result) {
  const embed = new EmbedBuilder()
    .setColor(trustColor(result.trustIndex))
    .setTitle("HAI Verify · Trust Score")
    .addFields(
      { name: "Trust Index", value: `**${result.trustIndex}** / 100`, inline: true },
      { name: "Hallucination Risk", value: `**${result.hallucinationRisk}** / 100`, inline: true },
    )
    .setFooter({ text: "Score only · Full report available on the website" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Full Report →")
      .setStyle(ButtonStyle.Link)
      .setURL(`${siteUrl}/order`),
  );

  return { embeds: [embed], components: [row] };
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
        "**HAI Verify Discord**",
        "",
        "`/hai-verify text:<AI 출력>` — Trust Index · Hallucination Risk 점수 반환",
        "",
        "• 점수는 무료 · 전체 리포트는 Full Report 버튼으로 구매",
        "• Next.js가 켜져 있어야 해요: `npm run dev` (루트)",
        "• 봇: `cd discord-bot && npm start`",
        "• 명령 등록: `npm run register`",
        "",
        `전체 리포트: ${siteUrl}/order`,
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
    await interaction.editReply(buildScoreReply(result));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Verification failed";
    await interaction.editReply({
      content: `검증 API 연결 실패: ${msg}\n\n\`npm run dev\` 로 ${apiUrl} 이 켜져 있는지 확인해 주세요.`,
    });
  }
});

client.login(token);
