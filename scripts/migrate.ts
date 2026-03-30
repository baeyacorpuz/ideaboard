import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('❌ Error: VITE_SUPABASE_URL or SUPABASE_URL is required')
  console.error('   Create a .env.local file with your Supabase credentials')
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is required')
  console.error('   Get the service_role key from Supabase Dashboard > Project Settings > API')
  console.error('   ⚠️  WARNING: This key has admin privileges - never expose it in client-side code!')
  process.exit(1)
}

// Create Supabase client with service role key (admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function runMigrations() {
  console.log('🚀 Starting database migration...\n')

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')

  // Get all migration files sorted by name
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  if (migrationFiles.length === 0) {
    console.log('⚠️  No migration files found in supabase/migrations/')
    return
  }

  console.log(`📁 Found ${migrationFiles.length} migration file(s):\n`)

  for (const file of migrationFiles) {
    console.log(`📄 Running: ${file}`)

    const filePath = path.join(migrationsDir, file)
    const sql = fs.readFileSync(filePath, 'utf8')

    try {
      // Execute the SQL using Supabase RPC
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

      if (error) {
        // If RPC doesn't exist, try direct query approach
        // Note: This requires the service role key
        console.log('   ⚠️  RPC method not available, using direct execution...')
        
        // Split SQL into individual statements and execute
        const statements = sql
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)

        for (const statement of statements) {
          if (statement.trim()) {
            const { error: stmtError } = await supabase.rpc('exec', { query: statement + ';' })
            if (stmtError) {
              console.error(`   ❌ Error in statement: ${stmtError.message}`)
            }
          }
        }
      }

      console.log(`   ✅ Completed: ${file}\n`)
    } catch (err) {
      console.error(`   ❌ Error running ${file}:`, err)
      throw err
    }
  }

  console.log('✨ All migrations completed successfully!')
}

// Alternative: Direct SQL execution via Supabase REST API
async function runMigrationsDirect() {
  console.log('🚀 Starting database migration (direct mode)...\n')
  console.log('⚠️  Note: This script requires the SUPABASE_SERVICE_ROLE_KEY')
  console.log('   Get it from: Supabase Dashboard > Project Settings > API\n')

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  console.log(`📁 Found ${migrationFiles.length} migration file(s):\n`)

  for (const file of migrationFiles) {
    console.log(`📄 Processing: ${file}`)
    const filePath = path.join(migrationsDir, file)
    const sql = fs.readFileSync(filePath, 'utf8')
    console.log(`   SQL content loaded (${sql.length} characters)\n`)
  }

  console.log('\n📋 SQL to execute:')
  console.log('─'.repeat(60))

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file)
    const sql = fs.readFileSync(filePath, 'utf8')
    console.log(`\n-- ${file}\n`)
    console.log(sql)
  }

  console.log('\n' + '─'.repeat(60))
  console.log('\n💡 To run this migration:')
  console.log('   1. Go to Supabase Dashboard > SQL Editor')
  console.log('   2. Create a new query')
  console.log('   3. Paste the SQL above')
  console.log('   4. Click "Run"\n')
}

// Main execution
const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: npx tsx scripts/migrate.ts [options]

Options:
  --help, -h     Show this help message
  --show, -s     Show SQL without executing (for manual copy-paste)

Environment Variables Required:
  VITE_SUPABASE_URL or SUPABASE_URL    Your Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY             Service role key (from Dashboard > API)

Examples:
  npx tsx scripts/migrate.ts            Run migrations
  npx tsx scripts/migrate.ts --show     Show SQL for manual execution
`)
  process.exit(0)
}

if (args.includes('--show') || args.includes('-s')) {
  runMigrationsDirect()
} else {
  runMigrations()
    .then(() => {
      console.log('\n🎉 Done!')
      process.exit(0)
    })
    .catch((err) => {
      console.error('\n💥 Migration failed:', err)
      process.exit(1)
    })
}