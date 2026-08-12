import { config } from '../config.js'

function getText(message) {
   const msg = message.message

   if (msg?.conversation) return msg.conversation
   if (msg?.extendedTextMessage?.text) return msg.extendedTextMessage.text
   if (msg?.imageMessage?.caption) return msg.imageMessage.caption
   if (msg?.videoMessage?.caption) return msg.videoMessage.caption

   return ''
}

function getSender(message) {
   return (
      message.key.participant ||
      message.key.remoteJid ||
      ''
   ).split(':')[0]
}

function isOwner(message) {
   const sender = getSender(message)
      .replace(/[^0-9]/g, '')

   const owner = String(config.owner)
      .replace(/[^0-9]/g, '')

   return sender === owner
}

function sleep(ms) {
   return new Promise(resolve => setTimeout(resolve, ms))
}

async function send(sock, jid, text, quoted) {
   return sock.sendMessage(
      jid,
      { text },
      { quoted }
   )
}

async function getGroups(sock) {
   const groups = await sock.groupFetchAllParticipating()

   return Object.values(groups)
      .map(group => group.id)
      .filter(id => id.endsWith('@g.us'))
}

export async function handleCommand(sock, m) {
   const jid = m.key.remoteJid

   if (!jid) return

   const text = getText(m).trim()

   if (!text.startsWith(config.prefix)) return

   const commandText =
      text.slice(config.prefix.length).trim()

   if (!commandText) return

   const args = commandText.split(/\s+/)
   const command = args.shift().toLowerCase()
   const input = args.join(' ').trim()

   // =========================
   // PING
   // =========================

   if (command === 'ping') {
      const start = Date.now()

      await send(
         sock,
         jid,
         '🏓 Pong!',
         m
      )

      const speed = Date.now() - start

      await send(
         sock,
         jid,
         `⚡ Response: ${speed} ms\n🤖 ${config.botName}`,
         m
      )

      return
   }

   // =========================
   // MENU
   // =========================

   if (command === 'menu' || command === 'help') {
      const menu = `
╭───「 ${config.botName} 」───
│
│ ⚡ General
│ ${config.prefix}ping
│ ${config.prefix}menu
│ ${config.prefix}owner
│
│ 📢 Owner
│ ${config.prefix}jpm <pesan>
│
╰────────────────────
      `.trim()

      await send(sock, jid, menu, m)
      return
   }

   // =========================
   // OWNER
   // =========================

   if (command === 'owner') {
      await send(
         sock,
         jid,
         `👑 Owner ${config.botName}\n\nNama : ${config.ownerName}\nNomor : +${config.owner}`,
         m
      )

      return
   }

   // =========================
   // JPM
   // =========================

   if (command === 'jpm') {
      if (!isOwner(m)) {
         await send(
            sock,
            jid,
            '❌ Command ini hanya dapat digunakan oleh owner.',
            m
         )

         return
      }

      if (!input) {
         await send(
            sock,
            jid,
            `❌ Masukkan pesan.\n\nContoh:\n${config.prefix}jpm Halo semuanya!`,
            m
         )

         return
      }

      try {
         await send(
            sock,
            jid,
            '⏳ Mengambil daftar grup...',
            m
         )

         const groups = await getGroups(sock)

         if (!groups.length) {
            await send(
               sock,
               jid,
               '❌ Bot tidak menemukan grup.',
               m
            )

            return
         }

         await send(
            sock,
            jid,
            `📢 JPM dimulai.\n\n👥 Total grup: ${groups.length}\n⏳ Mohon tunggu...`,
            m
         )

         let success = 0
         let failed = 0

         for (const groupId of groups) {
            try {
               await sock.sendMessage(
                  groupId,
                  {
                     text: input
                  }
               )

               success++

               // Jeda antar pengiriman
               await sleep(3000)

            } catch (error) {
               failed++

               console.log(
                  `❌ Gagal mengirim ke ${groupId}`,
                  error?.message || error
               )
            }
         }

         await send(
            sock,
            jid,
            `
╭───「 JPM SELESAI 」───
│
│ 📢 Pesan berhasil dikirim
│
│ ✅ Berhasil : ${success}
│ ❌ Gagal    : ${failed}
│ 👥 Total    : ${groups.length}
│
╰────────────────────
            `.trim(),
            m
         )

      } catch (error) {
         console.error('JPM Error:', error)

         await send(
            sock,
            jid,
            `❌ JPM gagal dijalankan.\n\nError: ${error?.message || 'Unknown error'}`,
            m
         )
      }

      return
   }

   // =========================
   // UNKNOWN COMMAND
   // =========================

   await send(
      sock,
      jid,
      `❌ Command tidak ditemukan.\n\nKetik ${config.prefix}menu untuk melihat menu.`,
      m
   )
}
