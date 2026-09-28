const url = 'https://ihjehauwzxuvjvrykhwx.supabase.co';
const key = 'sb_publishable_iVlvzSYao3zq8GJeK3MSNw_jEiJQSJ8';

async function main() {
  try {
    const res = await fetch(`${url}/rest/v1/?apikey=${key}`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    if (!res.ok) {
      console.log('Root failed:', res.status, res.statusText);
      return;
    }
    const schema = await res.json();
    const tables = Object.keys(schema.definitions || {});
    console.log('TABLES FOUND:', tables);
    for (const t of tables) {
      console.log(`Table: ${t}`);
      const props = schema.definitions[t]?.properties || {};
      console.log('  Columns:', Object.keys(props));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
