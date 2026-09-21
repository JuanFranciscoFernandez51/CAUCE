/**
 * Poner una contraseña nueva a un usuario de Cauce desde la terminal
 * (por si no podés entrar al panel). La clave se escribe oculta y se guarda
 * cifrada: nadie la puede leer después, ni vos ni nosotros.
 *
 *   npx tsx scripts/cambiar-clave.ts
 */
import fs from "node:fs";
import readline from "node:readline";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

for (const l of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
  const i = l.indexOf("=");
  if (i < 1 || l.trim().startsWith("#")) continue;
  process.env[l.slice(0, i).trim()] ||= l.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
}

function preguntar(texto: string, oculta = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (oculta) {
      // No mostrar lo que se tipea.
      (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
        if (s.includes(texto)) process.stdout.write(texto);
      };
    }
    rl.question(texto, (r) => {
      rl.close();
      if (oculta) process.stdout.write("\n");
      resolve(r.trim());
    });
  });
}

async function main() {
  const db = new PrismaClient();
  const username = await preguntar("Usuario: ");
  const u = await db.user.findUnique({ where: { username } });
  if (!u) {
    console.log(`No existe el usuario "${username}".`);
    return db.$disconnect();
  }
  const clave = await preguntar("Contraseña nueva (mín. 8): ", true);
  const otra = await preguntar("Repetila: ", true);
  if (clave.length < 8) console.log("Muy corta: tiene que tener al menos 8 caracteres.");
  else if (clave !== otra) console.log("No coinciden. No cambié nada.");
  else {
    await db.user.update({ where: { id: u.id }, data: { passwordHash: await bcrypt.hash(clave, 10) } });
    console.log(`Listo: "${username}" ya entra con la contraseña nueva.`);
  }
  await db.$disconnect();
}

main();
