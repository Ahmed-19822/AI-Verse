import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function setup() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const mediaExists = buckets.find(b => b.name === 'media');
    
    if (!mediaExists) {
      console.log('Creating media bucket...');
      const { data, error } = await supabase.storage.createBucket('media', { public: true });
      if (error) console.error('Error creating bucket:', error);
      else console.log('Bucket created!');
    } else {
      console.log('Media bucket already exists. Updating to public...');
      await supabase.storage.updateBucket('media', { public: true });
    }
    
    console.log('Done!');
  } catch(e) {
    console.error(e);
  }
}
setup();
