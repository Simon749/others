import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
const poolConnection = mysql.createPool({
  host: "host",
  user: "br-twilight-math-ad1rnfec",
  database: "br-twilight-math-ad1rnfec",
});
export  const db = drizzle({ client: poolConnection });