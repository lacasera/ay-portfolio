import "dotenv/config";
import { SearchSetup } from "./search-setup";

new SearchSetup()
  .run()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
