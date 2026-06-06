const { Client } = require('pg');

const conn = process.env.DB_URL;
if (!conn) {
  console.error('Set DB_URL env var');
  process.exit(1);
}

const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });

(async () => {
  await client.connect();

  // Enforce read-only at the session level — belt and suspenders
  await client.query('SET default_transaction_read_only = on');
  await client.query('SET statement_timeout = 30000');

  // 1) List user schemas
  const schemas = await client.query(`
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name NOT IN ('pg_catalog','information_schema','pg_toast')
      AND schema_name NOT LIKE 'pg_temp_%'
      AND schema_name NOT LIKE 'pg_toast_temp_%'
    ORDER BY schema_name
  `);
  console.log('=== Schemas ===');
  schemas.rows.forEach(r => console.log('  ' + r.schema_name));

  // 2) List tables/views per schema with row count estimates
  const tables = await client.query(`
    SELECT n.nspname AS schema,
           c.relname AS name,
           CASE c.relkind WHEN 'r' THEN 'table' WHEN 'v' THEN 'view' WHEN 'm' THEN 'matview' WHEN 'p' THEN 'partitioned' ELSE c.relkind::text END AS kind,
           c.reltuples::bigint AS est_rows,
           pg_size_pretty(pg_total_relation_size(c.oid)) AS size
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r','v','m','p')
      AND n.nspname NOT IN ('pg_catalog','information_schema')
    ORDER BY n.nspname, c.relname
  `);
  console.log('\n=== Tables / Views ===');
  for (const r of tables.rows) {
    console.log(`  ${r.schema}.${r.name}  [${r.kind}]  est_rows=${r.est_rows}  size=${r.size}`);
  }

  // 3) Columns per table
  const cols = await client.query(`
    SELECT table_schema, table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema NOT IN ('pg_catalog','information_schema')
    ORDER BY table_schema, table_name, ordinal_position
  `);
  console.log('\n=== Columns ===');
  let cur = '';
  for (const r of cols.rows) {
    const key = `${r.table_schema}.${r.table_name}`;
    if (key !== cur) {
      cur = key;
      console.log(`\n  ${key}`);
    }
    const def = r.column_default ? `  default=${r.column_default}` : '';
    const nul = r.is_nullable === 'YES' ? '  NULL' : '  NOT NULL';
    console.log(`    ${r.column_name}: ${r.data_type}${nul}${def}`);
  }

  // 4) Primary keys + foreign keys (handy for understanding the model)
  const keys = await client.query(`
    SELECT tc.table_schema, tc.table_name, tc.constraint_name, tc.constraint_type,
           kcu.column_name,
           ccu.table_schema AS ref_schema, ccu.table_name AS ref_table, ccu.column_name AS ref_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type IN ('PRIMARY KEY','FOREIGN KEY','UNIQUE')
      AND tc.table_schema NOT IN ('pg_catalog','information_schema')
    ORDER BY tc.table_schema, tc.table_name, tc.constraint_type, tc.constraint_name
  `);
  console.log('\n=== Keys & Constraints ===');
  let curT = '';
  for (const r of keys.rows) {
    const key = `${r.table_schema}.${r.table_name}`;
    if (key !== curT) {
      curT = key;
      console.log(`\n  ${key}`);
    }
    if (r.constraint_type === 'FOREIGN KEY') {
      console.log(`    FK ${r.column_name} -> ${r.ref_schema}.${r.ref_table}.${r.ref_column}`);
    } else {
      console.log(`    ${r.constraint_type}: ${r.column_name}`);
    }
  }

  // 5) Indexes
  const idx = await client.query(`
    SELECT schemaname AS schema, tablename AS table, indexname AS name, indexdef
    FROM pg_indexes
    WHERE schemaname NOT IN ('pg_catalog','information_schema')
    ORDER BY schemaname, tablename, indexname
  `);
  console.log('\n=== Indexes ===');
  for (const r of idx.rows) {
    console.log(`  ${r.schema}.${r.table}: ${r.name}`);
    console.log(`    ${r.indexdef}`);
  }

  // 6) Functions/procedures (user-defined)
  const funcs = await client.query(`
    SELECT n.nspname AS schema, p.proname AS name,
           pg_get_function_result(p.oid) AS returns,
           pg_get_function_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname NOT IN ('pg_catalog','information_schema')
    ORDER BY n.nspname, p.proname
  `);
  console.log('\n=== Functions ===');
  if (funcs.rows.length === 0) console.log('  (none)');
  for (const r of funcs.rows) {
    console.log(`  ${r.schema}.${r.name}(${r.args}) -> ${r.returns}`);
  }

  // 7) Extensions
  const ext = await client.query(`SELECT extname, extversion FROM pg_extension ORDER BY extname`);
  console.log('\n=== Extensions ===');
  ext.rows.forEach(r => console.log(`  ${r.extname} ${r.extversion}`));

  await client.end();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
