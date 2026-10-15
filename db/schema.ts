// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const progress=sqliteTable('progress',{
 userId:text('user_id').primaryKey(),
 state:text('state').notNull(),
 revision:integer('revision').notNull(),
 updatedAt:text('updated_at').notNull()
});
