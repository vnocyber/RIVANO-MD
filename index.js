import makeWASocket, {
   useMultiFileAuthState,
   DisconnectReason,
   fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'
import P from 'pino'
import readline from 'readline'
import fs from 'fs'
import { config } from './config.js'
import { handleCommand } from './lib/commands.js'

const authFolder = './session'

const question = (text) => {
   const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
   })

   return new Promise(resolve => {
      rl.question(text, answer => {
         rl.close()
         resolve(answer)
      })
   })
}

async function startBot() {
   const { state, saveCreds } = await useMultiFileAuthState(authFolder)
   const { version } = await fetchLatestBaileysVersion()

   const sock = makeWASocket({
      version,
      auth: state,
      logger: P({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ['RIVANO-MD', 'Chrome', '1.0.0'],
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: true
   })

   sock.ev.on('creds.update', saveCreds)

   if (!sock.authState.creds.registered && config.usePairingCode) {
      let phoneNumber = await question(
         '\n📱 Masukkan nomor WhatsApp bot\n> '
      )

      phoneNumber = phoneNumber
         .replace(/[^0-9]/g, '')

      if (!phoneNumber) {
         console.log('❌ Nomor tidak valid.')
         process.exit(1)
      }

      console.log('\n⏳ Meminta pairing code...\n')

      const code = await sock.requestPairingCode(phoneNumber)

      console.log('================================')
      console.log('🔑 PAIRING CODE')
      console.log('================================')
      console.log(code)
      console.log('================================')
      console.log('Masukkan kode tersebut di WhatsApp.')
      console.log('================================\n')
   }

   sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
      if (connection === 'open') {
         console.log('\n================================')
         console.log(`🤖 ${config.botName}`)
         console.log('✅ BOT BERHASIL TERHUBUNG')
         console.log(`👑 Owner : ${config.owner}`)
         console.log(`⚡ Prefix: ${config.prefix}`)
         console.log('================================\n')
      }

      if (connection === 'close') {
         const statusCode =
            lastDisconnect?.error?.output?.statusCode

         const shouldReconnect =
            statusCode !== DisconnectReason.loggedOut

         console.log('\n❌ Koneksi terputus.')

         if (shouldReconnect) {
            console.log('🔄 Menghubungkan kembali...\n')
            startBot()
         } else {
            console.log('🚪 Session logout.')
            console.log('Hapus folder session lalu jalankan kembali bot.')
         }
      }
   })

   sock.ev.on('messages.upsert', async ({ messages }) => {
      try {
         const m = messages[0]

         if (!m.message) return
         if (m.key.fromMe) return

         await handleCommand(sock, m)
      } catch (error) {
         console.error('Command Error:', error)
      }
   })
}

startBot().catch(error => {
   console.error('Fatal Error:', error)
})
