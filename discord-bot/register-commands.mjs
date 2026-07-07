import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const require = createRequire(import.meta.url);
require("../scripts/lib/load-vault-env.cjs").loadVaultIntoEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(process.env.USERPROFILE ?? "", "secrets", "discord-bot.env") });
dotenv.config({ path: path.join(__dirname, ".env") });
import { REST, Routes, SlashCommandBuilder } from "discord.js";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId) {
  console.error("Set DISCORD_TOKEN and DISCORD_CLIENT_ID in discord-bot/.env");
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName("hai-verify")
    .setDescription("HAI Verify — AI 텍스트 Trust Index 검증")
    .addStringOption((opt) =>
      opt
        .setName("text")
        .setDescription("검증할 AI 출력 텍스트")
        .setRequired(true)
        .setMaxLength(4000),
    ),
  new SlashCommandBuilder()
    .setName("hai-verify-help")
    .setDescription("HAI Verify Discord 사용법"),
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(token);

try {
  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log(`Registered ${commands.length} guild commands on ${guildId}`);
  } else {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log(`Registered ${commands.length} global commands (may take up to 1 hour)`);
  }
} catch (err) {
  console.error(err);
  process.exit(1);
}
